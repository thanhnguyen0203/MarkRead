const{chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{chooseSettingsSection,source}=require('./layout-helpers.cjs');const root=path.resolve(__dirname,'../..'),url='https://markread.test/';let count=0;
const ok=(value,label)=>{assert.ok(value,label);count++;console.log('PASS '+label);};
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.MARKREAD_CHROMIUM}),page=await browser.newPage({viewport:{width:393,height:852},reducedMotion:'reduce'});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(url,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8').replace(/<meta name="native-channel"[^>]*>/,'')}));await page.addInitScript(()=>localStorage.setItem('markread-appearance-v1',JSON.stringify({mermaid:false})));page.on('dialog',d=>d.accept());
 try{
  await page.goto(url);await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-startup'));await page.locator('#filesInput').setInputFiles({name:'Overflow.md',mimeType:'text/markdown',buffer:Buffer.from(source)});await page.frameLocator('#reader').locator('.katex-display').waitFor();
  for(const[width,height]of [[320,568],[393,852],[800,393],[1280,800]])for(const scale of [1,1.5,2]){
   await page.setViewportSize({width,height});await page.evaluate(x=>document.documentElement.style.fontSize=x+'%',scale*100);await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());
   const label=width+'x'+height+' @'+scale+'x';
   for(const section of ['appearance','typography','editing','css','general']){
    await chooseSettingsSection(page,section);
    const metrics=await page.evaluate(()=>{const d=document.getElementById('settingsDialog').getBoundingClientRect(),c=document.querySelector('.settings-content');return{x:d.x,y:d.y,right:d.right,bottom:d.bottom,cw:c.clientWidth,sw:c.scrollWidth,overflow:document.body.scrollWidth>innerWidth};});
    ok(metrics.x>=0&&metrics.y>=0&&metrics.right<=width+.1&&metrics.bottom<=height+.1&&metrics.sw<=metrics.cw+1&&!metrics.overflow,label+': '+section+' has no clipped/overflowing panel');
   }
   await chooseSettingsSection(page,'typography');await page.locator('#font').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('End');
   ok(await page.locator('[data-font=mono]').evaluate(x=>{const r=x.getBoundingClientRect(),p=x.parentElement.getBoundingClientRect();return document.activeElement===x&&r.right<=p.right+1&&r.left>=p.left-.1&&r.bottom<=p.bottom+1&&x.scrollWidth<=x.clientWidth+1;}),label+': font menu End remains fully visible and wrapped');await page.keyboard.press('Escape');
   await chooseSettingsSection(page,'general');await page.locator('#help').click();
   ok(await page.locator('#helpDialog').evaluate(x=>{const r=x.getBoundingClientRect(),head=x.querySelector('.dialog-head').getBoundingClientRect(),body=x.querySelector('.dialog-body').getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth+.1&&r.bottom<=innerHeight+.1&&body.bottom<=r.bottom+1&&head.bottom<=r.bottom&&x.scrollWidth<=x.clientWidth+1;}),label+': help header/body stay inside modal');await page.locator('#helpDialog .close-dialog').click();await page.locator('#settingsDialog .close-dialog').click();
   await page.locator('#findToggle').click();await page.locator('#findInput').fill('đọc');await page.waitForFunction(()=>document.getElementById('findCount').textContent.length>0);
   ok(await page.locator('#replaceInput').evaluate(x=>x.getBoundingClientRect().width>=120),label+': replacement field keeps a usable width');
   for(const id of ['replaceOne','replaceAll']){await page.locator('#'+id).scrollIntoViewIfNeeded();ok(await page.locator('#'+id).evaluate(x=>x.scrollWidth<=x.clientWidth+1&&x.getBoundingClientRect().height>=48),label+': '+id+' label/target is not clipped');}
   await page.locator('#findClose').click();
  }
  await page.evaluate(()=>document.documentElement.style.fontSize='');await page.setViewportSize({width:393,height:852});await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await chooseSettingsSection(page,'typography');await page.locator('#fontSize').focus();await page.keyboard.press('End');await page.waitForFunction(()=>document.getElementById('reader').contentDocument?.body&&getComputedStyle(document.getElementById('reader').contentDocument.body).fontSize==='32px');await page.locator('#settingsDialog .close-dialog').click();
  for(const width of [320,360,393,412,600,800]){
   await page.setViewportSize({width,height:900});
   const values=await page.frameLocator('#reader').locator('body').evaluate(x=>{const d=x.ownerDocument,get=selector=>{const e=d.querySelector(selector),s=getComputedStyle(e);return{w:e.clientWidth,sw:e.scrollWidth,overflow:s.overflowX,white:s.whiteSpace};};return{body:x.scrollWidth,view:d.documentElement.clientWidth,pre:get('pre'),table:get('.table-wrap'),math:get('.katex-display'),mathWhite:getComputedStyle(d.querySelector('.katex-html')).whiteSpace,breakAll:getComputedStyle(x).wordBreak==='break-all'};});
   ok(values.body<=values.view+1&&!values.breakAll,width+': max reader font has no document-wide horizontal overflow or break-all');
   ok(values.pre.sw>values.pre.w&&values.table.sw>values.table.w&&values.math.sw>values.math.w&&[values.pre,values.table,values.math].every(x=>x.overflow==='auto'||x.overflow==='scroll')&&values.mathWhite==='nowrap',width+': code/table/math scroll locally while math stays unbroken');
  }
  await page.locator('#modeToggle').click();await page.locator('#modeOptions [data-mode=edit]').click();const editor=page.locator('#editor');await editor.focus();await page.keyboard.press('Control+End');await page.keyboard.insertText('\nBản sửa Việt');const draft=await editor.inputValue();await editor.evaluate(x=>{window.overflowEditor=x;x.setSelectionRange(8,23);});await page.setViewportSize({width:600,height:350});await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  ok(await editor.evaluate(x=>x===window.overflowEditor&&document.activeElement===x&&x.selectionStart===8&&x.selectionEnd===23)&&await editor.inputValue()===draft,'scaling/reflow retains textarea node, focus, selection and draft');
  await page.keyboard.press('Control+z');ok(await editor.inputValue()===source,'native undo survives responsive/text reflow');await page.keyboard.press('Control+Shift+z');ok(await editor.inputValue()===draft,'native redo survives responsive/text reflow');
  await page.evaluate(()=>document.documentElement.style.fontSize='');await page.setViewportSize({width:393,height:852});
  const tree=path.join(root,'test-results/ui-p2f/tree'),nested=path.join(tree,'Thư-mục-có-tên-dài-không-có-khoảng-trắng','a','b','c','d');fs.mkdirSync(nested,{recursive:true});fs.writeFileSync(path.join(nested,'Tên-tệp-rất-dài-không-có-khoảng-trắng-để-kiểm-tra.md'),source);await page.locator('#folderInput').setInputFiles(tree);
  await page.locator('#menu').click();await page.locator('.folder-group>summary').first().waitFor();
  for(const summary of await page.locator('.folder-group>summary').all())if(!await summary.evaluate(x=>x.parentElement.open))await summary.click();
  for(const width of [320,393,800]){
   await page.setViewportSize({width,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='200%');
   ok(await page.locator('#files').evaluate(x=>x.scrollWidth<=x.clientWidth+1),width+': long nested paths reflow without horizontal file-browser overflow at200%');
   ok(await page.locator('.folder-group').evaluateAll(xs=>xs.length===5&&xs.every(x=>x.open)),width+': all five nested branches remain open after reflow');
   ok(await page.locator('.file-row').first().evaluate(x=>{const a=x.getBoundingClientRect(),b=x.closest('#files').getBoundingClientRect();return a.width>=120&&a.left>=b.left&&a.right<=b.right+1&&x.scrollWidth<=x.clientWidth+1;}),width+': deep file target remains readable and contained');
  }
  await page.locator('.file-row').first().click();ok(await page.locator('#editor').inputValue()===source,'deep file remains selectable with unchanged Markdown');
  ok(errors.length===0,'no overflow/scaling renderer errors');console.log(`P2F OVERFLOW: ${count} PASS`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
