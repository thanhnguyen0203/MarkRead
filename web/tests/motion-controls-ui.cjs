const {chooseSettingsSection}=require('./layout-helpers.cjs');
const{chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8'),url='https://markread.test/';let count=0;
const ok=(value,name)=>{assert.ok(value,name);count++;console.log('PASS '+name);};
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.MARKREAD_CHROMIUM}),p=await b.newPage({viewport:{width:393,height:852},hasTouch:true});p.setDefaultTimeout(15000);const errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 await p.route(url,r=>r.fulfill({contentType:'text/html',body:html.replace(/<meta name="native-channel"[^>]*>/,'')}));await p.addInitScript(()=>localStorage.setItem('markread-appearance-v1',JSON.stringify({mermaid:false})));await p.goto(url);await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-startup'));
 ok(await p.locator('html').evaluate(x=>getComputedStyle(x).getPropertyValue('--mr-motion-press').trim()==='80ms'&&getComputedStyle(x).getPropertyValue('--mr-motion-drawer').trim()==='240ms'),'control/drawer tokens are available');
 for(const theme of ['dark','light','sepia','black','tokyo-night','tokyo-light','blue-gray','nord','dracula','rose-pine','forest','gruvbox']){
  await p.locator('#settings').click();await chooseSettingsSection(p,await p.locator('#settingsCategory').inputValue());await p.locator('#themes [data-theme='+theme+']').click();await p.locator('#settingsDialog .close-dialog').click();await p.waitForTimeout(180);
  const field=p.locator('#filename'),box=await field.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+24);await p.mouse.down();await p.waitForTimeout(110);
  ok(await field.evaluate(x=>x.matches(':active')&&getComputedStyle(x).backgroundColor!== 'rgba(0, 0, 0, 0)'),theme+': pointer press has visible tint');
  const name=await field.textContent();await p.mouse.up();await p.waitForTimeout(160);ok(!await field.evaluate(x=>x.matches(':active'))&&await field.textContent()===name,theme+': release clears press without changing document');
  await field.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');ok(await field.evaluate(x=>{const s=getComputedStyle(x);return s.outlineWidth==='2px'&&!s.transitionProperty.includes('outline');}),theme+': keyboard focus ring is immediate and independent of tint');
 }
 const field=p.locator('#filename'),box=await field.boundingBox(),cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+20,y:box.y+20}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await p.waitForTimeout(180);ok(!await field.evaluate(x=>x.matches(':active')),'real browser touchCancel clears native active state');
 ok(await p.locator('#prevFile').evaluate(x=>x.disabled&&getComputedStyle(x).transitionDuration==='0s'),'disabled control has no press animation');
 await require('./layout-helpers.cjs').selectDocumentMode(p,'edit');const editor=p.locator('#editor');await editor.fill('Bản sửa tiếng Việt\n');await editor.evaluate(x=>{x.setSelectionRange(3,8);window.controlEditor=x;});await p.emulateMedia({reducedMotion:'reduce'});
 ok(await editor.evaluate(x=>x===window.controlEditor&&document.activeElement===x&&x.selectionStart===3&&x.selectionEnd===8)&&await editor.inputValue()==='Bản sửa tiếng Việt\n','reduced-motion change preserves textarea/caret/selection/draft');
 ok(await field.evaluate(x=>getComputedStyle(x).transitionDuration==='0s')&&await p.evaluate(()=>document.getAnimations().length===0),'reduced motion disables all active control transitions');
 for(const preference of ['reduce','no-preference']){
  const q=await b.newPage({reducedMotion:preference});await q.route('https://appassets.androidplatform.net/app/index.html',r=>r.fulfill({contentType:'text/html',body:html.replaceAll('__NATIVE_NONCE__','motion-pending')}));await q.goto('https://appassets.androidplatform.net/app/index.html');await q.waitForTimeout(150);
  ok(await q.locator('#startupStatus').evaluate(x=>getComputedStyle(x).visibility==='hidden'),preference+': delayed startup status does not appear early');await q.waitForFunction(()=>getComputedStyle(document.getElementById('startupStatus')).visibility==='visible');ok(await q.locator('#startupStatus').evaluate(x=>getComputedStyle(x).animationName==='none')&&await q.locator('#app').evaluate(x=>getComputedStyle(x).visibility==='hidden'),preference+': delayed status remains visible without a startup keyframe');await q.close();
 }
 ok(errors.length===0,'no control-motion renderer errors');console.log(`P2G MOTION CONTROLS: ${count} PASS`);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
