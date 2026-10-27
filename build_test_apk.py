from build_apk import ROOT,TC,BT,PLATFORM,BUILD,DIST,PRIVATE,run
import zipfile
b=BUILD/'instrumentation';(b/'classes').mkdir(parents=True,exist_ok=True);(b/'dex').mkdir(exist_ok=True)
sources=list((ROOT/'app/src/androidTest/java').rglob('*.java'))
run(['java','-jar',TC/'ecj.jar','-8','-encoding','UTF-8','-warn:none','-classpath',PLATFORM,'-d',b/'classes',*sources])
with zipfile.ZipFile(b/'classes.jar','w') as z:
 for p in (b/'classes').rglob('*.class'):z.write(p,p.relative_to(b/'classes'))
run(['java','-cp',BT/'lib/d8.jar','com.android.tools.r8.D8','--min-api','29','--lib',PLATFORM,'--output',b/'dex',b/'classes.jar'])
run([BT/'aapt2','link','-I',PLATFORM,'--manifest',ROOT/'tests/AndroidTestManifest.xml','-o',b/'unsigned.apk'])
with zipfile.ZipFile(b/'unsigned.apk','a',compression=zipfile.ZIP_DEFLATED) as z:z.write(b/'dex/classes.dex','classes.dex')
run([BT/'zipalign','-f','4',b/'unsigned.apk',b/'aligned.apk'])
run(['java','-jar',BT/'lib/apksigner.jar','sign','--ks',PRIVATE/'markread-release.p12','--ks-key-alias','markread','--ks-pass','file:'+str(PRIVATE/'keystore-password.txt'),'--v4-signing-enabled','false','--out',b/'tests.apk',b/'aligned.apk'])
print(b/'tests.apk')
