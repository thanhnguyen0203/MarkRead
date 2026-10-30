// Chromium CSS viewport checks; shrinking a viewport is not an Android IME/device test.
const{chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{chooseSettingsSection,source}=require('./layout-helpers.cjs');const root=path.resolve(__dirname,'../..'),url='https://markread.test/';let count=0;
const ok=(value,label)=>{assert.ok(value,label);count++;console.log('PASS '+label);};
const matrix=[[320,568],[360,800],[393,852],[412,915],[600,960],[800,1280],[568,320],[800,360],[852,393],[915,412],[960,600],[1280,800]];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.MARKREAD_CHROMIUM}),page=await browser.newPage({viewport:{width:393,height:852},reducedMotion:'reduce'});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8').replace(/<meta name="native-channel"[^>]*>/,'');await page.route(url,r=>r.fulfill({contentType:'text/html',body:html}));await page.addInitScript(()=>localStorage.setItem('markread-appearance-v1',JSON.stringify({mermaid:false})));
 const filename='Một tên tài liệu tiếng Việt rất dài '+ 'thử_'.repeat(18)+'.md',measurements=[];
 try{
  await page.goto(url);await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-startup'));await page.locator('#filesInput').setInputFiles({name:filename,mimeType:'text/markdown',buffer:Buffer.from(source)});await page.waitForFunction(x=>document.getElementById('filename').textContent===x,filename);
  for(const[width,height]of matrix){
   await page.setViewportSize({width,height});await page.waitForTimeout(40);
   const header=await page.evaluate(()=>{const h=document.querySelector('header').getBoundingClientRect();const buttons=[...document.querySelectorAll('header button:not(#filename)')].filter(x=>x.getClientRects().length).map(x=>{const b=x.getBoundingClientRect();return{id:x.id,x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom};});return{height:h.height,buttons,overflow:document.body.scrollWidth>innerWidth,readerTop:document.getElementById('readerPane').getBoundingClientRect().top,bottom:h.bottom};});
   ok(!header.overflow&&header.buttons.every(x=>x.w>=48&&x.h>=48&&x.x>=0&&x.right<=width+.1)&&header.readerTop>=header.bottom-.1,width+'x'+height+': toolbar targets and reader clearance fit');
   ok(header.height===56&&header.buttons.every((a,i)=>header.buttons.slice(i+1).every(b=>a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y)),width+'x'+height+': one compact row, no overlap');
   const fixed=await page.locator('#sidebar').evaluate(x=>getComputedStyle(x).position!=='fixed');ok(fixed===(width>=1024),width+'x'+height+': drawer/fixed mode is width-owned');
   await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());
   for(const section of ['appearance','typography','editing','css','general']){
    await chooseSettingsSection(page,section);
    ok(await page.evaluate(id=>{const d=document.getElementById('settingsDialog').getBoundingClientRect(),c=document.querySelector('.settings-content');return d.x>=0&&d.y>=0&&d.right<=innerWidth+.1&&d.bottom<=innerHeight+.1&&c.scrollWidth<=c.clientWidth+1&&document.querySelectorAll('.settings-section:not([hidden])').length===1&&document.getElementById('section-'+id).hidden===false&&document.getElementById('settingsCategory').value===id;},section),width+'x'+height+': Settings '+section+' visible, synchronized and contained');
   }
   ok(await page.locator('#settingsCategory').getAttribute('aria-label')==='Nhóm cài đặt'&&await page.locator('#settingsCategory option').count()===5,'native category selector retains five full accessible names at '+width);
   await page.locator('#settingsDialog .close-dialog').click();measurements.push({width,height,header});
  }
  await page.setViewportSize({width:800,height:900});await page.locator('#menu').click();await page.locator('#fileFilter').fill('Một tên');await page.locator('#fileFilter').focus();const active=await page.locator('#fileFilter').evaluate(x=>x.selectionStart);await page.setViewportSize({width:800,height:350});
  ok(await page.locator('#menu').getAttribute('aria-expanded')==='true'&&await page.locator('#fileFilter').evaluate((x,at)=>document.activeElement===x&&x.selectionStart===at,active),'height-only shrink preserves drawer, filter focus and caret');
  await page.setViewportSize({width:800,height:900});ok(await page.locator('#menu').getAttribute('aria-expanded')==='true'&&await page.locator('#filename').textContent()===filename,'height restoration does not close drawer or switch current file');await page.locator('#closeSidebar').click();
  await require('./layout-helpers.cjs').selectDocumentMode(page,'edit');const editor=page.locator('#editor');await editor.fill(source+'\nBản sửa chưa xuất.\n');await editor.evaluate(x=>{window.responsiveEditor=x;x.setSelectionRange(12,27);x.scrollTop=20;});
  await page.setViewportSize({width:600,height:400});ok(await editor.evaluate(x=>x===window.responsiveEditor&&document.activeElement===x&&x.selectionStart===12&&x.selectionEnd===27)&&await editor.inputValue()===source+'\nBản sửa chưa xuất.\n','responsive reflow preserves source node, selection, focus and draft');
  await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await chooseSettingsSection(page,'css');await page.locator('#customCSS').fill('p { color: red; }');await page.locator('#customCSS').evaluate(x=>{window.responsiveCSS=x;x.setSelectionRange(2,8);});await page.setViewportSize({width:600,height:300});
  ok(await page.locator('#customCSS').evaluate(x=>x===window.responsiveCSS&&document.activeElement===x&&x.selectionStart===2&&x.selectionEnd===8)&&await page.locator('#customCSS').inputValue()==='p { color: red; }','short viewport keeps Settings text input and selection');
  await page.locator('#settingsDialog .close-dialog').click();ok(await page.locator('#dirty').isVisible()&&await editor.inputValue()===source+'\nBản sửa chưa xuất.\n','Settings reflow leaves unsaved document state intact');
  ok(errors.length===0,'no responsive renderer errors');const out=path.join(root,'test-results/ui-p2f');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'responsive-measurements.json'),JSON.stringify(measurements,null,2));console.log(`P2F RESPONSIVE: ${count} PASS`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
