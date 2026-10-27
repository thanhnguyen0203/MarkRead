// Observe every animation frame during delayed Android startup, including stale WebView storage.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),url='https://appassets.androidplatform.net/app/index.html';
const source=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const saved={theme:'tokyo-light',font:'merriweather',size:24,width:1080,leading:2.1,css:'p{letter-spacing:0.2px}',mermaid:false,unified:true,descending:true};
let checks=0;
function ok(value,label){assert.ok(value,label);checks++;console.log('PASS '+label);}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.MARKREAD_CHROMIUM,headless:true});
 try{
 for(const scenario of [
  {name:'embedded native settings',embedded:true},
  {name:'older host fallback',embedded:false},
  {name:'malformed snapshot fallback',malformed:true},
  {name:'first install',fresh:true},
  {name:'expired session',expired:true,embedded:true},
  {name:'restore failure',restoreError:true,embedded:true},
  {name:'preferences failure',preferencesError:true}
 ]){
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[],ops=[];
  try{
   page.on('pageerror',e=>errors.push(e.message));
   const embedded=scenario.malformed?'%%%':scenario.embedded?Buffer.from(JSON.stringify(saved)).toString('base64'):'';
   const html=source.replaceAll('__NATIVE_NONCE__','startup-test').replaceAll('__NATIVE_APPEARANCE__',embedded).replaceAll('__STARTUP_BACKGROUND__',scenario.embedded?'#e1e2e7':'#202326');
   const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
   ok(html.includes("script-src 'sha256-"+crypto.createHash('sha256').update(script).digest('base64')+"'"),scenario.name+': native substitutions preserve the CSP hash');
   await page.route(url,r=>r.fulfill({contentType:'text/html; charset=utf-8',body:html}));
   await page.exposeFunction('__nativeRequest',async q=>{
    ops.push(q.op);
    switch(q.op){
     case 'loadPreferences':await pause(250);if(scenario.preferencesError)throw Error('Preferences unavailable');return scenario.fresh?null:saved;
     case 'savePreferences':case 'theme':case 'rememberDocument':return true;
     case 'restore':await pause(350);if(scenario.restoreError)throw Error('Folder unavailable');return {generation:'g',sessionToken:'s',label:'Docs',folder:true,count:scenario.fresh?0:1,activePath:scenario.fresh||scenario.expired?'':'Last.md'};
     case 'index':return {entries:[{id:'last',name:'Last.md',path:'Last.md',size:80,document:true}]};
     case 'read':await pause(300);return {data:Buffer.from('# Last document\n\nNội dung đã lưu.\n').toString('base64'),eof:true};
     default:throw Error('Unexpected operation '+q.op);
    }
   });
   await page.addInitScript(({fresh})=>{
    if(window!==window.top)return;
    if(!fresh)localStorage.setItem('markread-appearance-v1',JSON.stringify({theme:'dark',font:'mono',size:12}));
    window.__frames=[];window.__readerLoads=[];
    const sample=()=>{
     const app=document.getElementById('app'),frame=document.getElementById('reader');
     if(app&&getComputedStyle(app).visibility==='visible'){
      const d=frame.contentDocument,paper=d?.getElementById('paper');
      window.__frames.push({theme:document.body.dataset.theme,title:document.getElementById('filename').textContent,h1:paper?.querySelector('h1')?.textContent,size:paper&&getComputedStyle(paper).fontSize,font:paper&&getComputedStyle(paper).fontFamily,fonts:d?.fonts.status,busy:app.hasAttribute('aria-busy')});
     }
     requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
    window.addEventListener('DOMContentLoaded',()=>document.getElementById('reader').addEventListener('load',()=>window.__readerLoads.push(document.getElementById('reader').contentDocument?.querySelector('h1')?.textContent)));
    const channel=new MessageChannel();channel.port1.onmessage=async e=>{const q=JSON.parse(e.data);try{channel.port1.postMessage(JSON.stringify({id:q.id,result:await window.__nativeRequest(q)}));}catch(e){channel.port1.postMessage(JSON.stringify({id:q.id,error:e.message}));}};channel.port1.start();
    window.addEventListener('load',()=>setTimeout(()=>window.postMessage('markread-native-init:startup-test',location.origin,[channel.port2]),200));
   },{fresh:scenario.fresh});
   await page.goto(url);
   ok(await page.locator('#app').evaluate(el=>getComputedStyle(el).visibility==='hidden'),scenario.name+': shell stays hidden while the native host is delayed');
   if(scenario.embedded)ok(await page.locator('html').evaluate(el=>getComputedStyle(el).backgroundColor)==='rgb(225, 226, 231)',scenario.name+': loading background already matches the saved theme');
   await page.waitForFunction(()=>window.__frames.length>=3);
   const frames=await page.evaluate(()=>window.__frames),first=frames[0];
   const expectedTheme=scenario.fresh||scenario.preferencesError?'dark':'tokyo-light';
   ok(frames.every(f=>f.theme===expectedTheme&&!f.busy&&f.h1),scenario.name+': every visible frame has the final theme and a rendered document');
   const restored=!scenario.fresh&&!scenario.expired&&!scenario.restoreError&&!scenario.preferencesError;
   ok(frames.every(f=>f.title===(restored?'Last.md':'Chào mừng.md')),scenario.name+': no intermediate welcome document or filename');
   if(expectedTheme==='tokyo-light')ok(first.size==='24px'&&first.font.includes('Merriweather')&&first.fonts==='loaded',scenario.name+': the first visible frame has the saved typography and loaded font');
   if(scenario.embedded)ok(!ops.includes('loadPreferences'),scenario.name+': embedded settings avoid an extra preference round trip');
   const loads=await page.evaluate(()=>window.__readerLoads.filter(Boolean));
   ok(loads.length===1,scenario.name+': renders the initial document once');
   ok(errors.length===0,scenario.name+': no renderer errors: '+errors.join('; '));
  }finally{await context.close();}
 }
 console.log('Startup UI:',checks,'checks passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
