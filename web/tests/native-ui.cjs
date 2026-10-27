// Chromium test of the real Android UI code path with a simulated MessagePort host.
// This does NOT run Android or replace the instrumentation probe.
const {chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');let count=0;function ok(x,name){assert.ok(x,name);count++;console.log('PASS '+name)}
(async()=>{
 const b=await chromium.launch({executablePath:process.env.MARKREAD_CHROMIUM,headless:true,args:['--no-sandbox']});const page=await b.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(15000);page.on('dialog',d=>d.accept());const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');await page.route('https://appassets.androidplatform.net/app/index.html',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
 await page.addInitScript(()=>{
  if(window!==window.top)return;
  const docs=[{id:'f2',name:'A 2.md',path:'Part 2/A 2.md',text:'# Native A2\n\nNội dung gốc.\n'},{id:'f10',name:'A 10.md',path:'Part 2/A 10.md',text:'# Native A10\n'},{id:'f3',name:'B.md',path:'Part 10/Deep/B.md',text:'# Native B\n'}];
  for(const d of docs){d.bytes=new TextEncoder().encode(d.text);d.size=d.bytes.length;}
  const summary={generation:'selected',label:'LocalDocs',count:docs.length,folder:true};window.__hostExport='';window.__hostOps=[];window.__empty=false;let chunks=[];
  const channel=new MessageChannel();channel.port1.onmessage=e=>{const q=JSON.parse(e.data);window.__hostOps.push(q);let result;
   switch(q.op){
    case 'restore':result={count:0,generation:'none',label:'None',folder:false};break;
    case 'chooseFolder':result=summary;break;
    case 'chooseFiles':result=window.__empty?{count:0,generation:'empty',label:'Empty',folder:false}:summary;break;
    case 'index':result={entries:docs.slice(q.args.offset,q.args.offset+q.args.limit).map(({id,name,path,size})=>({id,name,path,size}))};break;
    case 'read':{const d=docs.find(d=>d.id===q.args.fileId);if(!d)throw Error('unscoped read');const bytes=d.bytes.slice(q.args.offset,q.args.offset+q.args.length);result={data:btoa(String.fromCharCode(...bytes)),eof:q.args.offset+bytes.length>=d.bytes.length};break;}
    case 'rename':{const d=docs.find(d=>d.id===q.args.fileId);if(!d)throw Error('unscoped rename');if(q.args.name==='Denied.md'){channel.port1.postMessage(JSON.stringify({id:q.id,error:'Đổi tên cần quyền ghi. Chọn lại thư mục.'}));return;}d.path=d.path.slice(0,d.path.lastIndexOf('/')+1)+q.args.name;d.name=q.args.name;result={id:d.id,name:d.name,path:d.path,size:d.size};break;}
    case 'theme':case 'forget':result=true;break;
    case 'chooseCss':if(window.__cssFailure){channel.port1.postMessage(JSON.stringify({id:q.id,error:'Không đọc được CSS.'}));return;}result=window.__cssCancelled?{cancelled:true}:{css:'h1 { color: #12ab34; }',name:'External.css'};break;
    case 'beginExport':chunks=[];result={token:'export'};break;
    case 'appendExport':chunks.push(atob(q.args.data));result=true;break;
    case 'finishExport':window.__hostExport=new TextDecoder().decode(Uint8Array.from(chunks.join(''),c=>c.charCodeAt(0)));result={saved:true};break;
    default:throw Error('unsupported host command '+q.op);
   }
   channel.port1.postMessage(JSON.stringify({id:q.id,result}));
  };channel.port1.start();window.addEventListener('load',()=>window.postMessage('markread-native-init:__NATIVE_NONCE__',location.origin,[channel.port2]));
 });
 const selectMode=async id=>{await page.locator('#settings').click();await page.locator('[data-section=editing]').click();await page.locator('#'+id).click();await page.locator('#settingsDialog .close-dialog').click();};
 const selectOpen=async id=>{await page.locator('#openMenu').click();await page.locator('#'+id).click();};
 const frame=()=>page.frameLocator('#reader');const filename=async name=>page.waitForFunction(n=>document.getElementById('filename').textContent===n,name);
 try{
  await page.goto('https://appassets.androidplatform.net/app/index.html');await page.waitForFunction(()=>window.__hostOps.some(o=>o.op==='restore'));ok(true,'Android transport initialization and restore path');
  await page.locator('#menu').click();await selectOpen('openFolder');await filename('A 2.md');await frame().getByRole('heading',{name:'Native A2',exact:true}).waitFor();ok(await page.locator('.folder-group').count()===3,'native snapshot creates nested folder tree');
  ok(await page.evaluate(()=>window.__hostOps.some(o=>o.op==='read'&&o.args.fileId==='f2'&&o.args.length===65536)),'scoped native reads use bounded chunks');
  await page.locator('#nextFile').click();await filename('A 10.md');await page.locator('#prevFile').click();await filename('A 2.md');ok(true,'native file navigation uses natural numeric order');
  await selectMode('editMode');await page.locator('#editor').fill('# Native draft\n\nTiếng Việt 📝');await page.locator('#nextFile').click();await filename('A 10.md');await page.locator('#prevFile').click();await filename('A 2.md');ok((await page.locator('#editor').inputValue()).endsWith('Tiếng Việt 📝'),'native file changes preserve drafts');
  await page.locator('#download').click();await page.waitForFunction(()=>window.__hostExport==='# Native draft\n\nTiếng Việt 📝');ok(true,'native export sends exact Unicode source');
  const hold=async locator=>{await locator.click({trial:true});const r=await locator.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.waitForTimeout(650);await page.mouse.up();await page.locator('#renameDialog').waitFor({state:'visible'});};
  await hold(page.locator('#filename'));await page.locator('#renameInput').fill('A 10.md');await page.locator('#renameSubmit').click();ok((await page.locator('#renameError').textContent()).includes('cùng tên'),'duplicate rename rejected before native mutation');
  await page.locator('#renameInput').fill('../escape');await page.locator('#renameSubmit').click();ok((await page.locator('#renameError').textContent()).includes('không hợp lệ'),'rename cannot escape selected directory');
  await page.locator('#renameInput').fill('Denied.md');await page.locator('#renameSubmit').click();await page.waitForFunction(()=>document.getElementById('renameError').textContent.includes('quyền ghi'));await filename('A 2.md');ok(true,'native permission failure retains existing file and reports recovery');
  await page.locator('#renameInput').fill('A 3.md');await page.locator('#renameSubmit').click();await filename('A 3.md');ok(await page.locator('#renameDialog').isHidden(),'long-press title completes native rename');
  ok((await page.locator('#editor').inputValue())==='# Native draft\n\nTiếng Việt 📝','rename preserves unsaved Unicode draft');
  await page.locator('#nextFile').click();await filename('A 10.md');await page.locator('#prevFile').click();await filename('A 3.md');ok((await page.locator('#editor').inputValue()).includes('Native draft'),'renamed file retains draft after navigation');
  await page.locator('#menu').click();await hold(page.locator('.file-row').filter({hasText:'A 10'}));await page.locator('#renameInput').fill('A 4.md');await page.locator('#renameSubmit').click();await page.waitForFunction(()=>document.querySelector('.file-row[aria-label="Part 2/A 4.md"]'));await filename('A 3.md');ok(true,'long-press unselected file renames it without switching current document');await page.locator('#scrim').click({position:{x:380,y:350}});
  await page.locator('#nextFile').click();await filename('A 4.md');await page.locator('#prevFile').click();await filename('A 3.md');ok(await page.evaluate(()=>window.__hostOps.some(q=>q.op==='rename'&&q.args.fileId==='f2'&&q.args.name==='A 3.md')),'rename transmits only scoped opaque file ID and basename');
  await selectMode('readMode');await page.locator('#settings').click();await page.locator('[data-section=editing]').click();await page.locator('#unifiedEnabled').check();await page.locator('#settingsDialog .close-dialog').click();await frame().locator('.md-block h1').waitFor();await frame().locator('h1').click();await frame().locator('.block-source').fill('# Native unified\n');await frame().locator('.block-source').press('Control+Enter');await frame().getByRole('heading',{name:'Native unified',exact:true}).waitFor();ok(true,'unified editing works on native-loaded source');
  await page.locator('#download').click();await page.waitForFunction(()=>window.__hostExport==='# Native unified\n\nTiếng Việt 📝');ok(true,'native export includes unified changes');
  await hold(page.locator('#filename'));await page.locator('#renameInput').fill('A 3.txt');await page.locator('#renameSubmit').click();await filename('A 3.txt');ok((await page.locator('#editor').inputValue()).includes('Native unified'),'native rename changes extension and retains unified draft');await page.locator('#nextFile').click();await filename('A 4.md');await page.locator('#prevFile').click();await filename('A 3.txt');ok(true,'native txt stays in navigation');await hold(page.locator('#filename'));await page.locator('#renameInput').fill('A 3.notes');await page.locator('#renameSubmit').click();await filename('A 3.notes');await page.locator('#download').click();await page.waitForFunction(()=>window.__hostOps.some(o=>o.op==='beginExport'&&o.args.name==='A 3.notes'));ok(true,'native export receives full renamed extension');
  await page.locator('#settings').click();await page.locator('[data-section=css]').click();await page.locator('#importCSS').click();await page.waitForFunction(()=>document.getElementById('customCSS').value.includes('#12ab34'));ok(true,'native CSS import accepts independently selected host result');await page.evaluate(()=>window.__cssCancelled=true);await page.locator('#customCSS').fill('h2 { color: red; }');await page.locator('#importCSS').click();await page.waitForTimeout(100);ok(await page.locator('#customCSS').inputValue()==='h2 { color: red; }','cancelled CSS picker preserves editor');await page.evaluate(()=>{window.__cssCancelled=false;window.__cssFailure=true});await page.locator('#importCSS').click();await page.waitForFunction(()=>document.getElementById('cssFeedback').textContent==='Không đọc được CSS.');ok(await page.locator('#customCSS').inputValue()==='h2 { color: red; }','CSS read failure retains prior editor');ok(await page.locator('.file-row').count()===3&&await page.locator('#filename').textContent()==='A 3.notes','CSS import and cancellation preserve native scope');await page.locator('#settingsDialog .close-dialog').click();
  await page.evaluate(()=>window.__empty=true);await page.locator('#menu').click();await selectOpen('openFiles');await filename('Chào mừng.md');ok(await page.locator('.file-row').count()===0,'empty newly selected native scope clears prior file list');ok(await page.locator('#prevFile').isDisabled()&&await page.locator('#nextFile').isDisabled(),'navigation disables after empty scope');
  if(!await page.locator('body').evaluate(el=>el.classList.contains('sidebar-open')))await page.locator('#menu').click();await page.locator('#forget').click();await page.waitForFunction(()=>window.__hostOps.some(o=>o.op==='forget'));ok(true,'native forget command is sent');
  ok(errors.length===0,'no native UI JavaScript errors: '+errors.join('; '));console.log('Simulated native UI:',count,'checks passed');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
