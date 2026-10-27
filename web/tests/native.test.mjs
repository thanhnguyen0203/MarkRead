import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {MessageChannel} from 'node:worker_threads';
let native,client,server,listener,requests=[],exported=[],source=new TextEncoder().encode('Tiếng Việt 📝\n'.repeat(9000));
before(async()=>{
 globalThis.document={querySelector:()=>({content:'NONCE'}),getElementById:()=>({})};
 globalThis.window={addEventListener:(name,fn)=>{if(name==='message')listener=fn;}};window.top=window;
 globalThis.location={href:'https://appassets.androidplatform.net/app/index.html'};
 native=await import('../src/native.js');
 const c=new MessageChannel();client=c.port1;server=c.port2;
 server.onmessage=e=>{const c=JSON.parse(e.data);requests.push(c);let result;
  if(c.op==='echo')result=c.args;
  if(c.op==='error'){server.postMessage(JSON.stringify({id:c.id,error:'Không có quyền'}));return;}
  if(c.op==='read'){const b=source.subarray(c.args.offset,c.args.offset+c.args.length);result={data:Buffer.from(b).toString('base64'),eof:c.args.offset+b.length>=source.length};}
  if(c.op==='index')result={entries:[{id:'f1',path:'a.md',name:'a.md',size:10}]};
  if(c.op==='beginExport'){exported=[];result={token:'EXPORT'};}
  if(c.op==='appendExport'){assert.equal(c.args.token,'EXPORT');exported.push(Buffer.from(c.args.data,'base64'));result=true;}
  if(c.op==='finishExport')result={saved:true};
  server.postMessage(JSON.stringify({id:c.id,result}));
 };
 listener({data:'markread-native-init:WRONG',ports:[client]});
 listener({data:'markread-native-init:NONCE',ports:[client]});
 await native.nativeReady;
});
after(()=>{client.close();server.close();});
test('request/response transport preserves data',async()=>assert.deepEqual(await native.nativeCall('echo',{vi:'Xác suất'}),{vi:'Xác suất'}));
test('native errors propagate without being treated as success',async()=>assert.rejects(native.nativeCall('error'),/Không có quyền/));
test('native file reads bounded chunks and reassembles UTF-8 exactly',async()=>{const f=new native.NativeFile({id:'i',path:'sub/a.md',name:'a.md',size:source.length},'Docs',true);assert.equal(f.webkitRelativePath,'Docs/sub/a.md');assert.deepEqual(new Uint8Array(await f.arrayBuffer()),source);for(const r of requests.filter(r=>r.op==='read'))assert.equal(r.args.length,65536);});
test('single file does not invent relative directory access',()=>{const f=new native.NativeFile({id:'i',path:'a.md',name:'a.md',size:0},'Docs',false);assert.equal(f.webkitRelativePath,'');});
test('cancelled picker preserves existing scope',async()=>assert.equal(await native.nativeSnapshot({cancelled:true}),null));
test('snapshot lists scoped IDs through pagination',async()=>{const s=await native.nativeSnapshot({count:1,generation:'G',label:'Docs',folder:true});assert.equal(s.files[0].id,'f1');assert.equal(s.files[0].webkitRelativePath,'Docs/a.md');const r=requests.filter(r=>r.op==='index').pop();assert.deepEqual(r.args,{generation:'G',offset:0,limit:32});});
test('export streams exact UTF-8 bytes in bounded messages',async()=>{const text='Bản sửa tiếng Việt 📝\n'.repeat(10000);assert.deepEqual(await native.nativeExport('bài.md',text),{saved:true});assert.equal(Buffer.concat(exported).toString('utf8'),text);assert.ok(exported.every(b=>b.length<=65536));});

test('empty selected folder is a new scope, distinct from cancelled picker',async()=>{const s=await native.nativeSnapshot({count:0,generation:'empty',label:'Empty',folder:true});assert.equal(s.folder,true);assert.deepEqual(s.files,[]);assert.equal(s.label,'Empty');});
