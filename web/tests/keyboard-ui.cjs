const {chooseSettingsSection}=require('./layout-helpers.cjs');
// P2C: native Chromium text transactions + CDP composition + explicit synthetic key guards.
// This does not exercise Android Gboard, Telex/VNI, lifecycle, or SAF.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),qa=path.join(root,'test-results/ui-p2c');fs.mkdirSync(qa,{recursive:true});
const html=fs.readFileSync(path.join(root,'web/dist/MarkRead.html'),'utf8').replace('<meta name="native-channel" content="__NATIVE_NONCE__">','');
let count=0;const ok=(value,label)=>{assert.ok(value,label);count++;console.log('PASS '+label);};
async function start(browser,fallback=false){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(12000);
 if(fallback)await page.addInitScript(()=>{delete HTMLElement.prototype.inert;});
 await page.route('http://markread.test/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:html}));
 await page.goto('http://markread.test/');await page.frameLocator('#reader').locator('h1').waitFor();return page;
}
const mode=(page,value)=>require('./layout-helpers.cjs').selectDocumentMode(page,value);
const long='# Tiếng Việt\n\n'+Array.from({length:70},(_,i)=>`Đoạn ${i}. Nội dung nguyên vẹn và emoji 📝.`).join('\n\n')+'\n';
async function files(page){await page.locator('#filesInput').setInputFiles([{name:'A.md',mimeType:'text/markdown',buffer:Buffer.from(long)},{name:'B.md',mimeType:'text/markdown',buffer:Buffer.from('# B\n\nBài thứ hai.\n')}]);await page.waitForFunction(()=>document.getElementById('filename').textContent==='A.md');}
async function keyGuard(locator,key,extra={}){return locator.evaluate((x,{key,extra})=>{const e=new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...extra});x.dispatchEvent(e);return e.defaultPrevented;},{key,extra});}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.MARKREAD_CHROMIUM});const page=await start(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await files(page);await mode(page,'edit');const editor=page.locator('#editor');
  await editor.evaluate(x=>x.setSelectionRange(2,2));await page.keyboard.press('Tab');
  ok(await editor.inputValue()===long.slice(0,2)+'  '+long.slice(2),'plain Tab inserts exactly two spaces at the caret');
  await page.keyboard.press('Control+z');ok(await editor.inputValue()===long,'indent remains undoable through the native text history');
  await page.keyboard.press('Control+Shift+z');ok((await editor.inputValue()).slice(2,4)==='  ','indent remains redoable');
  const tabbed=await editor.inputValue();await page.keyboard.press('Shift+Tab');
  ok(await editor.inputValue()===tabbed&&await editor.evaluate(x=>document.activeElement!==x),'Shift+Tab leaves source without inserting text');
  await editor.focus();await page.keyboard.press('Escape');
  ok(await page.locator('#workspace').getAttribute('data-mode')==='edit'&&await page.locator('#settings').evaluate(x=>document.activeElement===x)&&await editor.inputValue()===tabbed,'Escape leaves source focus while retaining mode and content');
  await editor.focus();await editor.evaluate(x=>{x.setSelectionRange(80,92,'backward');x.scrollTop=320;});
  const selected=await editor.evaluate(x=>[x.selectionStart,x.selectionEnd,x.selectionDirection,x.scrollTop]);
  await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await page.locator('#settingsDialog .close-dialog').click();
  ok(await editor.evaluate((x,b)=>x.selectionStart===b[0]&&x.selectionEnd===b[1]&&x.selectionDirection===b[2]&&Math.abs(x.scrollTop-b[3])<1,selected),'toolbar and Settings preserve source selection and scroll');
  ok(await page.locator('#settings').evaluate(x=>document.activeElement===x),'closing Settings returns to its trigger without refocusing the editor');
  await editor.focus();await editor.evaluate(x=>x.setSelectionRange(10,10));await page.keyboard.insertText('X');
  await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await page.locator('#settingsDialog .close-dialog').click();await editor.focus();await page.keyboard.press('Control+z');
  ok(await editor.inputValue()===tabbed,'Settings does not clear the native undo transaction');
  await editor.evaluate(x=>{x.setSelectionRange(120,128,'backward');x.scrollTop=420;});const view=await editor.evaluate(x=>[x.selectionStart,x.selectionEnd,x.selectionDirection,x.scrollTop]);
  await page.locator('#nextFile').click();await page.waitForFunction(()=>document.getElementById('filename').textContent==='B.md');await page.locator('#prevFile').click();await page.waitForFunction(()=>document.getElementById('filename').textContent==='A.md');
  ok(await editor.evaluate((x,b)=>x.selectionStart===b[0]&&x.selectionEnd===b[1]&&x.selectionDirection===b[2]&&Math.abs(x.scrollTop-b[3])<1,view)&&await editor.inputValue()===tabbed,'file navigation restores the in-memory source view and draft');
  ok(await page.locator('#nextFile').evaluate(x=>document.activeElement===x),'a newly disabled navigation button transfers focus to the available neighbor');
  await editor.focus();await editor.evaluate(x=>x.setSelectionRange(200,200));const defaultInput=await editor.inputValue();await page.keyboard.insertText('AB');await page.keyboard.press('Backspace');await page.keyboard.press('Delete');await page.keyboard.press('Enter');
  ok(await editor.inputValue()===defaultInput.slice(0,200)+'A\n'+defaultInput.slice(201),'Backspace, Delete and Enter retain native text behavior');
  await editor.evaluate(x=>x.setSelectionRange(205,210));const pasteBefore=await editor.inputValue();await page.keyboard.insertText('Dán\nTiếng Việt 📝');ok(await editor.inputValue()===pasteBefore.slice(0,205)+'Dán\nTiếng Việt 📝'+pasteBefore.slice(210),'native text insertion replaces a selection with multiline Unicode');
  ok(!await keyGuard(editor,'f',{ctrlKey:true,altKey:true})&&await page.locator('#findbar').isHidden(),'Ctrl+Alt text input is not treated as a MarkRead shortcut');
  await mode(page,'read');await page.waitForTimeout(400);await page.frameLocator('#reader').locator('body').evaluate(x=>x.ownerDocument.defaultView.scrollTo({top:600,behavior:'instant'}));
  await page.locator('#nextFile').click();await page.frameLocator('#reader').getByRole('heading',{name:'B',exact:true}).waitFor();await page.locator('#prevFile').click();
  await page.waitForFunction(()=>{const d=document.getElementById('reader').contentDocument;return d?.querySelector('h1')?.textContent.includes('Tiếng Việt')&&Math.abs(d.scrollingElement.scrollTop-600)<2;});
  ok(true,'reader scroll is restored when returning to the same in-memory document');await mode(page,'edit');
  await editor.focus();await editor.evaluate(x=>x.setSelectionRange(40,40));await page.keyboard.press('Control+f');
  ok(await page.locator('#findInput').evaluate(x=>document.activeElement===x),'existing Ctrl+F enters find');await page.keyboard.press('Escape');
  ok(await editor.evaluate(x=>document.activeElement===x),'closing keyboard-opened find returns to the source field');
  await page.keyboard.press('Control+h');ok(await page.locator('#replaceInput').evaluate(x=>document.activeElement===x),'existing Ctrl+H enters replacement');
  await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await chooseSettingsSection(page,'general');await page.locator('#help').click();ok(!await keyGuard(page.locator('#helpDialog .close-dialog'),'f',{ctrlKey:true})&&await page.locator('#helpDialog .close-dialog').evaluate(x=>document.activeElement===x),'document shortcuts do not focus a workspace field behind a modal');await page.keyboard.press('Escape');
  ok(await page.locator('#helpDialog').isHidden()&&await page.locator('#settingsDialog').isVisible()&&await page.locator('#findbar').isVisible(),'Escape closes only the top dialog and leaves find intact');
  await page.keyboard.press('Escape');if(await page.locator('#settingsBack').isHidden()&&await page.locator('#settingsDialog').isVisible())await page.keyboard.press('Escape');ok(await page.locator('#settingsDialog').isHidden()&&await page.locator('#findbar').isVisible(),'Escape through category list closes Settings without closing the layer behind');await page.locator('#findClose').click();
  const beforePicker=await editor.inputValue(),picker=page.waitForEvent('filechooser');await editor.focus();await page.keyboard.press('Control+o');const chooser=await picker;ok(await chooser.element().getAttribute('id')==='filesInput','existing Ctrl+O opens the current file chooser');await chooser.setFiles([]);ok(await editor.inputValue()===beforePicker,'empty chooser selection leaves the current draft intact');
  await editor.focus();await editor.evaluate(x=>x.setSelectionRange(30,30));
  const cdp=await page.context().newCDPSession(page);
  await page.evaluate(()=>{window.imeEvents=[];window.readerLoads=0;window.p2cReader=document.getElementById('reader').contentDocument;document.getElementById('reader').addEventListener('load',()=>readerLoads++);for(const name of ['compositionstart','compositionupdate','compositionend','beforeinput','input'])document.getElementById('editor').addEventListener(name,e=>imeEvents.push({type:e.type,data:e.data,composing:e.isComposing,trusted:e.isTrusted}));});
  const beforeIME=await editor.inputValue();
  await cdp.send('Input.imeSetComposition',{text:'a',selectionStart:1,selectionEnd:1});await cdp.send('Input.imeSetComposition',{text:'ắ',selectionStart:1,selectionEnd:1});
  ok((await editor.inputValue()).slice(30,31)==='ắ','Chromium composition updates the native textarea candidate');
  await page.waitForTimeout(450);
  ok(await page.evaluate(()=>readerLoads===0&&document.getElementById('reader').contentDocument===p2cReader),'source composition does not replace the reader after the normal debounce');
  for(const [key,extra] of [['Tab',{isComposing:true}],['Escape',{isComposing:true}],['f',{ctrlKey:true,isComposing:true}],['s',{ctrlKey:true,keyCode:229}],['o',{ctrlKey:true,keyCode:229}],['h',{ctrlKey:true,keyCode:229}]])ok(!await keyGuard(editor,key,extra),'IME key is left to the browser: '+key);
  ok(await page.locator('#findbar').isHidden()&&await page.locator('#exportDialog').isHidden()&&await editor.evaluate(x=>document.activeElement===x),'composition shortcuts do not open UI or move focus');
  await cdp.send('Input.insertText',{text:'ắ'});
  ok(await editor.inputValue()===beforeIME.slice(0,30)+'ắ'+beforeIME.slice(30),'composition commits one Vietnamese character without duplication');
  fs.writeFileSync(path.join(qa,'composition-events.json'),JSON.stringify(await page.evaluate(()=>imeEvents),null,2));
  ok(await page.evaluate(()=>['compositionstart','compositionupdate','beforeinput','input'].every(type=>imeEvents.some(e=>e.type===type&&e.trusted))),'CDP exercises native candidate composition and input events');
  ok(await page.evaluate(()=>imeEvents.some(e=>e.type==='compositionend'&&e.data==='ắ')),'composition end is observed; its protocol-generated trust flag is recorded separately');
  await page.waitForFunction(()=>readerLoads>0);ok(await editor.evaluate(x=>document.activeElement===x&&x.selectionStart===31&&x.selectionEnd===31),'preview after composition retains editor focus and caret');
  await page.keyboard.press('Control+z');ok(await editor.inputValue()===beforeIME,'native composition remains undoable');await page.keyboard.press('Control+Shift+z');
  const committed=await editor.inputValue();await cdp.send('Input.imeSetComposition',{text:'VNI',selectionStart:3,selectionEnd:3});await cdp.send('Input.imeSetComposition',{text:'',selectionStart:0,selectionEnd:0});
  ok(await editor.inputValue()===committed,'cancelled composition leaves the committed text intact');
  const late=await editor.evaluate(x=>{const text=x.value+'\nKết thúc muộn: ắ';x.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));x.dispatchEvent(new CompositionEvent('compositionupdate',{bubbles:true,data:'a'}));x.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'ắ'}));x.value=text;x.dispatchEvent(new InputEvent('input',{bubbles:true,data:'ắ',inputType:'insertCompositionText',isComposing:true}));return text;});
  await editor.focus();await page.keyboard.press('Control+s');ok(await page.locator('#exportText').inputValue()===late,'Ctrl+S exports the final text after a synthetic late composition input');await page.locator('#exportDialog .close-dialog').click();
  await editor.evaluate(x=>x.setSelectionRange(10,20));await page.locator('#menu').click();
  ok(await page.locator('#closeSidebar').evaluate(x=>document.activeElement===x)&&await page.locator('main').evaluate(x=>x.inert&&x.getAttribute('aria-hidden')==='true'),'opening the mobile drawer focuses a button and isolates main');
  ok(!await keyGuard(page.locator('#closeSidebar'),'Tab',{ctrlKey:true}),'drawer does not intercept the browser or system Ctrl+Tab chord');
  await page.keyboard.press('Shift+Tab');ok(await page.locator('#sidebar').evaluate(x=>x.contains(document.activeElement)),'drawer Shift+Tab wraps inside its active modal layer');await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');ok(await page.locator('#menu').evaluate(x=>document.activeElement===x)&&await page.locator('main').evaluate(x=>!x.inert&&!x.hasAttribute('aria-hidden')),'drawer Escape restores its trigger and releases main');
  ok(await editor.evaluate(x=>x.selectionStart===10&&x.selectionEnd===20),'drawer does not overwrite the source selection');
  await page.locator('#menu').click();await page.locator('#openMenu').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('End');ok(await page.locator('#openFiles').evaluate(x=>document.activeElement===x),'open menu supports End');await page.keyboard.press('Home');ok(await page.locator('#openFolder').evaluate(x=>document.activeElement===x),'open menu supports Home');
  await page.keyboard.press('Tab');ok(await page.locator('#openOptions').isHidden()&&await page.locator('#sidebar').evaluate(x=>x.contains(document.activeElement)),'native Tab exits and closes a menu without hiding its destination');await page.keyboard.press('Escape');
  await page.locator('#menu').click();await page.keyboard.press('Control+f');ok(await page.locator('#findInput').evaluate(x=>document.activeElement===x)&&await page.locator('main').evaluate(x=>!x.inert)&&await page.locator('#menu').getAttribute('aria-expanded')==='false','explicit search shortcut leaves the drawer before focusing workspace search');await page.keyboard.press('Escape');
  await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await chooseSettingsSection(page,'typography');await page.locator('#font').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('End');
  ok(await page.locator('#fontOptions button').evaluateAll(xs=>xs.filter(x=>x.tabIndex===0).length===1),'font listbox has one roving tab stop');await page.keyboard.press('Enter');ok(await page.locator('#fontOptions').isHidden()&&await page.locator('#font').evaluate(x=>document.activeElement===x),'font activation closes and restores its trigger');
  ok(await page.locator('#chooseBlock,#blockNavigator,#unifiedEnabled').count()===0,'block editing keyboard controls removed');await page.locator('#settingsDialog .close-dialog').click();await mode(page,'read');const unchanged=await editor.inputValue();await page.frameLocator('#reader').locator('.md-block').first().click();ok(await page.frameLocator('#reader').locator('.block-source').count()===0&&await editor.inputValue()===unchanged,'reader keyboard/click path leaves source intact');
  const fallback=await start(browser,true);await fallback.locator('#menu').click();ok(await fallback.locator('main').evaluate(x=>x.getAttribute('aria-hidden')==='true'&&[...x.querySelectorAll('button,textarea,iframe')].filter(y=>y.getClientRects().length&&getComputedStyle(y).visibility!=='hidden').every(y=>y.disabled||y.tabIndex===-1)),'drawer fallback removes main tab stops without inert support');await fallback.keyboard.press('Escape');ok(await fallback.locator('#settings').evaluate(x=>x.tabIndex===0)&&await fallback.locator('#menu').evaluate(x=>document.activeElement===x),'drawer fallback restores original tab stops and focus');
  await fallback.setViewportSize({width:1280,height:800});await mode(fallback,'split');ok(await fallback.locator('#settings').evaluate(x=>document.activeElement===x),'split activation leaves focus on a visible trigger');await fallback.setViewportSize({width:390,height:844});await fallback.locator('#settings').click();await chooseSettingsSection(fallback,'editing');ok(await fallback.locator('#documentMode').isVisible(),'mode select stays reachable at narrow width');await fallback.locator('#settingsDialog .close-dialog').click();await mode(fallback,'edit');
  const fallbackBefore=await fallback.locator('#editor').inputValue();await fallback.keyboard.insertText('X');await fallback.evaluate(()=>{document.execCommand=()=>false;});const unsupportedBefore=await fallback.locator('#editor').inputValue();await fallback.keyboard.press('Tab');ok(await fallback.locator('#editor').inputValue()===unsupportedBefore&&await fallback.locator('#editor').evaluate(x=>document.activeElement!==x),'unsupported native indent keeps ordinary Tab navigation and does not mutate text');await fallback.locator('#editor').focus();await fallback.keyboard.press('Control+z');ok(await fallback.locator('#editor').inputValue()===fallbackBefore,'unsupported indent does not clear earlier native undo');await fallback.close();
  fs.writeFileSync(path.join(qa,'composition-events.json'),JSON.stringify(await page.evaluate(()=>imeEvents),null,2));ok(errors.length===0,'no page errors across keyboard, focus and composition flows');console.log(`P2C KEYBOARD: ${count} PASS`);
 }catch(error){await page.screenshot({path:path.join(qa,'failure.png')}).catch(()=>{});throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
