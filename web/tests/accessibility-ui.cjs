const {chooseSettingsSection}=require('./layout-helpers.cjs');
// P2B rendered semantics, control bounds and touch regressions. No Android device is simulated here.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),qa=path.join(root,'test-results/ui-p2b');
fs.mkdirSync(qa,{recursive:true});
const html=fs.readFileSync(path.join(root,'web/dist/MarkRead.html'),'utf8').replace('<meta name="native-channel" content="__NATIVE_NONCE__">','');
let count=0;
function ok(value,label){assert.ok(value,label);count++;console.log('PASS '+label);}
async function start(browser,options={}){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,...options});page.setDefaultTimeout(12000);
 await page.route('http://markread.test/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:html}));
 await page.goto('http://markread.test/');await page.frameLocator('#reader').locator('h1').waitFor();return page;
}
async function targets(page,selector){
 return page.locator(selector).evaluateAll(xs=>xs.filter(x=>x.getClientRects().length&&getComputedStyle(x).visibility!=='hidden').map(x=>{
  const r=x.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return {id:x.id||x.textContent.trim().slice(0,30),width:r.width,height:r.height,x:r.x,y:r.y,right:r.right,bottom:r.bottom,hit:!!hit&&(x===hit||x.contains(hit))};
 }));
}
const large=xs=>xs.length>0&&xs.every(x=>x.width>=47.99&&x.height>=47.99);
const separate=xs=>xs.every((a,i)=>xs.slice(i+1).every(b=>Math.min(a.right,b.right)-Math.max(a.x,b.x)<=.1||Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)<=.1));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.MARKREAD_CHROMIUM,headless:true});
 const page=await start(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  ok(await page.locator('#sidebar').evaluate(x=>getComputedStyle(x).visibility==='hidden')&&await page.locator('#menu').getAttribute('aria-expanded')==='false','closed mobile sidebar matches its expanded state');
  await page.keyboard.press('Tab');ok(await page.locator('#menu').evaluate(x=>x===document.activeElement),'first Tab reaches a visible control instead of the closed sidebar');
  ok(await page.getByRole('button',{name:'Mở',exact:true}).count()===0,'closed sidebar controls are excluded from role queries');
  const measurements={};
  for(const [width,height] of [[320,568],[360,800],[390,844],[600,960],[680,800],[820,800],[844,390],[910,800],[1024,800],[1280,800]]){
   await page.setViewportSize({width,height});
   const bounds=await targets(page,'main>header button:not(.mode-options button)');measurements[`${width}x${height}`]=bounds;
   ok(large(bounds)&&separate(bounds)&&bounds.every(x=>x.hit&&x.x>=0&&x.right<=width+.1)&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`header targets fit without overlap at ${width}x${height}`);
   ok(await page.evaluate(()=>document.getElementById('readerPane').getBoundingClientRect().top>=document.querySelector('main>header').getBoundingClientRect().bottom),'header reserves space above Markdown at '+width);
  }
  fs.writeFileSync(path.join(qa,'target-measurements.json'),JSON.stringify(measurements,null,2));
  await page.setViewportSize({width:390,height:844});
  const fixture=path.join(qa,'fixtures/Docs');fs.mkdirSync(path.join(fixture,'Part 2'),{recursive:true});
  fs.writeFileSync(path.join(fixture,'Part 2/A 2.md'),'# A2\n\nOriginal line.\n');fs.writeFileSync(path.join(fixture,'Part 2/A 10.md'),'# A10\n\nOther line.\n');
  await page.locator('#folderInput').setInputFiles(fixture);await page.waitForFunction(()=>document.getElementById('filename').textContent==='A 2.md');
  await page.locator('#menu').tap();
  await page.waitForFunction(()=>document.getElementById('sidebar').getBoundingClientRect().left>=-.1);
  ok(await page.locator('#menu').getAttribute('aria-expanded')==='true'&&await page.getByRole('dialog',{name:'Tệp tài liệu'}).isVisible(),'open mobile sidebar has a dialog name and synchronized expanded state');
  ok(await page.getByRole('list',{name:'Tệp Markdown'}).count()===1&&await page.getByRole('button',{name:'Part 2/A 2.md',exact:true}).count()===1,'file list exposes a real named button within a list');
  ok(await page.locator('#files').evaluate(x=>[...x.querySelectorAll('ul')].every(ul=>[...ul.children].every(li=>li.tagName==='LI'))&&[...x.children].every(li=>li.tagName==='LI')&&[...x.querySelectorAll('.file-row')].every(b=>b.parentElement.tagName==='LI'&&!b.hasAttribute('role'))),'nested folders and files retain valid list-item ownership');
  ok(await page.locator('.file-row.active').getAttribute('aria-current')==='page','active document retains current-page semantics');
  const library=await targets(page,'#sidebar button,#fileFilter,#sidebar summary');
  ok(large(library)&&library.every(x=>x.hit),'sidebar controls and folder disclosures have usable 48 CSS px bounds');
  ok(separate(await targets(page,'.folder-caption button')),'sort and forget targets do not overlap');
  await page.getByRole('button',{name:'Mở',exact:true}).tap();
  ok(await page.getByRole('menu',{name:'Mở tài liệu'}).isVisible()&&await page.locator('#openMenu').getAttribute('aria-expanded')==='true','open-file menu has a name and expanded state');
  ok(large(await targets(page,'#openOptions button')),'open-file menu targets are at least 48 CSS px');await page.keyboard.press('Escape');
  const unselected=page.getByRole('button',{name:'Part 2/A 10.md',exact:true}),row=await unselected.boundingBox();
  await page.mouse.move(row.x+row.width/2,row.y+row.height/2);await page.mouse.down();await page.waitForTimeout(600);await page.mouse.up();
  ok(await page.getByRole('dialog',{name:'Đổi tên tệp',exact:true}).isVisible()&&await page.locator('#filename').textContent()==='A 2.md','long press still renames an unselected file without opening it');
  ok(await page.getByRole('textbox',{name:'Tên tệp',exact:true}).count()===1&&await page.locator('#renameForm').getAttribute('aria-busy')==='false','rename input keeps its label and idle form state');
  ok(large(await targets(page,'#renameDialog button,#renameInput')),'rename controls have 48 CSS px targets');await page.locator('#renameCancel').tap();
  await page.locator('#closeSidebar').tap();
  ok(await page.locator('#menu').getAttribute('aria-expanded')==='false'&&await page.getByRole('button',{name:'Mở',exact:true}).count()===0,'explicit sidebar close hides its accessibility subtree');
  await page.setViewportSize({width:1280,height:800});await page.getByRole('button',{name:'Mở',exact:true}).waitFor({state:'visible'});ok(await page.getByRole('button',{name:'Mở',exact:true}).isVisible(),'desktop sidebar becomes accessible after a breakpoint change');
  await page.setViewportSize({width:390,height:844});ok(await page.getByRole('button',{name:'Mở',exact:true}).count()===0,'returning to mobile closes the accessibility subtree consistently');
  await page.locator('#settings').tap();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());ok(await page.getByRole('dialog',{name:'Cài đặt',exact:true}).isVisible(),'settings dialog has an accessible name');
  for(const section of ['appearance','typography','editing','css','general']){
   await chooseSettingsSection(page,section);
   ok(await page.locator(`[data-section=${section}]`).getAttribute('aria-current')==='true'&&await page.locator(`[data-section=${section}]`).getAttribute('aria-controls')===`section-${section}`&&await page.locator('.settings-section:visible').count()===1,'settings section state and controls relationship: '+section);
   ok(large(await targets(page,'#settingsDialog button')),'visible settings button targets: '+section);
  }
  await page.locator('#help').tap();ok(await page.getByRole('dialog',{name:'Hướng dẫn sử dụng',exact:true}).isVisible(),'help dialog exposes its purpose by name');await page.locator('#helpDialog .close-dialog').tap();
  await chooseSettingsSection(page,'typography');
  ok(large(await targets(page,'#section-typography input[type=range]')),'range input hit areas are 48 CSS px high');
  await page.locator('#font').tap();ok(await page.getByRole('listbox',{name:'Phông chữ bài đọc',exact:true}).isVisible()&&await page.locator('#fontOptions').getByRole('option',{selected:true}).count()===1,'font listbox retains its name and single selected option');
  ok(large(await targets(page,'#fontOptions button')),'font options have 48 CSS px targets');await page.locator('[data-font=sans]').tap();
  await chooseSettingsSection(page,'editing');ok(large(await targets(page,'.setting-toggle'))&&separate(await targets(page,'.setting-toggle'))&&large(await targets(page,'.setting-toggle input')),'switch labels and inputs have separated 48 CSS px targets');
  await chooseSettingsSection(page,'appearance');await page.screenshot({path:path.join(qa,'settings-dark-390.png')});
  await page.locator('#themes [data-theme=light]').tap();await page.waitForTimeout(200);await page.screenshot({path:path.join(qa,'settings-light-390.png')});await page.locator('#themes [data-theme=dark]').tap();
  await page.waitForFunction(()=>{const d=document.getElementById('reader').contentDocument;return d?.body&&d.defaultView.getComputedStyle(d.body).backgroundColor===getComputedStyle(document.body).backgroundColor;});
  await page.locator('#settingsDialog .close-dialog').tap();await page.screenshot({path:path.join(qa,'header-390.png')});
  await page.locator('#findToggle').tap();ok(await page.locator('#findToggle').getAttribute('aria-expanded')==='true'&&await page.locator('#findToggle').getAttribute('aria-controls')==='findbar','find disclosure exposes its actual state and panel');
  ok(large(await targets(page,'#findbar button,#findbar input'))&&separate(await targets(page,'#findPrev,#findNext')),'search and replacement controls have 48 CSS px targets');await page.locator('#findClose').tap();ok(await page.locator('#findToggle').getAttribute('aria-expanded')==='false','closing find clears expanded state');
  await page.locator('#modeToggle').tap();ok(await page.getByRole('menuitemradio',{checked:true}).count()===1,'mode menu keeps one checked mode');await page.locator('#modeOptions [data-mode=edit]').tap();
  const original=await page.locator('#editor').inputValue();await page.locator('#editor').tap();await page.locator('#editor').evaluate(x=>{window.p2bEditor=x;x.setSelectionRange(2,2);});
  await page.keyboard.insertText('Việt');const edited=await page.locator('#editor').inputValue();await page.keyboard.press('Control+z');ok(await page.locator('#editor').inputValue()===original,'source undo retains original Markdown');await page.keyboard.press('Control+Shift+z');ok(await page.locator('#editor').inputValue()===edited,'source redo retains the edit');
  await page.setViewportSize({width:390,height:560});ok(await page.locator('#editor').evaluate(x=>x===window.p2bEditor&&document.activeElement===x&&x.selectionStart===x.selectionEnd),'viewport resize retains the editor node, focus and caret');await page.setViewportSize({width:390,height:844});
  ok(await page.getByRole('img',{name:'Có bản sửa chưa xuất'}).count()===1,'dirty marker has meaningful accessible text');
  await page.locator('#download').tap();ok(await page.getByRole('dialog',{name:'Lưu bản Markdown',exact:true}).isVisible()&&await page.getByRole('link',{name:'Lưu tệp .md',exact:true}).count()===1,'export dialog and download link keep their names');ok(large(await targets(page,'#exportDialog button,#exportLink')),'export actions have 48 CSS px targets');await page.locator('#exportDialog .close-dialog').tap();
  ok(await page.locator('button button,button input,button a,a button,summary button').count()===0,'shell contains no nested interactive controls');
  for(const density of [1,2,3]){
   const probe=await start(browser,{deviceScaleFactor:density});const bounds=await targets(probe,'main>header button:not(.mode-options button)');ok(large(bounds)&&await probe.evaluate(()=>visualViewport.scale===1),`CSS target bounds remain stable at browser device scale ${density}; dp is not inferred`);await probe.close();
  }
  ok(errors.length===0,'no page errors during P2B flows');console.log(`P2B ACCESSIBILITY: ${count} PASS`);
 }catch(error){await page.screenshot({path:path.join(qa,'failure.png')}).catch(()=>{});throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
