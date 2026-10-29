"""Opt-in ADB fixture driver for an already running emulator. Never clears data or uninstalls."""
from pathlib import Path
import subprocess,json,time,os,sys,shlex
ROOT=Path(__file__).resolve().parents[2];PHASE=os.environ.get('MARKREAD_QA_PHASE','ui-p3f')
if PHASE not in ('ui-p3f','ui-p3fr','ui-p3fr2'):raise ValueError('Unknown fixture phase')
DEVICE=os.environ.get('MARKREAD_QA_DEVICE','emulator-5554')
if DEVICE not in ('emulator-5554','emulator-5556'):raise ValueError('Unknown QA emulator')
if PHASE in ('ui-p3fr','ui-p3fr2') and DEVICE!='emulator-5556':raise ValueError('P3FR requires the separate emulator-5556 explicitly')
OUT=ROOT/'build'/PHASE/'runtime';OUT.mkdir(parents=True,exist_ok=True)
ADB=ROOT/'toolchain/android-sdk/platform-tools/adb.exe';SESSION={'ui-p3f':'p3fqa_20261028','ui-p3fr':'p3fqa_20261028r','ui-p3fr2':'p3fqa_20261028r2'}[PHASE];PKG='vn.markread.local'
def adb(*args,**kwargs):
 args=list(map(str,args))
 if args and args[0]=='shell':
  # ADB joins remote-shell arguments; quote values such as IME lists containing semicolons.
  args=['shell',' '.join(shlex.quote(value) for value in args[1:])]
 for attempt in range(3):
  result=subprocess.run([str(ADB),'-s',DEVICE,*args],capture_output=True,**kwargs)
  if result.returncode and ('device \'%s\' not found'%DEVICE).encode() in result.stderr:time.sleep(.5);continue
  return result
 return result
_fixture_device_checked=False
def fixture_device():
 global _fixture_device_checked
 if PHASE in ('ui-p3fr','ui-p3fr2') and not _fixture_device_checked:
  name=adb('emu','avd','name')
  if name.returncode or name.stdout.decode(errors='replace').splitlines()[:1]!=['MarkRead_P3FR_Validation']:
   raise RuntimeError('Refusing P3FR commands outside the dedicated validation AVD')
  _fixture_device_checked=True
def command(op,**values):
 fixture_device()
 state=OUT/'sequence.json';seq=json.loads(state.read_text())+1 if state.exists() else 1;state.write_text(json.dumps(seq))
 payload=json.dumps({'id':seq,'op':op,**values},ensure_ascii=False).encode('utf-8')
 p=adb('shell','run-as',PKG,'tee',f'cache/{SESSION}.command.json',input=payload)
 if p.returncode:raise RuntimeError(p.stderr.decode(errors='replace'))
 end=time.monotonic()+40
 while time.monotonic()<end:
  p=adb('exec-out','run-as',PKG,'cat',f'cache/{SESSION}.response.json')
  try:result=json.loads(p.stdout)
  except (ValueError,UnicodeDecodeError):time.sleep(.15);continue
  if result.get('id')!=seq:time.sleep(.15);continue
  if 'error' in result:raise RuntimeError(result['error'])
  return result.get('value')
 raise TimeoutError(op)
def js(source):return command('js',source=source)
def wait(expr,seconds=25):
 end=time.monotonic()+seconds
 while time.monotonic()<end:
  if js('Boolean('+expr+')'):return True
  time.sleep(.2)
 raise TimeoutError(expr[:140])
def tree():return command('tree')
def flatten(n):
 if not n:return []
 return [n]+[x for child in n.get('children',[]) for x in flatten(child)]
def labels():return [{'text':n['text'],'description':n['description'],'bounds':n['bounds'],'id':n['id']} for n in flatten(tree()) if n['text']!='null' or n['description']!='null']
def tap(label):
 n=next((n for n in flatten(tree()) if n['text']==label or n['description']==label),None)
 if not n:raise LookupError(label)
 x,y,z,w=n['bounds'];p=adb('shell','input','tap',(x+z)//2,(y+w)//2)
 if p.returncode:raise RuntimeError('tap failed')
 time.sleep(.4)
def screenshot(name):
 if not name.replace('-','').replace('_','').isalnum():raise ValueError('Screenshot fixture name required')
 p=adb('exec-out','screencap','-p')
 if p.returncode or not p.stdout.startswith(b'\x89PNG'):raise RuntimeError('screenshot failed')
 target=OUT/(name+'.png');target.write_bytes(p.stdout);return target.name
def start():
 fixture_device()
 if adb('shell','pidof',PKG).stdout.strip():
  raise RuntimeError('Refusing to instrument a running MarkRead process. Save drafts and close the app first.')
 # Only our own fixture-driver cache messages; never clear app data or document files.
 cleanup=adb('shell','run-as',PKG,'rm','-f',f'cache/{SESSION}.command.json',f'cache/{SESSION}.response.json')
 if cleanup.returncode:raise RuntimeError('Cannot prepare private QA session cache')
 log=(OUT/'instrumentation.log').open('wb')
 proc=subprocess.Popen([str(ADB),'-s',DEVICE,'shell','am','instrument','-w','-r','-e','session',SESSION,'vn.markread.local.p3fqa/vn.markread.local.tests.P3FInstrumentation'],stdout=log,stderr=subprocess.STDOUT,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 (OUT/'driver-process.json').write_text(json.dumps({'hostProcessId':proc.pid,'session':SESSION}))
 print('Fixture QA instrumentation started')
if __name__=='__main__':
 if sys.argv[1]=='start':start()
 elif sys.argv[1]=='labels':print(json.dumps(labels(),ensure_ascii=False,indent=2))
 elif sys.argv[1]=='js':print(json.dumps(js(sys.argv[2]),ensure_ascii=False))
 elif sys.argv[1]=='shot':print(screenshot(sys.argv[2]))
 elif sys.argv[1]=='finish':
  if not js("document.getElementById('dirty').hidden"):raise RuntimeError('Save/restore fixture draft before finishing QA')
  print(command('finish'))
