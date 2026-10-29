"""Build an opt-in instrumentation APK with the existing JDK/SDK/debug key; no Gradle changes."""
from pathlib import Path
import os,subprocess,zipfile
root=Path(__file__).resolve().parents[2];phase=os.environ.get('MARKREAD_QA_PHASE','ui-p3f');assert phase in ('ui-p3f','ui-p3fr','ui-p3fr2');out=root/'build'/phase/'probe';out.mkdir(parents=True,exist_ok=True)
jdk=next((root/'toolchain/jdk').glob('jdk-17*'))/'bin';sdk=root/'toolchain/android-sdk';bt=sdk/'build-tools/34.0.0';platform=sdk/'platforms/android-35/android.jar'
def run(args):subprocess.run([str(x) for x in args],cwd=root,check=True)
classes=out/'classes';classes.mkdir(exist_ok=True);dex=out/'dex';dex.mkdir(exist_ok=True)
run([jdk/'javac.exe','-source','8','-target','8','-encoding','UTF-8','-classpath',platform,'-d',classes,root/'qa/android/P3FInstrumentation.java'])
jar=out/'classes.jar'
with zipfile.ZipFile(jar,'w') as z:
 for p in classes.rglob('*.class'):z.write(p,p.relative_to(classes))
run([jdk/'java.exe','-cp',bt/'lib/d8.jar','com.android.tools.r8.D8','--min-api','26','--lib',platform,'--output',dex,jar])
unsigned=out/'unsigned.apk';run([bt/'aapt2.exe','link','-I',platform,'--manifest',root/'qa/android/P3FTestManifest.xml','-o',unsigned])
with zipfile.ZipFile(unsigned,'a',compression=zipfile.ZIP_DEFLATED) as z:z.write(dex/'classes.dex','classes.dex')
aligned=out/'aligned.apk';run([bt/'zipalign.exe','-f','4',unsigned,aligned])
keys=list((root/'build/android-build-gate/android-user').rglob('debug.keystore'))
if not keys:keys=[Path(os.environ['USERPROFILE'])/'.android/debug.keystore']
if not keys[0].exists():raise RuntimeError('Existing debug keystore required; production release key is never used')
run([jdk/'java.exe','-jar',bt/'lib/apksigner.jar','sign','--ks',keys[0],'--ks-pass','pass:android','--key-pass','pass:android','--ks-key-alias','androiddebugkey','--out',out/'p3f-qa.apk',aligned])
run([jdk/'java.exe','-jar',bt/'lib/apksigner.jar','verify','--verbose',out/'p3f-qa.apk'])
print('Fixture-only QA APK built at '+str((out/'p3f-qa.apk').relative_to(root))+'; production untouched')
