#!/usr/bin/env python3
"""Build with official Android SDK tools and Eclipse ECJ.
Signing credentials are read from files, never printed or stored in the public source ZIP.
"""
from pathlib import Path
import os,sys,subprocess,zipfile,secrets,hashlib,json,shutil
ROOT=Path(__file__).resolve().parent
TC=Path(os.environ.get('MARKREAD_TOOLCHAIN',str(ROOT/'toolchain')))
BT=TC/'build-tools/android-15';PLATFORM=next((TC/'platform').glob('android-35*/android.jar'),TC/'platform/android-35/android.jar')
def tool(name):return BT/(name+('.exe' if os.name=='nt' else ''))
BUILD=ROOT/'build';DIST=ROOT/'dist';PRIVATE=ROOT/'private'

def run(args):
    subprocess.run([str(a) for a in args],cwd=ROOT,check=True)

def build():
    for p in [BUILD/'classes',BUILD/'dex',DIST,PRIVATE]:p.mkdir(parents=True,exist_ok=True)
    if not PLATFORM.exists() or not (tool('aapt2')).exists():
        raise SystemExit('Missing toolchain. Run: python3 toolchain/fetch_tools.py')
    if (ROOT/'web/node_modules').exists():
        run(['node',ROOT/'web/build.mjs'])
        shutil.copy2(ROOT/'web/dist/MarkRead.html',ROOT/'app/src/main/assets/index.html')
    elif not (ROOT/'app/src/main/assets/index.html').exists():
        raise SystemExit('Missing built assets. In web/: npm ci && npm run build')
    sources=sorted((ROOT/'app/src/main/java').rglob('*.java'))
    run(['java','-jar',TC/'ecj.jar','-8','-encoding','UTF-8','-warn:none','-classpath',PLATFORM,'-d',BUILD/'classes',*sources])
    jar=BUILD/'classes.jar'
    with zipfile.ZipFile(jar,'w') as z:
        for p in sorted((BUILD/'classes').rglob('*.class')):z.write(p,p.relative_to(BUILD/'classes'))
    run(['java','-cp',BT/'lib/d8.jar','com.android.tools.r8.D8','--release','--min-api','26','--lib',PLATFORM,'--output',BUILD/'dex',jar])
    run([tool('aapt2'),'compile','--dir',ROOT/'app/src/main/res','-o',BUILD/'resources.zip'])
    unsigned=BUILD/'unsigned.apk'
    manifest=BUILD/'AndroidManifest.xml'
    manifest.write_text((ROOT/'app/src/main/AndroidManifest.xml').read_text().replace('<manifest ', '<manifest package="vn.markread.local" ',1))
    run([tool('aapt2'),'link','-I',PLATFORM,'--manifest',manifest,'-A',ROOT/'app/src/main/assets','-o',unsigned,BUILD/'resources.zip'])
    with zipfile.ZipFile(unsigned,'a',compression=zipfile.ZIP_DEFLATED) as z:z.write(BUILD/'dex/classes.dex','classes.dex')
    aligned=BUILD/'aligned.apk';run([tool('zipalign'),'-f','4',unsigned,aligned])
    key=PRIVATE/'markread-release.p12';password=PRIVATE/'keystore-password.txt'
    if not key.exists():
        password.write_text(secrets.token_urlsafe(36));password.chmod(0o600)
        run(['keytool','-genkeypair','-keystore',key,'-storetype','PKCS12','-alias','markread','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=MarkRead Local, O=Personal Offline Apps','-storepass:file',password,'-keypass:file',password,'-noprompt'])
        key.chmod(0o600)
    output=DIST/'MarkRead-Android-1.1.4.apk'
    signed=BUILD/'signed.apk'
    run(['java','-jar',BT/'lib/apksigner.jar','sign','--ks',key,'--ks-key-alias','markread','--ks-pass','file:'+str(password),'--v4-signing-enabled','false','--out',signed,aligned])
    verify=subprocess.run(['java','-jar',str(BT/'lib/apksigner.jar'),'verify','--verbose','--print-certs',str(signed)],check=True,text=True,capture_output=True)
    (DIST/'APK_SIGNATURE.txt').write_text(verify.stdout)
    run([tool('zipalign'),'-c','4',signed])
    os.replace(signed,output)
    print(json.dumps({'apk':str(output),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}))
if __name__=='__main__':build()
