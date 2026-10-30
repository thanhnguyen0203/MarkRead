"""P3F-R fixture-only WebView transaction checks, not Gboard/SAF evidence.

Requires the separate emulator-5556, explicitly selected by environment.
"""
from qa.android.runtime_p3f import *
if DEVICE!='emulator-5556' or PHASE not in ('ui-p3fr','ui-p3fr2'):raise RuntimeError('Separate P3FR emulator required')
rows=[]
def check(name,expected,actual):
 rows.append(dict(name=name,status='PASS' if actual==expected else 'FAIL',expected=expected,actual=actual,method='Android WebView native editing command, instrumentation'))
 print(rows[-1]['status'],name,flush=True)
def value():return js("document.getElementById('editor').value")
def click(id):return js('document.getElementById('+json.dumps(id)+').click()')
def setvalue(id,v):return js('(()=>{let x=document.getElementById('+json.dumps(id)+');x.value='+json.dumps(v)+';x.dispatchEvent(new Event("input",{bubbles:true}));})()')
def load(text):
 js('(()=>{const x=document.getElementById("filesInput"),d=new DataTransfer();d.items.add(new File(['+json.dumps(text)+'],"P3FR_Fixture.md",{type:"text/markdown"}));x.files=d.files;x.dispatchEvent(new Event("change",{bubbles:true}));})()')
 wait('document.getElementById("editor").value==='+json.dumps(text))
def mode(m):click('modeToggle');js('document.querySelector("#modeOptions [data-mode='+m+']").click()')
def replace(q,r,all=False,regex=False):
 if js('document.getElementById("findbar").hidden'):click('findToggle')
 if js('document.getElementById("findRegex").getAttribute("aria-pressed")')!=str(regex).lower():click('findRegex')
 setvalue('findInput',q);wait('!document.getElementById("replaceOne").disabled');setvalue('replaceInput',r);click('replaceAll' if all else 'replaceOne')
def history(op):js('document.getElementById("editor").focus();document.execCommand('+json.dumps(op)+')')
def run(phase):
 # about:blank has no data-startup attribute either; require the actual app and
 # the same public readiness signals checked by NativeUiPolicy before probing.
 wait('location.href==="https://appassets.androidplatform.net/app/index.html"&&document.readyState==="complete"&&typeof window.markReadBack==="function"&&!!document.getElementById("editor")&&!!document.getElementById("app")&&document.getElementById("app").getAttribute("aria-busy")!=="true"&&!document.documentElement.hasAttribute("data-startup")',120)
 check('QA runtime Android API', '35',adb('shell','getprop','ro.build.version.sdk').stdout.decode().strip())
 cases=[('single','# A\n\none one','one','two',False,False,'# A\n\ntwo one'),('multiple blocks','# A\n\none\n\n## B\n\none','one','two',True,False,'# A\n\ntwo\n\n## B\n\ntwo'),('regex','# A\n\nItem-12 Item-34',r'Item-(\d+)','Số $1',True,True,'# A\n\nSố 12 Số 34'),('Vietnamese','# A\n\nViệt việt VIỆT','việt','Tiếng',True,False,'# A\n\nTiếng Tiếng Tiếng'),('emoji','# A\n\n💠 💠','💠','💡',True,False,'# A\n\n💡 💡')]
 for name,text,q,r,all,regex,expected in cases[:1] if phase=='before' else cases:
  load(text);mode('edit');js('document.getElementById("editor").setSelectionRange(2,5)');replace(q,r,all,regex);wait('document.getElementById("editor").value==='+json.dumps(expected));check(name+' exact result',expected,value());click('findClose');history('undo');check(name+' native Undo',text,value());screenshot(phase+'-'+name.replace(' ','-')+'-undo');history('redo');check(name+' native Redo',expected,value());history('undo')
 if phase=='after':
  for m in ['read','split']:
   text='# Modes\n\none one';load(text);mode(m);replace('one','two',True);wait('document.getElementById("editor").value.includes("two two")');check(m+' mode stable',m,js('document.getElementById("workspace").dataset.mode'));click('findClose');click('modeToggle');click('modeToggle')
   # Dispatching shortcuts tests app routing; not hardware keyboard evidence.
   js('document.getElementById("modeToggle").focus();document.getElementById("modeToggle").dispatchEvent(new KeyboardEvent("keydown",{key:"z",ctrlKey:true,bubbles:true}))');check(m+' routed Undo',text,value())
  mode('edit');load('# Compose\n\none');replace('one','two');wait('document.getElementById("editor").value.includes("two")');click('findClose');history('undo');check('restored fixture not dirty',True,js('document.getElementById("dirty").hidden'))
  check('native bridge still exposed',True,js('typeof window.markReadBack==="function"'))
 check('no unsafe pane projection remains',True,js('!document.getElementById("editorPane").style.position&&!document.getElementById("editor").hasAttribute("inputmode")'))
 (OUT/(phase+'-undo.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
 # All tests finish at their original fixture; no unsaved draft left for an update.
 print('RESULT',len(rows),'checks',sum(x['status']=='FAIL' for x in rows),'failures',flush=True)
if __name__=='__main__':run(sys.argv[1])
