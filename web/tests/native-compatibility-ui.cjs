// P2D: real renderer + MessagePort host simulation. No Activity, ContentResolver or Android device.
// Run NativeUiPolicyTest first; its output supplies the exact Java watchdog expression.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),url='https://appassets.androidplatform.net/app/index.html';
const probe=fs.readFileSync(process.env.MARKREAD_READY_SCRIPT||path.join(root,'build/ui-p2d/ready-script.js'),'utf8');
let count=0;const ok=(value,label)=>{assert.ok(value,label);count++;console.log('PASS '+label);};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.MARKREAD_CHROMIUM});
 const saved={theme:'sepia',font:'merriweather',size:24,width:1080,leading:2,css:'p { letter-spacing: 0.2px; }',unified:false,mermaid:false};
 const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8').replaceAll('__NATIVE_NONCE__','p2d-probe').replaceAll('__NATIVE_APPEARANCE__',Buffer.from(JSON.stringify(saved)).toString('base64')).replaceAll('__STARTUP_BACKGROUND__','#f5efdf');
 let context,page,errors=[];
 const start=async()=>{
  context=await browser.newContext({viewport:{width:390,height:844}});page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route(url,route=>route.fulfill({contentType:'text/html; charset=utf-8',body:html}));
  await page.addInitScript(()=>{
   if(window!==top)return;
   window.hostOps=[];window.hostFailure={restore:'Quyền truy cập không còn hiệu lực. Hãy chọn lại thư mục.'};window.hostCancelled={};window.exported='';let chunks=[];
   const docs=[{id:'a',name:'A.md',path:'A.md',text:'# Gốc A\n\nNội dung gốc.\n'},{id:'b',name:'B.md',path:'B.md',text:'# Gốc B\n'}];
   window.__connect=nonce=>{
    const channel=new MessageChannel();channel.port1.onmessage=e=>{
     const q=JSON.parse(e.data);hostOps.push(q);let result;
     if(hostFailure[q.op]){channel.port1.postMessage(JSON.stringify({id:q.id,error:hostFailure[q.op]}));return;}
     if(hostCancelled[q.op]){channel.port1.postMessage(JSON.stringify({id:q.id,result:{cancelled:true}}));return;}
     switch(q.op){
      case 'restore':case 'chooseFolder':case 'chooseFiles':result={generation:'scope',label:'LocalDocs',folder:true,count:docs.length,activePath:q.op==='restore'?'A.md':'',sessionToken:'session'};break;
      case 'index':result={entries:docs.map(({id,name,path,text})=>({id,name,path,size:new TextEncoder().encode(text).length,document:true}))};break;
      case 'read':{const d=docs.find(d=>d.id===q.args.fileId),bytes=new TextEncoder().encode(d.text);result={data:btoa(String.fromCharCode(...bytes)),eof:true};break;}
      case 'beginExport':chunks=[];result={token:'export'};break;
      case 'appendExport':chunks.push(atob(q.args.data));result=true;break;
      case 'finishExport':window.exported=new TextDecoder().decode(Uint8Array.from(chunks.join(''),c=>c.charCodeAt(0)));result={saved:true};break;
      case 'savePreferences':case 'rememberDocument':case 'theme':result=true;break;
      default:throw Error('Unexpected operation '+q.op);
     }
     channel.port1.postMessage(JSON.stringify({id:q.id,result}));
    };channel.port1.start();postMessage('markread-native-init:'+nonce,location.origin,[channel.port2]);
   };
  });await page.goto(url);await page.waitForFunction(()=>typeof markReadBack==='function');
 };
 const ready=()=>page.evaluate(probe);
 const name=label=>page.waitForFunction(x=>document.getElementById('filename').textContent===x,label);
 const choose=async()=>{if(await page.locator('#menu').getAttribute('aria-expanded')==='false')await page.locator('#menu').click();await page.locator('#openMenu').click();await page.locator('#openFolder').click();};
 const closeDrawer=async()=>{if(await page.locator('#menu').getAttribute('aria-expanded')==='true')await page.locator('#closeSidebar').click();};
 const toast=message=>page.waitForFunction(x=>document.getElementById('toast').textContent.includes(x),message);
 const draft='# Bản sửa Việt\n\nDữ liệu chưa xuất 📝\n';
 try{
  await start();
  ok(!await ready()&&await page.locator('#app').getAttribute('aria-busy')==='true','actual native probe detects missing bridge while startup stays pending');
  ok(await page.locator('html').evaluate(x=>getComputedStyle(x).backgroundColor)==='rgb(245, 239, 223)','saved light background is used while channel is missing');
  await page.evaluate(()=>__connect('wrong-nonce'));await page.waitForTimeout(100);
  ok(!await ready()&&await page.evaluate(()=>hostOps.length===0),'wrong nonce cannot initialize the renderer or run file commands');
  await page.evaluate(()=>__connect('p2d-probe'));await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-startup'));
  ok(await ready(),'valid delayed channel completes startup after recoverable restore failure');
  ok(await page.locator('#toast').textContent()==='Quyền truy cập không còn hiệu lực. Hãy chọn lại thư mục.','restore permission error keeps actionable picker message');
  ok(await page.locator('#filename').textContent()==='Chào mừng.md'&&await page.locator('.file-row').count()===0,'failed scope restore does not reopen an arbitrary file');
  ok(await page.locator('body').getAttribute('data-theme')==='sepia','restore failure retains saved theme');
  await page.evaluate(()=>delete hostFailure.restore);await choose();await name('A.md');await closeDrawer();
  ok(await page.locator('.file-row').count()===2&&await ready(),'system-picker host retry reuses live renderer and restores scoped list');
  await require('./layout-helpers.cjs').selectDocumentMode(page,'edit');await page.locator('#editor').fill(draft);
  await page.evaluate(()=>hostFailure.read='Tệp hoặc thư mục không còn tồn tại hoặc không đọc được. Hãy chọn lại bằng bộ chọn tài liệu.');await page.locator('#nextFile').click();await toast('không còn tồn tại');
  ok(await page.locator('#filename').textContent()==='A.md'&&await page.locator('#editor').inputValue()===draft,'missing next file cannot replace current draft or title');
  ok(await page.locator('.file-row').count()===2&&await ready(),'read error keeps existing scope and usable UI');
  await page.evaluate(()=>{delete hostFailure.read;hostFailure.chooseFolder='Quyền truy cập không còn hiệu lực. Hãy chọn lại thư mục.';});await choose();await toast('Quyền truy cập');await closeDrawer();
  ok(await page.locator('#editor').inputValue()===draft&&await page.locator('#filename').textContent()==='A.md','failed folder reselection preserves RAM draft despite discard confirmation');
  await page.evaluate(()=>{delete hostFailure.chooseFolder;hostCancelled.chooseFolder=true;});await choose();await page.waitForFunction(()=>hostOps.filter(x=>x.op==='chooseFolder').length===3);await closeDrawer();
  ok(await page.locator('#editor').inputValue()===draft&&await page.locator('.file-row').count()===2,'cancelled picker retains current draft and file list');
  await page.evaluate(()=>hostFailure.rename='Đổi tên cần quyền ghi. Chọn lại thư mục.');await page.locator('#filename').dispatchEvent('contextmenu');await page.locator('#renameInput').fill('Đổi.md');await page.locator('#renameSubmit').click();await page.waitForFunction(()=>document.getElementById('renameError').textContent.includes('quyền ghi'));
  ok(await page.locator('#renameDialog').isVisible()&&await page.locator('#renameInput').isEnabled(),'rename permission error stays visible with editable recovery controls');
  await page.locator('#renameCancel').click();ok(await page.locator('#editor').inputValue()===draft&&await page.locator('#filename').textContent()==='A.md','failed rename leaves title and Unicode draft intact');
  await page.evaluate(()=>hostFailure.finishExport='Không ghi được tệp. Hãy chọn vị trí lưu khác.');await page.locator('#download').click();await toast('Không ghi được');
  ok(await page.locator('#editor').inputValue()===draft&&await page.evaluate(()=>exported===''),'failed export cannot discard draft or report a successful write');
  await page.evaluate(()=>{delete hostFailure.finishExport;hostCancelled.finishExport=true;});await page.locator('#download').click();await toast('Đã hủy lưu');
  ok(await page.locator('#editor').inputValue()===draft&&await page.evaluate(()=>exported===''),'cancelled Android save keeps draft');
  await page.evaluate(()=>delete hostCancelled.finishExport);await page.locator('#download').click();await page.waitForFunction(x=>exported===x,draft);
  ok(await page.locator('#editor').inputValue()===draft,'retry exports exact Unicode bytes without resetting source');
  ok(await page.frameLocator('#reader').locator('p').first().evaluate(x=>getComputedStyle(x).letterSpacing)==='0.2px','custom reader CSS still applies through file access failures');
  ok(await page.evaluate(()=>!hostOps.some(x=>x.op==='forget'))&&await ready(),'recovery tests never forget scope or force a reload');
  ok(errors.length===0,'failure and recovery paths have no uncaught renderer errors');
  await context.close();await start();await page.evaluate(()=>{delete hostFailure.restore;__connect('p2d-probe');});await name('A.md');await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-startup'));
  ok(await ready()&&await page.locator('#editor').inputValue()==='# Gốc A\n\nNội dung gốc.\n','fresh JS heap restores original bytes, never claims RAM drafts survive process recreation');
  ok(await page.locator('body').getAttribute('data-theme')==='sepia'&&await page.locator('#fontSize').inputValue()==='24','fresh context receives saved native appearance independently of WebView storage');
  ok(errors.length===0,'fresh renderer has no uncaught errors');
  console.log(`P2D NATIVE COMPATIBILITY SIMULATION: ${count} PASS`);
 }finally{await context?.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
