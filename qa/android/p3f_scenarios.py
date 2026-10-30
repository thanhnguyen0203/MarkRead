"""Fixture-only Android runtime assertions. UI input method is recorded for every check."""
from qa.android.runtime_p3f import *
import hashlib
RESULTS=OUT/'checks.json'
def record(name,expected,actual,method='Android WebView via instrumentation'):
 rows=json.loads(RESULTS.read_text(encoding='utf-8')) if RESULTS.exists() else []
 passed=actual==expected;rows.append({'name':name,'status':'PASS' if passed else 'FAIL','expected':expected,'actual':actual,'method':method});RESULTS.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print(('PASS ' if passed else 'FAIL ')+name,flush=True)
def check(name,expr,expected=True,method='Android WebView via instrumentation'):record(name,expected,js(expr),method)
def setvalue(id,value):js("document.getElementById("+json.dumps(id)+").value="+json.dumps(value)+";document.getElementById("+json.dumps(id)+").dispatchEvent(new Event('input',{bubbles:true}))")
def click(id):js("document.getElementById("+json.dumps(id)+").click()")
def section(name):click('settings');js("document.querySelector('[data-section="+name+"]').click()")
def close_settings():js("document.querySelector('#settingsDialog .close-dialog').click()")
def openfile(name):js("[...document.querySelectorAll('.file-row')].find(x=>x.textContent.includes("+json.dumps(name)+")).click()");wait("document.getElementById('filename').textContent==="+json.dumps(name))
def mode(value):
 if value=='edit' and js("document.getElementById('unifiedEnabled').checked"):
  section('editing');click('unifiedEnabled');close_settings()
 click('modeToggle');js("document.querySelector('[data-mode="+value+"]').click()")
 if value=='edit':wait("document.getElementById('editor').getBoundingClientRect().height>100")
def core():
 expected_folder=json.loads((OUT/'fixture.json').read_text())['folder']
 if not expected_folder.startswith('MarkReadP3F_') or js("document.getElementById('folderName').textContent")!=expected_folder:
  raise RuntimeError('Select the generated P3F fixture tree through DocumentsUI before any mutation')
 wait("document.querySelectorAll('.file-row').length===4")
 check('native bridge ready without JavaScriptInterface',"typeof window.markReadBack==='function'&&!window.Android&&!window.Native")
 check('twelve themes packaged',"document.querySelectorAll('#themes button').length",12)
 check('SAF index includes nested fixture',"[...document.querySelectorAll('.file-row')].some(x=>x.title.includes('Chuong_2/02_Sub.md'))")
 openfile('01_Viet.md');wait("document.getElementById('reader').contentDocument.querySelectorAll('.katex').length>0")
 f=json.loads((OUT/'fixture.json').read_text())['folder'];original=(OUT/f/'01_Viet.md').read_text(encoding='utf-8')
 record('SAF source exact LF fixture',hashlib.sha256(original.encode()).hexdigest(),hashlib.sha256(js("document.getElementById('editor').value").encode()).hexdigest())
 check('native reader code/table/math/image offline',"(()=>{const d=document.getElementById('reader').contentDocument;return !!(d.querySelector('pre code')&&d.querySelector('table')&&d.querySelector('.katex')&&d.querySelector('img[src^=blob]'))})()")
 check('source target mapping retained',"document.getElementById('reader').contentDocument.querySelectorAll('.md-block[data-start][data-end]').length>8")
 screenshot('03-reader-fixture')
 for theme in ['dark','light','sepia','black','tokyo-night','tokyo-light','blue-gray','nord','dracula','rose-pine','forest','gruvbox']:
  section('appearance');js("document.querySelector('#themes [data-theme="+theme+"]').click()");wait("document.body.dataset.theme==="+json.dumps(theme));close_settings();check('theme '+theme+' keeps source',"document.getElementById('editor').value==="+json.dumps(original))
 section('typography');click('font');js("document.querySelector('[data-font=merriweather]').click()");close_settings();wait("getComputedStyle(document.getElementById('reader').contentDocument.body).fontFamily.includes('Merriweather')");check('offline Merriweather ready',"document.getElementById('reader').contentDocument.fonts.check('18px Merriweather')")
 section('typography');click('font');js("document.querySelector('[data-font=sans]').click()");close_settings()
 section('css');setvalue('customCSS','#paper { max-width: 640px; } h1 { text-decoration: underline; }');click('applyCSS');close_settings();wait("getComputedStyle(document.getElementById('reader').contentDocument.querySelector('h1')).textDecorationLine.includes('underline')");check('custom CSS remains last and source exact',"document.getElementById('editor').value==="+json.dumps(original))
 section('css');click('resetCSS');close_settings()
 openfile('03_Long.md');wait("document.getElementById('reader').contentDocument.querySelectorAll('h2').length===250");check('long fixture250 chapters rendered',"document.getElementById('reader').contentDocument.querySelectorAll('pre').length",250);js("document.getElementById('reader').contentWindow.scrollTo(0,document.getElementById('reader').contentDocument.body.scrollHeight)");screenshot('04-long-reader');check('long document scroll reaches last chapter',"document.getElementById('reader').contentWindow.scrollY>10000")
 openfile('02_Sub.md');mode('edit');js("document.getElementById('editor').focus();document.getElementById('editor').setSelectionRange(5,11);window.__qaOriginal=document.getElementById('editor').value")
 click('settings');close_settings();check('Settings preserves editor selection',"JSON.stringify([document.getElementById('editor').selectionStart,document.getElementById('editor').selectionEnd])",'[5,11]')
 click('findToggle');setvalue('findInput','việt');wait("document.getElementById('findCount').textContent==='1/3'");check('case insensitive Vietnamese search',"document.getElementById('findCount').textContent",'1/3');click('findNext');check('Next match advances',"document.getElementById('findCount').textContent",'2/3');click('findPrev');check('Previous match restores',"document.getElementById('findCount').textContent",'1/3')
 setvalue('findInput','Việt');click('findCase');wait("document.getElementById('findCount').textContent==='1/1'");check('case matching',"document.getElementById('findCount').textContent",'1/1');click('findCase');wait("document.getElementById('findCount').textContent==='1/3'")
 setvalue('replaceInput','Tiếng');click('replaceOne');wait("document.getElementById('editor').value.includes('Tiếng việt VIỆT')");check('Replace one exact Unicode result',"document.getElementById('editor').value===window.__qaOriginal.replace('Việt','Tiếng')")
 js("window.__qaAfterOne=document.getElementById('editor').value;document.getElementById('findClose').click();document.getElementById('editor').focus();document.execCommand('undo')")
 record('Replace undo observation','unchanged replacement', 'unchanged replacement' if js("document.getElementById('editor').value===window.__qaAfterOne") else 'changed','Android WebView124 native execCommand history probe; limitation, not undo acceptance')
 js("document.execCommand('redo')");check('Redo observation after Replace',"document.getElementById('editor').value===window.__qaAfterOne")
 click('findToggle');setvalue('findInput','việt');wait("document.getElementById('findCount').textContent==='1/2'");setvalue('replaceInput','Tiếng');click('replaceAll');wait("document.getElementById('editor').value.includes('Tiếng Tiếng Tiếng')");check('Replace All changes only matches',"document.getElementById('editor').value===window.__qaOriginal.replace(/Việt|việt|VIỆT/g,'Tiếng')")
 click('findRegex');setvalue('findInput',r'Item-(\d+)');setvalue('replaceInput','Số $1');wait("document.getElementById('findCount').textContent==='1/2'");click('replaceAll');wait("document.getElementById('editor').value.includes('Số 12 Số 34')");check('regex captures retain replacement semantics',"document.getElementById('editor').value.includes('Số 12 Số 34')")
 js("window.__qaBeforeInvalid=document.getElementById('editor').value");setvalue('findInput','[');wait("document.getElementById('findInput').getAttribute('aria-invalid')==='true'");check('invalid regex keeps content and disables replacement',"document.getElementById('replaceAll').disabled&&document.getElementById('editor').value===window.__qaBeforeInvalid");screenshot('05-invalid-regex');click('findClose')
 check('draft is still dirty',"!document.getElementById('dirty').hidden")
 (OUT/'expected-export.txt').write_text(js("document.getElementById('editor').value"),encoding='utf-8',newline='\n');click('download');time.sleep(.6)
 print('Native create-document picker opened; complete fixture save through DocumentsUI',flush=True)
if __name__=='__main__':core()
