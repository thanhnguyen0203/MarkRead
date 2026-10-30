// Browser root-text scaling is an explicit simulation, not Android fontScale/sp verification.
const{chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{chooseSettingsSection,source}=require('./layout-helpers.cjs');const root=path.resolve(__dirname,'../..'),url='https://markread.test/';let count=0;
const ok=(value,label)=>{assert.ok(value,label);count++;console.log('PASS '+label);};
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.MARKREAD_CHROMIUM}),page=await browser.newPage({viewport:{width:393,height:852},reducedMotion:'reduce'});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(url,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8').replace(/<meta name="native-channel"[^>]*>/,'')}));await page.addInitScript(()=>localStorage.setItem('markread-appearance-v1',JSON.stringify({mermaid:false})));
 const reader=()=>page.frameLocator('#reader');
 try{
  await page.goto(url);await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-startup'));await page.locator('#filesInput').setInputFiles({name:'Việt.md',mimeType:'text/markdown',buffer:Buffer.from(source)});await reader().getByRole('heading',{name:'Một không gian đọc',exact:true}).waitFor();
  ok(await page.locator('body').evaluate(x=>{const s=getComputedStyle(x);return s.fontSize==='16px'&&s.lineHeight==='24px'&&s.fontFamily.includes('system-ui')&&s.fontWeight==='400';}),'UI body uses system16/24 and regular weight');
  ok(await page.locator('#editor').evaluate(x=>{const s=getComputedStyle(x);return s.fontSize==='16px'&&s.lineHeight==='26px'&&s.fontFamily.includes('monospace');}),'full source uses16/26 monospace independently of reader preference');
  ok(await reader().locator('body').evaluate(x=>{const s=getComputedStyle(x);return s.fontSize==='18px'&&Math.abs(parseFloat(s.lineHeight)-32.4)<.1;}),'saved reader default18/1.8 remains intact');
  for(const[width,gutter]of [[320,20],[360,24],[393,24],[412,24],[600,24],[800,48]]){
   await page.setViewportSize({width,height:900});
   ok(await reader().locator('#paper').evaluate((x,p)=>getComputedStyle(x).paddingLeft===p+'px'&&getComputedStyle(x).paddingRight===p+'px',gutter),'reader gutters fit '+width+' CSS px');
  }
  await page.setViewportSize({width:393,height:852});
  ok(await reader().locator('h1').evaluate(x=>{const s=getComputedStyle(x);return Math.abs(parseFloat(s.fontSize)-32.4)<.1&&s.fontWeight==='600';}),'reader heading scale is relative and uses weight600');
  await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());
  ok(await page.locator('#settingsTitle').evaluate(x=>{const s=getComputedStyle(x);return s.fontSize==='22px'&&Math.abs(parseFloat(s.lineHeight)-28)<.1&&s.fontWeight==='600';}),'dialog title22/28 and weight600');
  ok(await page.locator('.settings-section:not([hidden]) h3').evaluate(x=>getComputedStyle(x).fontSize==='18px')&&await page.locator('.settings-section:not([hidden]) .hint').first().evaluate(x=>getComputedStyle(x).fontSize==='14px'),'section hierarchy18 and readable hint14');
  for(const id of ['dark','light','sepia','black','tokyo-night','tokyo-light','blue-gray','nord','dracula','rose-pine','forest','gruvbox']){
   await page.locator('#themes [data-theme='+id+']').click();
   ok(await page.locator('#themes [data-theme='+id+']').evaluate(x=>getComputedStyle(x).fontSize==='14px'&&getComputedStyle(x).lineHeight==='20px')&&await page.locator('#settingsTitle').evaluate(x=>getComputedStyle(x).fontSize==='22px'),'consistent UI type roles in '+id);
  }
  await chooseSettingsSection(page,'typography');
  for(const[id,family]of [['sans','Arial'],['serif','Georgia'],['merriweather','Merriweather'],['mono','Consolas']]){
   await page.locator('#font').click();await page.locator('[data-font='+id+']').click();await page.waitForFunction(f=>document.getElementById('reader').contentDocument?.body&&getComputedStyle(document.getElementById('reader').contentDocument.body).fontFamily.includes(f),family);
   ok(await page.locator('body').evaluate(x=>getComputedStyle(x).fontFamily.includes('system-ui'))&&await reader().locator('body').evaluate(x=>getComputedStyle(x).fontSize==='18px'),'reader '+id+' stays independent of UI family/size');
  }
  await page.locator('#fontSize').focus();await page.keyboard.press('End');await page.waitForFunction(()=>document.getElementById('reader').contentDocument?.body&&getComputedStyle(document.getElementById('reader').contentDocument.body).fontSize==='32px');
  ok(await page.locator('#fontSize').inputValue()==='32'&&await page.locator('body').evaluate(x=>getComputedStyle(x).fontSize==='16px'),'reader max size32 does not enlarge UI or change saved slider bounds');
  await page.keyboard.press('Home');for(let step=0;step<6;step++)await page.keyboard.press('ArrowRight');
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  ok(await page.locator('body').evaluate(x=>getComputedStyle(x).fontSize==='32px')&&await page.locator('#fontText').evaluate(x=>getComputedStyle(x).fontSize==='28px')&&await page.locator('#settingsTitle').evaluate(x=>getComputedStyle(x).fontSize==='44px'),'UI rem roles honor simulated200% root text scaling');
  ok(await page.locator('#settingsCategoryText').evaluate(x=>{const r=x.getBoundingClientRect(),p=x.parentElement.getBoundingClientRect();return r.left>=p.left&&r.right<=p.right&&r.bottom<=p.bottom;}),'native category mirrored value can wrap without cutting full text at200%');
  await page.waitForFunction(()=>document.getElementById('reader').contentDocument?.body&&getComputedStyle(document.getElementById('reader').contentDocument.body).fontSize==='18px');ok(true,'UI root-text scaling never multiplies the saved reader size');
  await page.evaluate(()=>document.documentElement.style.fontSize='');await chooseSettingsSection(page,'css');
  await page.locator('#customCSS').fill('#paper { padding: 7px; max-width: 100%; } h1 { font-size: 21px; } p { line-height: 2; }');await page.locator('#applyCSS').click();await page.waitForFunction(()=>document.getElementById('reader').contentDocument?.querySelector('h1')&&getComputedStyle(document.getElementById('reader').contentDocument.querySelector('h1')).fontSize==='21px');
  ok(await reader().locator('#paper').evaluate(x=>getComputedStyle(x).paddingLeft==='7px'&&getComputedStyle(x).maxWidth==='100%'),'custom CSS remains after base reader gutter/max-width styles');
  ok(await reader().locator('p').first().evaluate(x=>getComputedStyle(x).lineHeight==='36px'),'custom reader type overrides remain effective');
  await page.locator('#settingsDialog .close-dialog').click();ok(await page.locator('#editor').inputValue()===source,'typography and CSS changes preserve exact source');
  ok(errors.length===0,'no typography renderer errors');console.log(`P2F TYPOGRAPHY: ${count} PASS`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
