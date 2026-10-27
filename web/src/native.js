/** Message-port transport. No JavaScriptInterface and no network calls. */
export const IS_ANDROID=!!document.querySelector('meta[name="native-channel"]');
let bootTimer;
if(IS_ANDROID)bootTimer=setTimeout(()=>{const s=document.getElementById('toast');if(s){s.textContent='Kênh Android chưa sẵn sàng. Hãy đóng và mở lại app.';s.classList.add('show');}},20000);
let port,serial=0;const pending=new Map();let resolveReady;
export const nativeReady=new Promise(resolve=>{resolveReady=resolve;});
if(IS_ANDROID)window.addEventListener('message',event=>{
  const nonce=document.querySelector('meta[name="native-channel"]')?.content;
  if(port||window!==window.top||location.href!=='https://appassets.androidplatform.net/app/index.html'||event.data!=='markread-native-init:'+nonce||event.ports.length!==1)return;
  clearTimeout(bootTimer);port=event.ports[0];port.onmessage=e=>{
    try{const answer=JSON.parse(e.data),task=pending.get(answer.id);if(!task)return;pending.delete(answer.id);clearTimeout(task.timer);if(answer.error)task.reject(new Error(String(answer.error)));else task.resolve(answer.result);}catch{}
  };port.start();resolveReady();
});else resolveReady();
export async function nativeCall(op,args={},timeout=30000){
  await nativeReady;if(!port)throw new Error('Kênh Android chưa sẵn sàng.');
  return new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Thao tác mất quá lâu. Hãy thử chọn lại tệp hoặc thư mục.'));},timeout);pending.set(id,{resolve,reject,timer});port.postMessage(JSON.stringify({id,op,args}));});
}
function from64(value){const s=atob(value);return Uint8Array.from(s,c=>c.charCodeAt(0));}
function to64(bytes){let result='';for(let i=0;i<bytes.length;i+=8192)result+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(result);}
export class NativeFile {
  constructor(meta,label,folder){this.document=meta.document===true;this.id=meta.id;this.name=meta.name;this.size=meta.size;this.path=meta.path;this.webkitRelativePath=folder?label+'/'+meta.path:'';}
  async arrayBuffer(){let offset=0;const chunks=[];while(true){const chunk=await nativeCall('read',{fileId:this.id,offset,length:65536});const bytes=from64(chunk.data);chunks.push(bytes);offset+=bytes.length;if(offset>10*1024*1024)throw new Error('Tệp vượt giới hạn dung lượng.');if(chunk.eof)break;if(!bytes.length)throw new Error('Không đọc tiếp được tệp.');}const all=new Uint8Array(offset);let at=0;for(const b of chunks){all.set(b,at);at+=b.length;}return all.buffer;}
}
export async function nativeSnapshot(summary){
  if(summary.cancelled)return null;
  const entries=[];for(let offset=0;offset<summary.count;offset+=32){const page=await nativeCall('index',{generation:summary.generation,offset,limit:32});entries.push(...page.entries);}
  return {files:entries.map(e=>new NativeFile(e,summary.label,summary.folder)),...summary};
}
export async function nativeExport(name,text){
  const bytes=new TextEncoder().encode(text);const begin=await nativeCall('beginExport',{name,size:bytes.length});
  for(let i=0;i<bytes.length;i+=65536)await nativeCall('appendExport',{token:begin.token,data:to64(bytes.subarray(i,i+65536))});
  return nativeCall('finishExport',{token:begin.token},300000);
}
