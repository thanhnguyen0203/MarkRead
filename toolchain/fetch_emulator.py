from pathlib import Path
import concurrent.futures, urllib.request, hashlib, zipfile, os
R=Path(__file__).resolve().parent
items=[('emulator.zip','https://dl.google.com/android/repository/emulator-linux_x64-16632760.zip','a7e7c486f392cbf1a7502441b079b3f35493f134',R/'sdk'),('image.zip','https://dl.google.com/android/repository/sys-img/android/x86_64-35_r02.zip','2d857d170c0d1b827149565da34b3383e5306f7f',R/'sdk/system-images/android-35/default'),('platform-tools.zip','https://dl.google.com/android/repository/platform-tools_r37.0.1-linux.zip','477254aa5f903c15cf51001717bdf347fb6b53e0',R/'sdk')]
def run(item):
 name,url,sha,dest=item;p=R/name
 if not p.exists():
  with urllib.request.urlopen(url,timeout=30) as req,p.open('wb') as out:
   while True:
    b=req.read(1024*1024)
    if not b:break
    out.write(b)
 if hashlib.sha1(p.read_bytes()).hexdigest()!=sha:raise RuntimeError('checksum '+name)
 dest.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(p) as z:
  for e in z.infolist():
   z.extract(e,dest)
   mode=(e.external_attr>>16)&0o777
   if mode:os.chmod(dest/e.filename,mode)
 print(name,p.stat().st_size,'verified and extracted',flush=True)
with concurrent.futures.ThreadPoolExecutor(3) as pool:
 list(pool.map(run,items))
