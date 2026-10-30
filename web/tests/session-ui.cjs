const {chooseSettingsSection}=require('./layout-helpers.cjs');
// Real renderer + persistent simulated Android MessagePort host; no Android services run here.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),url='https://appassets.androidplatform.net/app/index.html';
let checks=0;const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS '+label);};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.MARKREAD_CHROMIUM,headless:true});
 const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
 const docs=[{id:'a',name:'A.md',path:'Part/A.md',text:'# First\n'},{id:'b',name:'B.md',path:'Part/B.md',text:'# Second\n'}];
 const host={settings:null,scope:null,active:'',now:1000000,leftAt:0,reads:[],token:'initial'},errors=[];
 let context,page;
 async function start(){
  context=await browser.newContext({viewport:{width:390,height:844}});page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route(url,r=>r.fulfill({contentType:'text/html; charset=utf-8',body:html}));
  await page.exposeFunction('__nativeRequest',q=>{
   switch(q.op){
    case 'loadPreferences':return host.settings;
    case 'savePreferences':host.settings=q.args.settings;return true;
    case 'theme':return true;
    case 'chooseFolder':host.scope='folder';host.active='';host.token+='f';return summary();
    case 'chooseFiles':host.scope='files';host.active='';host.token+='s';return summary();
    case 'rememberDocument':assert.equal(q.args.sessionToken,host.token,'renderer uses the current native session token');host.active=q.args.fileId;return true;
    case 'restore':if(host.now-host.leftAt>=600000||!host.leftAt){host.active='';if(host.scope==='files')host.scope=null;}return summary();
    case 'index':return {entries:docs.map(d=>({...d,path:host.scope==='folder'?d.path:d.name,size:new TextEncoder().encode(d.text).length,document:true}))};
    case 'read':{host.reads.push(q.args.fileId);const d=docs.find(d=>d.id===q.args.fileId);return {data:Buffer.from(d.text).toString('base64'),eof:true};}
    case 'forget':host.active='';host.scope=null;return true;
    default:throw Error('Unsupported operation '+q.op);
   }
  });
  await page.addInitScript(()=>{
   if(window!==window.top)return;const channel=new MessageChannel();
   channel.port1.onmessage=async e=>{const q=JSON.parse(e.data);try{channel.port1.postMessage(JSON.stringify({id:q.id,result:await window.__nativeRequest(q)}));if(q.op==='restore')window.__restoreReady=true;}catch(e){channel.port1.postMessage(JSON.stringify({id:q.id,error:e.message}));}};
   window.__expire=()=>channel.port1.postMessage(JSON.stringify({event:'sessionExpired'}));
   channel.port1.start();window.addEventListener('load',()=>window.postMessage('markread-native-init:__NATIVE_NONCE__',location.origin,[channel.port2]));
  });
  await page.goto(url);await page.waitForFunction(()=>window.__restoreReady);
  if(host.scope)await page.waitForFunction(()=>document.querySelectorAll('.file-row').length===2&&document.getElementById('folderName').textContent==='LocalDocs');
  // All startup requests are FIFO; the restored welcome reader marks completion when no file is active.
  if(host.scope&&host.active)await filename(docs.find(d=>d.id===host.active).name);
  await page.frameLocator('#reader').locator('h1').waitFor();
 }
 function summary(){const active=docs.find(d=>d.id===host.active);return {generation:'g',sessionToken:host.token,label:'LocalDocs',folder:host.scope==='folder',count:host.scope?docs.length:0,activePath:host.scope&&active?(host.scope==='folder'?active.path:active.name):''};}
 const filename=name=>page.waitForFunction(n=>document.getElementById('filename').textContent===n,name);
 const close=async()=>{host.leftAt=host.now;await context.close();};
 async function choose(folder=true){if(!await page.locator('body').evaluate(el=>el.classList.contains('sidebar-open')))await page.locator('#menu').click();await page.locator('#openMenu').click();await page.locator(folder?'#openFolder':'#openFiles').click();await filename(host.settings?.descending?'B.md':'A.md');}
 try{
  await start();await choose();await page.locator('#nextFile').click();await filename('B.md');
  await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await page.locator('[data-theme=sepia]').click();await chooseSettingsSection(page,'typography');
  await page.locator('#font').click();await page.locator('[data-font=merriweather]').click();
  for(const [id,value] of [['fontSize','24'],['width','1080'],['lineHeight','2.1']])await page.locator('#'+id).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input'));},value);
  await chooseSettingsSection(page,'editing');await page.locator('#mermaidEnabled').uncheck();
  await chooseSettingsSection(page,'css');await page.locator('#customCSS').fill('h1 { color: #123456; }');await page.locator('#applyCSS').click();await page.locator('#settingsDialog .close-dialog').click();
  await page.locator('#menu').click();await page.locator('#sortOrder').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('markread-appearance-v1')).descending);
  // Drain the native port before closing the renderer.
  await page.waitForTimeout(100);
  ok(host.settings.theme==='sepia'&&host.settings.font==='merriweather'&&host.settings.size===24&&host.settings.width===1080&&host.settings.leading===2.1,'appearance saves without an opt-in toggle');
  ok(!host.settings.mermaid&&host.settings.descending&&host.settings.css==='h1{color:#123456}','editing, order and custom CSS save with appearance');
  const expected={...host.settings};await close();host.now+=599999;host.reads=[];await start();await filename('B.md');
  ok(host.reads.every(id=>id==='b')&&host.reads.length>0,'fresh renderer at 9m59.999s reopens only the last document');
  ok(await page.locator('.file-row').count()===2,'selected folder survives a fresh renderer');
  ok(await page.locator('body').getAttribute('data-theme')==='sepia'&&await page.locator('#fontSize').inputValue()==='24'&&await page.locator('#fontText').textContent()==='Merriweather','native preferences restore even with empty WebView localStorage');
  assert.deepEqual(host.settings,expected);ok(true,'every appearance preference survives a fresh browser context');
  await close();host.now+=600000;host.reads=[];await start();await filename('Chào mừng.md');
  ok(host.reads.length===0&&await page.locator('.file-row.active').count()===0,'exactly ten minutes reopens no document');
  ok(await page.locator('.file-row').count()===2&&await page.locator('#folderName').textContent()==='LocalDocs','expiry retains the folder and its file list');
  assert.deepEqual(host.settings,expected);ok(true,'session expiry retains all settings');
  await close();host.now+=1000;host.reads=[];await start();await filename('Chào mừng.md');ok(host.reads.length===0,'restarting again does not reopen an arbitrary first document');
  await choose(false);await filename('B.md'); // Descending order opens B first.
  await close();host.now+=599999;host.reads=[];await start();await filename('B.md');ok(host.reads.includes('b')&&await page.locator('.file-row').count()===2,'standalone file selection restores before ten minutes');
  await close();host.now+=600000;host.reads=[];await start();await filename('Chào mừng.md');ok(host.reads.length===0&&await page.locator('.file-row').count()===0,'expired standalone selection closes every selected file');
  await choose();await filename('B.md');host.active='';host.token+='expired';host.leftAt=host.now;
  await page.evaluate(()=>window.__expire());await filename('Chào mừng.md');
  ok(await page.locator('.file-row').count()===2,'live background expiry closes the current document and retains the folder');
  ok(await page.locator('body').getAttribute('data-theme')==='sepia','live background expiry retains the theme');
  if(!await page.locator('body').evaluate(el=>el.classList.contains('sidebar-open')))await page.locator('#menu').click();
  await page.locator('#forget').click();await page.waitForFunction(()=>document.querySelectorAll('.file-row').length===0);await close();host.now+=1000;await start();
  ok(!host.scope&&await page.locator('.file-row').count()===0,'forgotten scope stays forgotten after restart');
  assert.deepEqual(host.settings,expected);ok(true,'forgetting files leaves all preferences intact');
  ok(errors.length===0,'session scenarios have no renderer errors: '+errors.join('; '));
  console.log('Session UI:',checks,'checks passed');
 }finally{await context?.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
