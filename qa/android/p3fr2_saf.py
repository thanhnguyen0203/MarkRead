"""Local DocumentsUI/SAF fixture smoke. No uninstall, clear-data or broad grants."""
from qa.android.p3fr2_core import *
import re,hashlib
fixture=json.loads((OUT/'fixture.json').read_text(encoding='utf-8'));folder=fixture['folder']
if not re.fullmatch(r'MarkReadP3FR2_\d{8}_[0-9a-f]{6}',folder):raise ValueError('Dedicated fixture folder required')
remote='/sdcard/Documents/'+folder
def rec(name,expected,actual):
 p=OUT/'saf-checks.json';rows=json.loads(p.read_text(encoding='utf-8')) if p.exists() else [];row=dict(name=name,expected=expected,actual=actual,status='PASS' if expected==actual else 'FAIL');rows.append(row);p.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print(row['status'],name,flush=True)
 if row['status']=='FAIL':raise AssertionError(name)
def openfile(name):
 js('[...document.querySelectorAll(".file-row")].find(n=>n.title==='+json.dumps(name)+').click()');wait('document.getElementById("filename").textContent==='+json.dumps(name.split('/')[-1]))
def picker():
 ready();assert not state()['dirty'];r=adb('push',OUT/folder,'/sdcard/Documents/');assert r.returncode==0;click('openFolder');print('Complete DocumentsUI tree selection for',folder,flush=True)
def edit_export():
 wait('document.getElementById("folderName").textContent==='+json.dumps(folder));rec('tree scoped folder',folder,js('document.getElementById("folderName").textContent'));rec('nested file indexed',True,js('[...document.querySelectorAll(".file-row")].some(n=>n.title==="Sub/02_Nested.md")'));openfile('01_Viet.md');rec('SAF read exact',fixture['files']['01_Viet.md'],state()['text']);mode('edit');click('findToggle');setvalue('findInput','việt');wait('!document.getElementById("replaceAll").disabled');setvalue('replaceInput','Tiếng');click('replaceAll');expected=fixture['files']['01_Viet.md'].replace('Việt','Tiếng').replace('việt','Tiếng').replace('VIỆT','Tiếng');wait('document.getElementById("editor").value==='+json.dumps(expected));rec('SAF Replace All exact',expected,state()['text']);click('findClose');(OUT/'expected-export.txt').write_text(expected,encoding='utf-8',newline='\n');click('download');print('Save as R2_Saved.md in the selected fixture folder',flush=True)
def verify_rename():
 for name,dest in [('R2_Saved.md','saved-export.md'),('01_Viet.md','original-after-export.md')]:
  p=adb('pull',remote+'/'+name,OUT/dest);assert p.returncode==0,p.stderr
 rec('export UTF8 byte hash',hashlib.sha256((OUT/'expected-export.txt').read_bytes()).hexdigest(),hashlib.sha256((OUT/'saved-export.md').read_bytes()).hexdigest());rec('original never overwritten',fixture['files']['01_Viet.md'].encode().hex(),(OUT/'original-after-export.md').read_bytes().hex())
 js('document.getElementById("editor").focus();document.execCommand("undo")');rec('Undo Replace after export exact',fixture['files']['01_Viet.md'],state()['text']);rec('original draft clean after Undo',False,state()['dirty']);js('document.getElementById("filename").dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true}))');wait('document.getElementById("renameDialog").open');setvalue('renameInput','01_Đổi_tên.txt');js('document.getElementById("renameForm").requestSubmit()');wait('document.getElementById("filename").textContent==="01_Đổi_tên.txt"');rec('Unicode rename and extension','01_Đổi_tên.txt',js('document.getElementById("filename").textContent'));screenshot('saf-renamed-final');openfile('Sub/02_Nested.md');rec('nested file opens exact',fixture['files']['Sub/02_Nested.md'],state()['text']);assert not state()['dirty'];command('recreate');print('Clean Activity recreation requested',flush=True)
def lifecycle_missing():
 ready();wait('document.getElementById("folderName").textContent==='+json.dumps(folder),120);rec('persisted tree after Activity recreation',folder,js('document.getElementById("folderName").textContent'));rec('newly saved copy indexed',True,js('[...document.querySelectorAll(".file-row")].some(n=>n.title==="R2_Saved.md")'));openfile('R2_Saved.md');rec('saved copy reopens bytes after lifecycle',(OUT/'expected-export.txt').read_text(encoding='utf-8'),state()['text']);screenshot('saf-lifecycle-final');before=state()['text']
 # Delete/move only exact files under the UUID fixture; no recursive operation.
 assert not state()['dirty'];assert adb('exec-out','cat',remote+'/03_Missing.md').stdout==fixture['files']['03_Missing.md'].encode('utf-8');p=adb('shell','rm',remote+'/03_Missing.md');assert p.returncode==0
 js('document.getElementById("toast").textContent="";[...document.querySelectorAll(".file-row")].find(n=>n.title==="03_Missing.md").click()');wait('document.getElementById("toast").textContent.length>0');rec('missing file preserves previous content',before,state()['text']);rec('missing file does not dirty previous doc',False,state()['dirty']);rec('missing file keeps filename consistent','R2_Saved.md',js('document.getElementById("filename").textContent'))
 assert adb('exec-out','cat',remote+'/04_Moved.md').stdout==fixture['files']['04_Moved.md'].encode('utf-8');p=adb('shell','mv',remote+'/04_Moved.md',remote+'/04_Moved_elsewhere.md');assert p.returncode==0
 js('document.getElementById("toast").textContent="";[...document.querySelectorAll(".file-row")].find(n=>n.title==="04_Moved.md").click()');wait('document.getElementById("toast").textContent.length>0');rec('moved file preserves previous content',before,state()['text']);rec('moved file keeps filename consistent','R2_Saved.md',js('document.getElementById("filename").textContent'));screenshot('saf-missing-moved-final')
 print('SAF core smoke complete',flush=True)
if __name__=='__main__':globals()[sys.argv[1]]()
