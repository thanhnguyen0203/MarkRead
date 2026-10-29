const {chooseSettingsSection}=require('./layout-helpers.cjs');
// Real Chromium renderer. Android/WebView100, TalkBack and physical dp require separate device QA.
const {chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),stage=Number(process.env.MARKREAD_ICON_STAGE||8),url='https://markread.test/';let count=0;
const ok=(value,label)=>{assert.ok(value,label);count++;console.log('PASS '+label);};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.MARKREAD_CHROMIUM}),context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(12000);
 const errors=[],remote=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&r.url()!==url)remote.push(r.url());});page.on('dialog',d=>d.accept());
 const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8').replace(/<meta name="native-channel"[^>]*>/,'');
 await page.route(url,r=>r.fulfill({contentType:'text/html; charset=utf-8',body:html}));await page.addInitScript(()=>localStorage.setItem('markread-appearance-v1',JSON.stringify({mermaid:false})));
 const checkIcon=async(selector,name,size=24)=>{
  const data=await page.locator(selector).evaluate(el=>{const svg=el.matches('svg')?el:el.querySelector('.mr-icon'),s=svg&&getComputedStyle(svg);return svg&&{name:svg.dataset.icon,hidden:svg.getAttribute('aria-hidden'),focusable:svg.getAttribute('focusable'),box:svg.getAttribute('viewBox'),stroke:svg.getAttribute('stroke-width'),width:s.width,height:s.height,color:s.color,parent:getComputedStyle(svg.parentElement).color};});
  ok(data&&data.name===name&&data.hidden==='true'&&data.focusable==='false'&&data.box==='0 0 24 24'&&data.stroke==='2'&&data.width===size+'px'&&data.height===size+'px',selector+': '+name+' geometry and decorative semantics');
 };
 const closeDrawer=async()=>{if(await page.locator('#menu').getAttribute('aria-expanded')==='true')await page.locator('#closeSidebar').click();};
 const openSettings=async()=>{await closeDrawer();await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());};
 const closeSettings=()=>page.locator('#settingsDialog .close-dialog').click();
 try{
  await page.goto(url);await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-startup'));
  await page.locator('#filesInput').setInputFiles([{name:'A.md',mimeType:'text/markdown',buffer:Buffer.from('# A\n\nNội dung đọc.\n\nMột khối khác.\n')},{name:'B.md',mimeType:'text/markdown',buffer:Buffer.from('# B\n')}]);await page.waitForFunction(()=>document.getElementById('filename').textContent==='A.md');
  for(const [id,name] of Object.entries({menu:'menu',prevFile:'chevron-left',nextFile:'chevron-right',findToggle:'search',download:'download',settings:'settings',modeToggle:'ellipsis-vertical'}))await checkIcon('#'+id,name);
  ok(await page.getByRole('button',{name:'Tìm và thay thế',exact:true}).count()===1&&await page.getByRole('button',{name:'Lưu bản sao Markdown',exact:true}).count()===1,'toolbar keeps accessible names without SVG-name duplication');
  ok(await page.locator('#prevFile').isDisabled()&&await page.locator('#prevFile svg').evaluate(s=>{const hex=getComputedStyle(document.body).getPropertyValue('--mr-disabled-text').trim();const rgb='rgb('+hex.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')+')';return getComputedStyle(s).color===rgb;}),'disabled arrow uses disabled token on a real disabled button');
  const arrow=await page.locator('#nextFile').boundingBox();await page.mouse.move(arrow.x+24,arrow.y+24);await page.mouse.down();const pressed=await page.locator('#nextFile').evaluate(x=>getComputedStyle(x).backgroundColor);await page.mouse.move(380,500);await page.mouse.up();
  ok(pressed!==await page.locator('#nextFile').evaluate(x=>getComputedStyle(x).backgroundColor)&&await page.locator('#filename').textContent()==='A.md','pressed icon state releases without selecting/navigating a file');
  await page.keyboard.press('Tab');await page.locator('#findToggle').focus();ok(await page.locator('#findToggle').evaluate(x=>x.matches(':focus-visible')&&getComputedStyle(x).outlineWidth==='2px'),'keyboard focus indicator survives icon migration');
  await page.locator('#findToggle').click();ok(await page.locator('#findbar').isVisible(),'click at icon control still opens find');await page.keyboard.press('Escape');
  if(stage>=2){
   await page.locator('#menu').click();for(const [id,name] of Object.entries({closeSidebar:'x',openMenu:'folder-open',openFolder:'folder-open',openFiles:'file-text',sortOrder:'arrow-up-down',forget:'x'}))await checkIcon('#'+id,name);
   await checkIcon('.file-search .mr-icon','search',16);await checkIcon('.open-chevron .mr-icon','chevron-down');
   await page.locator('#openMenu').click();ok(await page.locator('#openOptions').isVisible()&&await page.locator('#openMenu').getAttribute('aria-expanded')==='true','folder icon control preserves expanded/menu interaction');await page.keyboard.press('Escape');
   await page.locator('#sortOrder').click();ok(await page.locator('#sortOrder').getAttribute('aria-pressed')==='true'&&await page.locator('#filename').textContent()==='A.md','sort icon selected state follows actual order state without changing current file');await page.locator('#sortOrder').click();await closeDrawer();
  }
  if(stage>=3){
   const fixture=path.join(root,'test-results/ui-p2e/fixtures/Docs');fs.mkdirSync(path.join(fixture,'Part 2'),{recursive:true});for(const [name,text] of [['A 2.md','# A2\n\nMột khối.\n'],['A 10.md','# A10\n']])fs.writeFileSync(path.join(fixture,'Part 2',name),text);
   await page.locator('#folderInput').setInputFiles(fixture);await page.waitForFunction(()=>document.getElementById('filename').textContent==='A 2.md');await page.locator('#menu').click();await checkIcon('.folder-group>summary>.mr-icon','chevron-down',16);
   const summary=page.locator('.folder-group>summary').first();await summary.click();ok(!await summary.evaluate(x=>x.parentElement.open),'decorative folder chevron still toggles native details');await summary.click();
   ok(await page.locator('.file-icon').first().textContent()==='MD'&&await page.locator('.file-row[aria-current=page]').count()===1,'extensions remain metadata and current file semantics stay intact');
   const row=page.locator('.file-row').filter({hasText:'A 10'});await row.dispatchEvent('contextmenu');ok(await page.locator('#renameDialog').isVisible()&&await page.locator('#filename').textContent()==='A 2.md','file context menu does not replace the selected document');await page.locator('#renameCancel').click();await closeDrawer();
  }
  if(stage>=4){
   await openSettings();await checkIcon('#themes [data-theme=dark] .theme-check','check');
   ok(await page.getByRole('button',{name:'Tối',exact:true}).getAttribute('aria-pressed')==='true','theme accessible name excludes decorative check');
   await chooseSettingsSection(page,'typography');await checkIcon('#font .mr-icon','chevron-down');await page.locator('#font').click();await checkIcon('[data-font=sans] .option-check','check');
   await page.locator('[data-font=serif]').click();ok(await page.locator('[data-font=serif]').getAttribute('aria-selected')==='true'&&await page.locator('#fontText').textContent()==='Serif / sách','font selection and visible label survive SVG check');await closeSettings();
  }
  if(stage>=5){
   await page.locator('#findToggle').click();for(const [id,name] of Object.entries({findClose:'x',findPrev:'arrow-up',findNext:'arrow-down'}))await checkIcon('#'+id,name);
   await page.locator('#findRegex').click();await page.locator('#findInput').fill('[');await page.waitForFunction(()=>document.getElementById('findError').textContent.length>0);await checkIcon('#findError+.mr-icon','triangle-alert',16);
   ok(await page.locator('#replaceOne').isDisabled()&&await page.getByRole('alert').filter({hasText:/./}).count()>=1,'error icon keeps meaningful alert and disabled replacement');
   await page.locator('#findInput').fill('A');await page.waitForFunction(()=>document.getElementById('findError').textContent==='');ok(await page.locator('#findError+.mr-icon').isHidden(),'error decoration disappears when error clears');await page.locator('#findRegex').click();await page.locator('#findClose').click();
  }
  if(stage>=6){
   await openSettings();await chooseSettingsSection(page,'editing');await page.locator('#unifiedEnabled').check();await closeSettings();await page.locator('#modeToggle').click();await checkIcon('#chooseBlock','pencil');await page.locator('#chooseBlock').click();
   for(const [id,name] of Object.entries({blockPrevious:'chevron-left',blockNext:'chevron-right',blockEdit:'pencil',blockCancel:'x',blockClose:'x'}))await checkIcon('#'+id,name);
   await page.locator('#blockEdit').click();await checkIcon('#blockEdit','check');ok(await page.locator('#blockEdit .icon-label').textContent()==='Hoàn tất','block edit action changes both glyph and label without replacing the button');
   await page.locator('#blockCancel').click();await checkIcon('#blockEdit','pencil');await page.locator('#blockClose').click();
  }
  if(stage>=7){
   await openSettings();await chooseSettingsSection(page,'general');await checkIcon('#help','info');await page.locator('#help').click();await checkIcon('#helpDialog .close-dialog','x');ok(await page.getByRole('dialog',{name:'Hướng dẫn sử dụng',exact:true}).count()===1,'help retains one named dialog');await page.locator('#helpDialog .close-dialog').click();await closeSettings();
   await page.locator('#download').click();await checkIcon('#exportLink','download');await checkIcon('#copyExport','copy');ok(await page.locator('#exportText').inputValue()===await page.locator('#editor').inputValue(),'export preserves exact Markdown, no SVG enters source');await page.locator('#exportDialog .close-dialog').click();
   await page.locator('#filename').dispatchEvent('contextmenu');await checkIcon('#renameSubmit','pencil');await page.locator('#renameInput').fill('../bad');await page.locator('#renameSubmit').click();await checkIcon('#renameError+.mr-icon','triangle-alert',16);ok(await page.locator('#renameError').textContent()!=='','rename error keeps readable text alongside glyph');await page.locator('#renameCancel').click();
  }
  if(stage>=8){
   await checkIcon('#startupStatus .mr-icon','loader-circle',16);
   const all=await page.locator('.mr-icon').evaluateAll(nodes=>nodes.map(x=>({name:x.dataset.icon,id:x.id,children:x.children.length,hidden:x.getAttribute('aria-hidden'),focus:x.getAttribute('focusable'),href:x.querySelector('[href],[onload],script,use')})));
   const expected=JSON.parse(fs.readFileSync(path.join(root,'web/icons/manifest.json'),'utf8')).icons;
   ok(Object.keys(expected).every(name=>all.some(x=>x.name===name))&&all.every(x=>expected[x.name]&&x.children>0&&!x.id&&!x.href&&x.hidden==='true'&&x.focus==='false'),'all23 used icons have nonempty local SVG, no IDs/links/scripts or focusable decoration');
   ok(await page.locator('button .mr-icon').evaluateAll(nodes=>nodes.every(x=>x.closest('button').getAttribute('aria-label')||x.closest('button').getAttribute('aria-labelledby')||x.closest('button').textContent.trim())),'every icon button has a control-level accessible name');
   ok(!/__ICON_|__LUCIDE_LICENSE__/.test(html)&&html.includes('Lucide Contributors')&&html.includes('Cole Bemis'),'self-contained HTML includes resolved icons and license notices');
  }
  ok(errors.length===0,'no renderer errors in migrated groups');ok(remote.length===0,'no external icon/asset requests');
  console.log(`P2E ICON UI STAGE${stage}: ${count} PASS`);
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
