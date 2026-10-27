from pathlib import Path
import concurrent.futures, hashlib, urllib.request, zipfile, os
ROOT=Path(__file__).resolve().parent
items=[('build-tools_r35_linux.zip','https://dl.google.com/android/repository/build-tools_r35_linux.zip','2cfaa0bbb2336e9ec18ed3ecea84fa2e2af607bc'),('platform-35_r02.zip','https://dl.google.com/android/repository/platform-35_r02.zip','0bb560a90a7a2cbd0dd8348224d518b638fe7949'),('ecj.jar','https://repo.maven.apache.org/maven2/org/eclipse/jdt/ecj/3.37.0/ecj-3.37.0.jar',None)]
def fetch(item):
 name,url,sha=item;p=ROOT/name
 if not p.exists():
  with urllib.request.urlopen(url,timeout=30) as r,p.open('wb') as f:
   while True:
    b=r.read(1024*1024)
    if not b:break
    f.write(b)
 if sha and hashlib.sha1(p.read_bytes()).hexdigest()!=sha:raise ValueError('Checksum mismatch: '+name)
 if name.endswith('.zip'):
  dest=ROOT/('build-tools' if name.startswith('build-tools') else 'platform')
  if not dest.exists():
   with zipfile.ZipFile(p) as z:
    for e in z.infolist():
     z.extract(e,dest)
     mode=(e.external_attr>>16)&0o777
     if mode:os.chmod(dest/e.filename,mode)
 return name,p.stat().st_size
with concurrent.futures.ThreadPoolExecutor(3) as ex:
 for result in ex.map(fetch,items):print(result,flush=True)
