"""Bounded P3F-R2 core smoke tests. Dedicated fixture AVD only, no TalkBack gate.

Actual characters come from Gboard touchscreen keys; caret selection and
Copy/Paste/Undo/Delete use Android hardware shortcuts.
Neither JS value assignment nor keydown simulation is counted as IME evidence.
"""
from qa.android.runtime_p3f import *
if PHASE!='ui-p3fr2' or DEVICE!='emulator-5556':raise RuntimeError('R2 fixture phase/device required')
ORIGINAL='# P3FR2 IME\n\n'
def state():return js('({text:document.getElementById("editor").value,start:document.getElementById("editor").selectionStart,end:document.getElementById("editor").selectionEnd,dirty:!document.getElementById("dirty").hidden,active:document.activeElement.id,mode:document.getElementById("workspace").dataset.mode})')
def click(id):return js('document.getElementById('+json.dumps(id)+').click()')
def mode(m):
 click('modeToggle');js('document.querySelector("#modeOptions [data-mode='+m+']").click()')
def ready():
 wait('location.href==="https://appassets.androidplatform.net/app/index.html"&&document.readyState==="complete"&&typeof window.markReadBack==="function"&&!!document.getElementById("editor")&&!!document.getElementById("app")&&document.getElementById("app").getAttribute("aria-busy")!=="true"&&!document.documentElement.hasAttribute("data-startup")',120)
 command('action',label='Tiếp tục chờ',action=16)
 time.sleep(.3);visible()
def visible():
 names=[n['text'] for n in labels()]
 if any("isn't responding" in n or 'Giao diện chưa sẵn sàng' in n for n in names) or 'Danh sách tệp' not in names:
  raise RuntimeError('Native UI is covered or not ready; DOM-only results are not visual acceptance')
def load(text,name='P3FR2_Fixture.md'):
 js('(()=>{const x=document.getElementById("filesInput"),d=new DataTransfer();d.items.add(new File(['+json.dumps(text)+'],'+json.dumps(name)+',{type:"text/markdown"}));x.files=d.files;x.dispatchEvent(new Event("change",{bubbles:true}));})()')
 wait('document.getElementById("editor")?.value==='+json.dumps(text),60)
def setvalue(id,v):return js('(()=>{let x=document.getElementById('+json.dumps(id)+');x.value='+json.dumps(v)+';x.dispatchEvent(new Event("input",{bubbles:true}));})()')
def combo(*keys):
 result=adb('shell','input','keycombination',*keys)
 if result.returncode:raise RuntimeError(result.stderr.decode(errors='replace'))
 # Android shell chord injection can leave Ctrl cached in Gboard's meta state.
 # A standalone down/up with metaState=0 releases it before touchscreen input.
 if 113 in keys:adb('shell','input','keyevent',113)
 time.sleep(.35)
def select(a,b,field='editor'):
 js('document.getElementById('+json.dumps(field)+').focus()')
 combo(113,122)
 if a:adb('shell','input','keyevent',*([22]*a))
 for i in range(b-a):combo(59,22)
 wait('document.getElementById('+json.dumps(field)+').selectionStart==='+str(a)+'&&document.getElementById('+json.dumps(field)+').selectionEnd==='+str(b))
 time.sleep(.3)
KEYS={**{c:(16+32*i,447) for i,c in enumerate('qwertyuiop')},**{c:(32+32*i,495) for i,c in enumerate('asdfghjkl')},**{c:(64+32*i,542) for i,c in enumerate('zxcvbnm')},' ':(175,591),'.':(260,591),'\n':(293,591)}
def type_keys(text):
 for c in text:
  result=adb('shell','input','touchscreen','tap',*KEYS[c])
  if result.returncode:raise RuntimeError('Gboard touch failed')
  time.sleep(.16)
 time.sleep(.7)
def shift():adb('shell','input','touchscreen','tap',24,542);time.sleep(.2)
def record(name,expected,actual,method):
 target=OUT/'core-checks.json';rows=json.loads(target.read_text(encoding='utf-8')) if target.exists() else []
 row=dict(name=name,status='PASS' if actual==expected else 'FAIL',expected=expected,actual=actual,method=method);rows.append(row);target.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print(row['status'],name,flush=True)
 if row['status']=='FAIL':raise AssertionError(name)
def begin():
 ready();command('seedClipboard');load(ORIGINAL);mode('edit')
 js('window.__r2events=[];for(const id of ["editor","findInput"]){for(const t of ["keydown","beforeinput","input","compositionstart","compositionupdate","compositionend"]){document.getElementById(id).addEventListener(t,e=>window.__r2events.push({field:id,type:e.type,data:e.data,key:e.key,ctrl:e.ctrlKey,shift:e.shiftKey,trusted:e.isTrusted,composing:e.isComposing,inputType:e.inputType,value:e.target.value,start:e.target.selectionStart,end:e.target.selectionEnd}));}}')
 adb('shell','settings','put','secure','stylus_handwriting_enabled','0')
 js('document.getElementById("editor").focus()');adb('shell','input','touchscreen','tap',60,280);time.sleep(1);select(len(ORIGINAL),len(ORIGINAL));screenshot('core-keyboard-ready')
 print('Inspect keyboard screenshot before typing',flush=True)
def typing():
 type_keys('tooi ddang ddocj tieengs ');shift();type_keys('vieetj.')
 expected=ORIGINAL+'Tôi đang đọc tiếng Việt.'
 record('Gboard Vietnamese sentence',expected,state()['text'],'Gboard Vietnamese QWERTY touchscreen Telex')
 record('typing dirty/caret',True,(lambda s:s['dirty'] and s['start']==s['end']==len(expected))(state()),'Android WebView textarea state')
 combo(113,54);undone=state()['text'];record('native typing Undo changes source',True,undone!=expected,'Android Ctrl+Z');combo(113,59,54);record('native typing Redo exact roundtrip',expected,state()['text'],'Android Ctrl+Shift+Z')
 at=expected.index('đọc');select(at+1,at+2);type_keys('os');expected=expected.replace('đọc','đóc')
 record('edit tone in middle of sentence',expected,state()['text'],'Native selection + Gboard os')
 record('mid-word caret stays in edited word',True,(lambda s:s['start']==s['end'] and at<=s['start']<=at+3)(state()),'Android textarea caret')
 select(at,at+3);type_keys('dduowcj');expected=expected.replace('đóc','được');record('replace middle word with Vietnamese',expected,state()['text'],'Native selection + Gboard Telex')
 select(at,at);adb('shell','input','keyevent',112);time.sleep(.5);record('forward Delete exact character',expected[:at]+expected[at+1:],state()['text'],'Android KEYCODE_FORWARD_DEL');combo(113,54);record('Undo forward Delete',expected,state()['text'],'Android Ctrl+Z')
 select(at+4,at+4);adb('shell','input','touchscreen','tap',294,542);time.sleep(.5);record('Gboard Backspace exact character',expected[:at+3]+expected[at+4:],state()['text'],'Gboard Backspace touchscreen');combo(113,54);record('Undo Backspace',expected,state()['text'],'Android Ctrl+Z')
 phrase='tiếng Việt';start=expected.index(phrase);select(start,start+len(phrase));record('native selection exact',phrase,js('document.getElementById("editor").value.slice(document.getElementById("editor").selectionStart,document.getElementById("editor").selectionEnd)'),'Android Ctrl+Home / arrows / Shift+Right');combo(113,31);select(len(expected),len(expected));type_keys('\n');expected+='\n';record('Gboard multiline Enter',expected,state()['text'],'Gboard Enter touchscreen');combo(113,50);expected+=phrase;record('native Copy/Paste preserves Unicode',expected,state()['text'],'Android Ctrl+C/Ctrl+V, clipboard seeded before attempt');combo(113,54);record('Undo Paste',expected[:-len(phrase)],state()['text'],'Android Ctrl+Z');combo(113,59,54);record('Redo Paste exact',expected,state()['text'],'Android Ctrl+Shift+Z')
 click('findToggle');time.sleep(.5);type_keys('tieengs');record('Gboard Search Vietnamese query','tiếng',js('document.getElementById("findInput").value'),'Gboard touchscreen in Search');js('document.getElementById("replaceInput").focus()');time.sleep(.5);type_keys('vieetj');record('Gboard Replace literal lowercase','việt',js('document.getElementById("replaceInput").value'),'Gboard touchscreen in Replace');record('Search never changes draft',expected,state()['text'],'Editor/Search transfer');click('findClose');select(len(expected),len(expected));type_keys(' toots');expected+=' tốt';record('return to editor typing exact',expected,state()['text'],'Gboard touchscreen after Search');screenshot('core-vietnamese-edits')
 adb('shell','input','keyevent',3);time.sleep(.4);adb('shell','am','start','-n',PKG+'/.MainActivity');time.sleep(.8);record('app switch preserves dirty source',True,(lambda s:s['text']==expected and s['dirty'])(state()),'Android Home/resume');record('app switch caret stable',len(expected),state()['end'],'Android textarea state')
 adb('shell','input','touchscreen','tap',60,280);time.sleep(.7);adb('shell','input','keyevent',4);time.sleep(.6);record('Back closes keyboard keeps Source',True,(lambda s:s['mode']=='edit' and s['text']==expected and s['dirty'])(state()),'Android Back');adb('shell','input','keyevent',4);time.sleep(.6);record('Back Source to Read keeps dirty draft',True,(lambda s:s['mode']=='read' and s['text']==expected and s['dirty'])(state()),'Android Back')
 adb('shell','input','keyevent',4);time.sleep(.6);record('dirty exit warning shown',True,any(n['text']=='Bản sửa chưa lưu' for n in labels()),'Android Back + native dialog');stay=next(n['text'] for n in labels() if n['text'].casefold()=='ở lại');record('stay action available',True,command('action',label=stay,action=16),'Native dialog action using observed label');record('cancel exit retains dirty source',True,(lambda s:s['text']==expected and s['dirty'])(state()),'Android native dirty-exit guard')
 (OUT/'core-native-events.json').write_text(json.dumps(js('window.__r2events'),ensure_ascii=False,indent=2),encoding='utf-8');screenshot('core-draft-after-back')
 # Only the synthetic QA file is reverted; never assign to a real SAF document.
 assert js('document.getElementById("filename").textContent')=='P3FR2_Fixture.md'
 setvalue('editor',ORIGINAL);record('fixture clean after smoke',False,state()['dirty'],'QA cleanup, not user Undo acceptance')
if __name__=='__main__':globals()[sys.argv[1]]()
