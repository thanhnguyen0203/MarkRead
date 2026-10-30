const {chooseSettingsSection}=require('./layout-helpers.cjs');
// P2C Android-facing Back contract with a MessagePort host simulation, not Android instrumentation.
const {chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');let count=0;const ok=(value,label)=>{assert.ok(value,label);count++;console.log('PASS '+label);};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.MARKREAD_CHROMIUM}),page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(12000);
 const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8'),url='https://appassets.androidplatform.net/app/index.html',errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(url,route=>route.fulfill({contentType:'text/html; charset=utf-8',body:html}));
 await page.addInitScript(()=>{
  if(window!==top)return;const channel=new MessageChannel();window.hostOps=[];
  channel.port1.onmessage=e=>{const q=JSON.parse(e.data);hostOps.push(q.op);const result=q.op==='restore'?{count:0,generation:'empty',label:'Empty',folder:false}:q.op==='loadPreferences'?null:true;channel.port1.postMessage(JSON.stringify({id:q.id,result}));};channel.port1.start();
  addEventListener('load',()=>postMessage('markread-native-init:__NATIVE_NONCE__',location.origin,[channel.port2]));
 });
 const back=()=>page.evaluate(()=>window.markReadBack());
 try{
  await page.goto(url);await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-startup'));
  ok(await back()==='exit','clean native-facing Back still returns exit');
  await page.locator('#filesInput').setInputFiles({name:'Native.md',mimeType:'text/markdown',buffer:Buffer.from('# Native\n\nĐoạn gốc.\n')});await page.waitForFunction(()=>document.getElementById('filename').textContent==='Native.md');
  await require('./layout-helpers.cjs').selectDocumentMode(page,'edit');await page.locator('#editor').evaluate(x=>x.setSelectionRange(x.value.length,x.value.length));
  const cdp=await page.context().newCDPSession(page);await cdp.send('Input.imeSetComposition',{text:'Việt',selectionStart:4,selectionEnd:4});
  ok(await back()==='handled'&&await page.locator('#workspace').getAttribute('data-mode')==='edit'&&await page.locator('#editor').evaluate(x=>document.activeElement===x),'Back does not leave a composing source field or commit it early');
  await cdp.send('Input.insertText',{text:'Việt'});ok(await back()==='handled'&&await page.locator('#workspace').getAttribute('data-mode')==='read','after composition, Back keeps the existing edit-to-read transition');
  ok(await page.locator('#settings').evaluate(x=>document.activeElement===x),'edit-to-read Back returns focus to a visible control');ok(await back()==='dirty','dirty Back still returns the native confirmation contract');
  await page.locator('#menu').click();await page.locator('#openMenu').focus();await page.keyboard.press('ArrowDown');
  ok(await back()==='handled'&&await page.locator('#openOptions').isHidden()&&await page.locator('#menu').getAttribute('aria-expanded')==='true','Back closes the open menu before its drawer');
  ok(await page.locator('#openMenu').evaluate(x=>document.activeElement===x),'Back restores the open-menu trigger');
  ok(await back()==='handled'&&await page.locator('#menu').getAttribute('aria-expanded')==='false'&&await page.locator('#menu').evaluate(x=>document.activeElement===x),'next Back closes the drawer and returns focus');
  await page.locator('#findToggle').click();await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await back();ok(await back()==='handled'&&await page.locator('#settingsDialog').isHidden()&&await page.locator('#findbar').isVisible(),'native-facing dialog Back leaves find behind it intact');
  ok(await back()==='handled'&&await page.locator('#findbar').isHidden(),'following Back closes find');
  await page.locator('#filename').dispatchEvent('contextmenu');await page.locator('#renameInput').evaluate(x=>x.setSelectionRange(0,0));await cdp.send('Input.imeSetComposition',{text:'Đổi',selectionStart:3,selectionEnd:3});
  ok(await back()==='handled'&&await page.locator('#renameDialog').isVisible(),'Back preserves a composing rename field');await cdp.send('Input.insertText',{text:'Đổi'});await back();
  ok(await page.locator('#renameDialog').isHidden()&&await page.locator('#filename').textContent()==='Native.md','closing rename after composition does not rename or save');
  ok(await page.evaluate(()=>!hostOps.some(op=>['rename','beginExport','appendExport','finishExport','forget'].includes(op))),'focus and Back actions send no file mutation commands');
  await require('./layout-helpers.cjs').selectDocumentMode(page,'edit');await cdp.send('Input.imeSetComposition',{text:'Không giữ sau hết phiên',selectionStart:22,selectionEnd:22});await page.evaluate(()=>dispatchEvent(new Event('markread-session-expired')));
  await page.waitForFunction(()=>document.getElementById('filename').textContent==='Chào mừng.md'&&document.getElementById('workspace').dataset.mode==='read');
  ok(!(await page.locator('#editor').inputValue()).includes('Không giữ sau hết phiên'),'simulated session expiry cannot reapply composition from the previous scope');
  ok(await page.locator('#menu').isVisible()&&await page.evaluate(()=>hostOps.filter(op=>op==='restore').length===2),'scope expiry keeps the existing restore contract usable');ok(errors.length===0,'no errors in the simulated native-facing keyboard path');
  console.log(`P2C KEYBOARD NATIVE SIMULATION: ${count} PASS`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
