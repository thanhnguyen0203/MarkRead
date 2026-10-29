const {chooseSettingsSection}=require('./layout-helpers.cjs');
// End-to-end UI checks; requires Playwright and a Chromium executable.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),qa=path.join(root,'test-results/1.1.5/browser');
const fixture=path.join(qa,'fixtures','Docs');fs.mkdirSync(fixture,{recursive:true});
const sample='# A2\n\nĐoạn **đậm**.\n\n## Giữ nguyên\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n```python\nprint(2)\n```\n\n$x^2+1$\n';
for(const [name,text] of [['Chương 2/A 2.md',sample],['Chương 2/A 10.md','# A10\n'],['Chương 10/Sâu/Z.md','# Z\n'],['Bài 1.md','# B1\n'],['Bài 2.md','# B2\n']]){const p=path.join(fixture,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);}
let count=0;function ok(value,name){assert.ok(value,name);console.log('PASS '+name);count++;}
(async()=>{
 const html=fs.readFileSync(path.join(root,'web/dist/MarkRead.html'),'utf8').replace('<meta name="native-channel" content="__NATIVE_NONCE__">','');
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.MARKREAD_CHROMIUM,headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1'))requests.push(r.url());});page.on('dialog',d=>d.accept());
 await page.route('http://127.0.0.1:*/**',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:html}));
 const selectMode=async id=>{await page.locator('#modeToggle').click();await page.locator('#modeOptions [data-mode='+id.replace('Mode','')+']').click();};
 const selectOpen=async id=>{await page.locator('#openMenu').click();await page.locator('#'+id).click();};
 const frame=()=>page.frameLocator('#reader');const eq=async(sel,text)=>{await page.waitForFunction(([s,t])=>document.querySelector(s)?.textContent===t,[sel,text]);};
 try{
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'load'});await frame().locator('h1').waitFor();
  ok(await page.locator('footer,.sidebar-bottom,#zoomIn,#zoomOut').count()===0,'removed both bottom bars');
  ok(await page.locator('#settings svg').count()===1,'settings gear at right');
  await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());ok(await page.locator('#themes button').count()===12,'12 themes');
  for(const [width,height] of [[390,844],[1280,800]]){
   await page.setViewportSize({width,height});
   for(const id of await page.locator('#themes button').evaluateAll(xs=>xs.map(x=>x.dataset.theme))){
    const button=page.locator(`#themes [data-theme="${id}"]`),preview=await button.evaluate(x=>{const s=getComputedStyle(x);return {bg:s.backgroundColor,text:s.color}});
    await button.click();
    await page.waitForFunction(({id,preview})=>{const d=document.getElementById('reader').contentDocument;if(!d?.body||document.body.dataset.theme!==id)return false;const s=d.defaultView.getComputedStyle(d.body);return s.backgroundColor===preview.bg&&s.color===preview.text},{id,preview});
    ok(await button.evaluate(x=>{const s=getComputedStyle(x);return (s.outlineStyle==='none'||s.outlineColor==='rgba(0, 0, 0, 0)')&&s.boxShadow.includes('inset')&&!s.boxShadow.includes('), ')}),'theme preview matches actual reader with one selection border: '+id+' '+width);
   }
   await page.screenshot({path:path.join(qa,'theme-previews-'+width+'.png')});
  }
  await page.setViewportSize({width:390,height:844});
  await chooseSettingsSection(page,'typography');ok(await page.locator('#section-appearance').isHidden(),'one settings section visible');
  await page.locator('#font').click();await page.locator('[data-font=merriweather]').click();await page.waitForFunction(()=>{const d=document.getElementById('reader').contentDocument;return d?.body&&d.fonts.check('18px Merriweather')&&getComputedStyle(d.body).fontFamily.includes('Merriweather')});
  ok(true,'Merriweather loaded from packaged data');
  await page.screenshot({path:path.join(qa,'settings-portrait.png')});
  await page.locator('#settingsDialog .close-dialog').click();await page.locator('#folderInput').setInputFiles(fixture);
  await eq('#filename','A 2.md');await frame().locator('h1').filter({hasText:'A2'}).waitFor();
  ok(await page.locator('.folder-group').count()===3,'nested folder tree includes grandchildren');
  ok(await page.locator('#prevFile').isDisabled(),'previous disabled at first file');
  await page.locator('#nextFile').click();await eq('#filename','A 10.md');await page.locator('#prevFile').click();await eq('#filename','A 2.md');ok(true,'next and previous use natural numeric order');
  await selectMode('editMode');await page.locator('#editor').fill(sample+'\nDraft 📝');await page.locator('#nextFile').click();await eq('#filename','A 10.md');await page.locator('#prevFile').click();await eq('#filename','A 2.md');ok((await page.locator('#editor').inputValue()).endsWith('Draft 📝'),'draft survives navigation');
  await page.locator('#editor').fill(sample);await selectMode('readMode');
  await page.locator('#menu').click();await page.locator('#sortOrder').click();await page.locator('#scrim').click({position:{x:380,y:350}});await page.locator('#nextFile').click();await eq('#filename','Bài 2.md');ok(true,'reverse order controls file navigation');
  await page.locator('#prevFile').click();await eq('#filename','A 2.md');
  await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await chooseSettingsSection(page,'editing');await page.locator('#unifiedEnabled').check();await page.locator('#settingsDialog .close-dialog').click();await frame().locator('.md-block').first().waitFor();
  ok(await page.locator('#modeOptions [data-mode]').evaluateAll(xs=>xs.every(x=>x.hidden))&&await page.locator('#modeMenu').isVisible(),'unified hides separate modes and retains keyboard editing tools');
  await frame().locator('h1').click();
  ok(await frame().locator('.inline-tools').count()===0&&await frame().locator('.block-source').evaluate(x=>{const s=getComputedStyle(x),box=getComputedStyle(x.parentElement),body=getComputedStyle(x.ownerDocument.body);return s.borderWidth==='0px'&&s.backgroundColor==='rgba(0, 0, 0, 0)'&&s.resize==='none'&&s.fontFamily===body.fontFamily&&box.borderWidth==='0px'}),'unified source edits directly on the page without frame or toolbar');
  await page.screenshot({path:path.join(qa,'unified-frameless.png')});await frame().locator('.block-source').fill('# Hủy\n');await frame().locator('.block-source').press('Escape');await frame().locator('h1').filter({hasText:'A2'}).waitFor();ok((await page.locator('#editor').inputValue())===sample,'cancel restores exact source');
  await frame().locator('h1').click();await frame().locator('.block-source').fill('# Tiêu đề mới');await frame().locator('.block-source').press('Control+Enter');await frame().locator('h1').filter({hasText:'Tiêu đề mới'}).waitFor();assert.equal(await page.locator('#editor').inputValue(),sample.replace('# A2\n','# Tiêu đề mới\n'));ok(true,'block editing preserves remaining source exactly');
  await page.evaluate(()=>{const d=document.getElementById('reader').contentDocument;d.querySelector('h1').click();const t=d.querySelector('.block-source');t.value='# Tiêu đề mới dài hơn';t.dispatchEvent(new Event('input'));t.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',ctrlKey:true,bubbles:true}));d.querySelector('p').click();});
  await frame().locator('h1').filter({hasText:'Tiêu đề mới dài hơn'}).waitFor();ok((await page.locator('#editor').inputValue())===sample.replace('# A2\n','# Tiêu đề mới dài hơn\n'),'fast consecutive taps cannot reuse stale source offsets');
  await frame().locator('table').click();ok((await frame().locator('.block-source').inputValue()).startsWith('| A | B |'),'table opens its Markdown block');await frame().locator('.block-source').press('Control+Enter');await frame().locator('table').waitFor();
  await frame().locator('pre').click();ok((await frame().locator('.block-source').inputValue()).startsWith('```python'),'code opens fenced source');await frame().locator('.block-source').press('Control+Enter');await frame().locator('pre').waitFor();
  ok(await frame().locator('.add-block').count()===0,'reader has no append-block control');
  await page.locator('#download').click();ok((await page.locator('#exportText').inputValue()).includes('Tiêu đề mới'),'export includes unified edits');await page.locator('#exportDialog .close-dialog').click();
  await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await page.locator('#unifiedEnabled').uncheck();await chooseSettingsSection(page,'css');await page.locator('#customCSS').fill('h1 { color: #ff0000; }');await page.locator('#applyCSS').click();await page.waitForFunction(()=>{const d=document.getElementById('reader').contentDocument;return d?.querySelector('h1')&&getComputedStyle(d.querySelector('h1')).color==='rgb(255, 0, 0)'});ok(true,'custom CSS applies');
  await page.locator('#customCSS').fill('p{background:url(https://evil.invalid/x)}');await page.locator('#applyCSS').click();ok(!(await page.locator('#cssFeedback').textContent()).includes('Đã áp dụng'),'unsafe CSS rejected');
  await chooseSettingsSection(page,'general');ok(await page.evaluate(()=>!!localStorage.getItem('markread-appearance-v1')),'settings save automatically');await page.locator('#settingsDialog .close-dialog').click();await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await chooseSettingsSection(page,'editing');ok(await page.locator('.reading-modes,#readMode,#editMode,#splitMode').count()===0,'duplicate mode controls removed from settings');await page.locator('#settingsDialog .close-dialog').click();
  await selectMode('editMode');
  const hostile='# Safe\n\n<script>window.PWNED=true</script>\n\n<div data-start="0" data-end="999999" onclick="alert(1)">Plain</div>\n\n[Next][ref]\n\n[ref]: ../Bài%201.md\n\n$x^2$\n\n```mermaid\nflowchart TD\nA-->B\n```\n';
  await page.locator('#editor').fill(hostile);await selectMode('readMode');await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await chooseSettingsSection(page,'editing');await page.locator('#unifiedEnabled').check();await page.locator('#settingsDialog .close-dialog').click();
  await frame().locator('.diagram svg').waitFor();ok(await frame().locator('.katex').count()===1,'math and Mermaid render in unified mode');
  ok(await frame().locator('script,[onclick],[data-end="999999"]').count()===0,'untrusted HTML cannot forge block edit offsets');
  await frame().locator('a[data-target]').filter({hasText:'Next'}).click();await eq('#filename','Bài 1.md');ok(true,'reference link opens selected local Markdown in unified mode');
  await page.setViewportSize({width:1280,height:800});await page.screenshot({path:path.join(qa,'reader-landscape.png')});
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal application overflow');
  await page.reload();await page.waitForFunction(()=>document.body.dataset.theme==='gruvbox');ok(true,'appearance settings persist after reload');
  ok(errors.length===0,'no JavaScript runtime errors: '+errors.join('; '));ok(requests.length===0,'no external network requests');
  console.log('Browser UI:',count,'checks passed');
 }catch(e){await page.screenshot({path:path.join(qa,'ui-failure.png')}).catch(()=>{});throw e;}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
