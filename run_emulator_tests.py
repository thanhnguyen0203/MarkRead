from pathlib import Path
import subprocess,os,time,json,signal
ROOT=Path(__file__).resolve().parent;TC=ROOT/'toolchain';SDK=TC/'sdk';ADB=SDK/'platform-tools/adb';log=(TC/'emulator.log').open('w')
env=os.environ.copy();env.update({'ANDROID_I_WANT_MY_TCG':'yes','ANDROID_AVD_HOME':str(TC/'avd'),'ANDROID_HOME':str(SDK),'ANDROID_SDK_ROOT':str(SDK),'LD_LIBRARY_PATH':str(TC/'local-libs/usr/lib/x86_64-linux-gnu')})
def adb(args,**kw):return subprocess.run([str(ADB),*args],env=env,**kw)
avd=TC/'avd/MarkReadUpgrade.avd';avd.mkdir(parents=True,exist_ok=True)
(TC/'avd/MarkReadUpgrade.ini').write_text('avd.ini.encoding=UTF-8\npath='+str(avd)+'\ntarget=android-35\n')
config=(ROOT/'tests/emulator_config.ini').read_text().replace('AvdId=MarkReadTest','AvdId=MarkReadUpgrade').replace('hw.lcd.width = 1080','hw.lcd.width = 480').replace('hw.lcd.height = 1920','hw.lcd.height = 854').replace('hw.lcd.density = 420','hw.lcd.density = 240')
(avd/'config.ini').write_text(config)
adb(['start-server'],check=True)
emu=subprocess.Popen([str(SDK/'emulator/emulator'),'-avd','MarkReadUpgrade','-no-window','-no-audio','-no-boot-anim','-no-snapshot','-gpu','swiftshader_indirect','-accel','off','-memory','2048','-cores','2','-no-metrics'],env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
try:
 start=time.monotonic();ready=False
 while time.monotonic()-start<600:
  if emu.poll() is not None:raise RuntimeError('Emulator stopped; see toolchain/emulator.log')
  state=adb(['devices'],capture_output=True,text=True).stdout
  if '\tdevice' in state:
   q=adb(['shell','getprop','sys.boot_completed'],capture_output=True,text=True,timeout=15)
   if q.stdout.strip()=='1':ready=True;break
  print('Waiting for Android boot:',int(time.monotonic()-start),'s',state.strip().replace('\n',' | '),flush=True);time.sleep(10)
 if not ready:raise RuntimeError('Android services did not become ready within 600 seconds without hardware acceleration')
 print('ANDROID BOOTED',flush=True)
 adb(['shell','input','keyevent','82'],check=True)
 adb(['shell','settings','put','global','window_animation_scale','0']);adb(['shell','settings','put','global','transition_animation_scale','0']);adb(['shell','settings','put','global','animator_duration_scale','0'])
 adb(['uninstall','vn.markread.local'],capture_output=True,text=True,timeout=60)
 previous=ROOT.parents[1]/'release/MarkRead-Android-1.1.1.apk'
 upgrade='SKIPPED: baseline APK not available'
 if previous.exists():
  adb(['install','-r',str(previous)],check=True,timeout=120)
  upgrade='PASS: baseline installed before upgrade'
 for apk in [ROOT/'dist/MarkRead-Android-1.1.3.apk',ROOT/'build/instrumentation/tests.apk']:adb(['install','-r',str(apk)],check=True,timeout=120)
 probe=adb(['shell','am','instrument','-w','-r','vn.markread.local.tests/vn.markread.local.tests.ProbeInstrumentation'],capture_output=True,text=True,timeout=900)
 (ROOT/'dist/ANDROID_INTEGRATION_RESULTS.txt').write_text('Upgrade install 1.1.1 -> 1.1.3: '+upgrade+'\n'+probe.stdout+'\n'+probe.stderr)
 print(probe.stdout,flush=True)
 adb(['logcat','-d','-v','brief'],stdout=(TC/'logcat.txt').open('w'))
 if 'checks passed' not in probe.stdout:raise RuntimeError('Android integration tests failed; see report')
 with (ROOT/'dist/MarkRead_Android_Emulator.png').open('wb') as out:adb(['exec-out','screencap','-p'],stdout=out,check=True)
finally:
 if emu.poll() is None:os.killpg(emu.pid,signal.SIGTERM)
 try:emu.wait(timeout=10)
 except subprocess.TimeoutExpired:os.killpg(emu.pid,signal.SIGKILL)
 adb(['kill-server']);log.close()
