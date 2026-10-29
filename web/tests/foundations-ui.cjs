const {chooseSettingsSection}=require('./layout-helpers.cjs');
// Rendered P2A checks; separate from the 439 historical assertions.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'web/dist/MarkRead.html'),'utf8').replace('<meta name="native-channel" content="__NATIVE_NONCE__">','');
let count=0;
function ok(value,label){assert.ok(value,label);console.log('PASS '+label);count++;}
(async()=>{
 const server=http.createServer((req,res)=>res.end(html));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.MARKREAD_CHROMIUM,headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(10000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('http://127.0.0.1:*/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:html}));
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.frameLocator('#reader').locator('body').waitFor();
  await page.locator('#settings').tap();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());
  const ids=await page.locator('#themes button').evaluateAll(xs=>xs.map(x=>x.dataset.theme));
  ok(ids.length===12,'all 12 existing theme choices remain');
  for(const id of ids){
   await page.locator(`#themes [data-theme="${id}"]`).tap();
   await page.waitForFunction(id=>{const frame=document.getElementById('reader').contentDocument;if(document.body.dataset.theme!==id||!frame?.body)return false;const tile=document.querySelector(`#themes [data-theme="${id}"]`);return frame.defaultView.getComputedStyle(frame.body).backgroundColor===getComputedStyle(tile).backgroundColor;},id);
   const view=await page.evaluate(()=>{
     const shell=getComputedStyle(document.body),frame=document.getElementById('reader').contentDocument;
     const reader=frame.defaultView.getComputedStyle(frame.body),tile=getComputedStyle(document.querySelector('#themes button.active'));
     return {shellBg:shell.backgroundColor,readerBg:reader.backgroundColor,shellText:shell.color,readerText:reader.color,
       shellToken:shell.getPropertyValue('--mr-text-primary').trim(),readerToken:frame.defaultView.getComputedStyle(frame.documentElement).getPropertyValue('--mr-text-primary').trim(),
       legacy:frame.defaultView.getComputedStyle(frame.documentElement).getPropertyValue('--accent').trim(),accent:frame.defaultView.getComputedStyle(frame.documentElement).getPropertyValue('--mr-accent-text').trim(),
       previewBg:tile.backgroundColor,previewText:tile.color,pressed:document.querySelector('#themes button.active').getAttribute('aria-pressed')};
   });
   ok(view.shellBg===view.readerBg&&view.shellText===view.readerText&&view.shellToken===view.readerToken&&view.legacy===view.accent&&view.previewBg===view.readerBg&&view.previewText===view.readerText&&view.pressed==='true',`rendered palette, aliases and preview: ${id}`);
  }
  await page.locator('#themes [data-theme=dark]').tap();
  ok(await page.locator('#themes [data-theme=dark]').evaluate(x=>{const s=getComputedStyle(x);return !x.matches(':focus-visible')&&(s.outlineStyle==='none'||s.outlineColor==='rgba(0, 0, 0, 0)')}),'touch on theme tile has no visible outer ring');
  await page.locator('#themes [data-theme=dark]').focus();await page.keyboard.press('Tab');
  ok(await page.evaluate(()=>{const x=document.activeElement,s=getComputedStyle(x);return x?.tagName==='BUTTON'&&x.matches(':focus-visible')&&s.outlineWidth==='2px'&&s.outlineColor==='rgb(232, 236, 233)'}),'keyboard focus uses a neutral two-pixel ring');
  ok(await page.locator('#themes [data-theme=dark]').getAttribute('aria-pressed')==='true','keyboard focus does not alter theme selection');
  await page.locator('#settingsDialog .close-dialog').tap();
  const control=page.locator('#findToggle'),box=await control.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  const normal=await control.evaluate(x=>getComputedStyle(x).backgroundColor);
  await page.mouse.down();
  await page.waitForTimeout(120);
  const pressed=await control.evaluate(x=>getComputedStyle(x).backgroundColor);
  ok(pressed!==normal,'toolbar button has a distinct pressed fill');
  await page.mouse.up();await page.waitForTimeout(200);
  if(await page.locator('#findbar').isVisible())await page.locator('#findClose').tap();await page.waitForTimeout(200);
  ok(await control.evaluate(x=>getComputedStyle(x).backgroundColor)===normal,'toolbar button returns to resting state after release and panel close');
  await page.locator('#filesInput').setInputFiles({name:'P2A.md',mimeType:'text/markdown',buffer:Buffer.from('# P2A\n\nVăn bản thử nghiệm.\n')});
  ok(await page.locator('.file-row.active').evaluate(x=>x.getAttribute('aria-current')==='page'&&getComputedStyle(x).backgroundColor!=='rgba(0, 0, 0, 0)'),'selected file keeps both current semantics and selected fill');
  ok(await page.locator('#prevFile').isDisabled()&&await page.locator('#nextFile').isDisabled(),'navigation remains truly disabled at file boundaries');
  ok(await page.locator('#prevFile').evaluate(x=>{const s=getComputedStyle(x);return s.opacity==='1'&&s.color!==getComputedStyle(document.body).color}),'disabled toolbar icon uses a token rather than container opacity');
  await page.locator('#filename').dispatchEvent('contextmenu');
  ok(await page.locator('#renameInput').evaluate(x=>{const s=getComputedStyle(x);return s.outlineWidth==='2px'&&s.caretColor!=='transparent'}),'rename input preserves neutral focus indicator and caret');
  await page.locator('#renameCancel').tap();
  await page.locator('#modeToggle').tap();await page.locator('[data-mode=edit]').tap();
  await page.locator('#editor').tap();
  ok(await page.locator('#editor').evaluate(x=>document.activeElement===x&&getComputedStyle(x).caretColor!=='transparent'&&x.selectionStart===x.selectionEnd),'source editor retains focus and caret');
  await page.locator('#editor').evaluate(x=>{x.setSelectionRange(2,5);x.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:'ắ'}));x.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'ắ'}));});
  ok(await page.locator('#editor').evaluate(x=>document.activeElement===x&&x.selectionStart===2&&x.selectionEnd===5),'CSS state changes leave source selection and synthetic composition in place');
  await page.locator('#settings').tap();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await chooseSettingsSection(page,'css');
  await page.locator('#customCSS').fill('body{color:#123456}h1{color:var(--accent)}');await page.locator('#applyCSS').tap();
  await page.waitForFunction(()=>{const frame=document.getElementById('reader').contentDocument;return frame?.body&&frame.defaultView.getComputedStyle(frame.body).color==='rgb(18, 52, 86)';});
  ok(await page.locator('#settingsDialog').evaluate(x=>getComputedStyle(x).color!=='rgb(18, 52, 86)'),'custom CSS stays inside the reader iframe');
  ok(await page.frameLocator('#reader').locator('h1').evaluate(x=>getComputedStyle(x).color!=='rgb(18, 52, 86)'),'legacy accent alias remains usable in custom CSS');
  await page.locator('#resetCSS').tap();
  await page.waitForFunction(()=>{const frame=document.getElementById('reader').contentDocument;return frame?.body&&frame.defaultView.getComputedStyle(frame.body).color!=='rgb(18, 52, 86)';});
  ok(errors.length===0,'no page errors across theme, focus, editor and CSS flows');
  console.log(`P2A FOUNDATIONS: ${count} PASS`);
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
