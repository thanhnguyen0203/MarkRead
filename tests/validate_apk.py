from pathlib import Path
import hashlib,subprocess,zipfile,re,os,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1];apk=R/'dist/MarkRead-Android-1.1.3.apk';aapt=R/('toolchain/build-tools/android-15/aapt2.exe' if os.name=='nt' else 'toolchain/build-tools/android-15/aapt2');checks=[]
def check(condition,name):
 if not condition:raise AssertionError(name)
 checks.append(name)
root=ET.parse(R/'app/src/main/AndroidManifest.xml').getroot();ns='{http://schemas.android.com/apk/res/android}'
check(root.findall('uses-permission')==[],'source manifest requests zero permissions')
app=root.find('application');check(app.get(ns+'allowBackup')=='false','backup disabled');check(app.get(ns+'debuggable')=='false','release debugging disabled');check(app.get(ns+'usesCleartextTraffic')=='false','cleartext disabled')
permissions=subprocess.check_output([str(aapt),'dump','permissions',str(apk)],text=True)
check('uses-permission' not in permissions,'compiled APK requests zero permissions')
badging=subprocess.check_output([str(aapt),'dump','badging',str(apk)],text=True)
check("package: name='vn.markread.local'" in badging,'correct package');check("versionCode='113'" in badging and "versionName='1.1.3'" in badging,'correct upgrade version');check("minSdkVersion:'26'" in badging,'minimum Android 8');check("targetSdkVersion:'35'" in badging,'target Android 15');check("launchable-activity: name='vn.markread.local.MainActivity'" in badging,'launcher activity packaged')
with zipfile.ZipFile(apk) as z:
 check(z.testzip() is None,'APK ZIP CRC valid');check(z.read('classes.dex')[:4]==b'dex\n','DEX packaged')
 check(all(not any(x in n.lower() for x in ['.p12','keystore-password','private/']) for n in z.namelist()),'no signing secrets in APK')
 data=z.read('assets/index.html');check(data==(R/'app/src/main/assets/index.html').read_bytes(),'APK contains latest generated renderer')
 text=data.decode();script=re.findall(r'<script>([\s\S]*?)</script>',text);check(len(script)==1,'one bundled renderer script')
 import base64
 digest=base64.b64encode(hashlib.sha256(script[0].encode()).digest()).decode();check("script-src 'sha256-"+digest+"'" in text,'CSP script hash matches')
 check('data:font/woff2;base64,' in text and 'Merriweather' in text,'Merriweather embedded offline');check('Merriweather' in z.read('assets/THIRD_PARTY_NOTICES.txt').decode(),'font license packaged');
 check("connect-src 'none'" in text,'renderer CSP denies all network connections');check('sandbox="allow-same-origin"' in text and 'allow-scripts' not in text,'document frame cannot run scripts')
 check(not re.search(r'<(?:script|link|img)[^>]+(?:src|href)=[\"\']https?://',text,re.I),'no external HTML assets')
main=(R/'app/src/main/java/vn/markread/local/MainActivity.java').read_text(encoding='utf-8')
check('addJavascriptInterface' not in main,'no JavaScriptInterface API used');check('s.setAllowFileAccess(false)' in main and 's.setAllowContentAccess(false)' in main,'WebView direct file/content access disabled');check('s.setBlockNetworkLoads(true)' in main,'WebView network loads disabled');check('takePersistableUriPermission(tree,newGrantFlags)' in main,'persistent tree grant uses only picker-returned read/write flags')
report='APK validation: '+str(len(checks))+' checks passed\n'+'\n'.join('PASS '+x for x in checks)+'\n\n'+permissions+'\n'+badging
(R/'dist/APK_VALIDATION_RESULTS.txt').write_text(report,encoding='utf-8')
print('APK validation:',len(checks),'checks passed')
