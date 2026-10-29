const {chooseSettingsSection}=require('./layout-helpers.cjs');
// Computed/rendered icon checks on local Chromium plus one explicit MessagePort simulation.
const {chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),url='https://markread.test/',nativeURL='https://appassets.androidplatform.net/app/index.html';let count=0;
const ok=(value,label)=>{assert.ok(value,label);count++;console.log('PASS '+label);};
const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),lum=s=>rgb(s).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.MARKREAD_CHROMIUM}),context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);
 const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8'),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const measurements=[];
 try{
  await page.route(url,r=>r.fulfill({contentType:'text/html',body:html.replace(/<meta name="native-channel"[^>]*>/,'')}));await page.addInitScript(()=>localStorage.setItem('markread-appearance-v1',JSON.stringify({mermaid:false})));
  await page.goto(url);await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-startup'));
  await page.locator('#filesInput').setInputFiles([{name:'A.md',mimeType:'text/markdown',buffer:Buffer.from('# A\n\nĐọc lâu, sửa rõ.\n')},{name:'B.md',mimeType:'text/markdown',buffer:Buffer.from('# B\n')}]);await page.waitForFunction(()=>document.getElementById('filename').textContent==='A.md');
  const ids=['dark','light','sepia','black','tokyo-night','tokyo-light','blue-gray','nord','dracula','rose-pine','forest','gruvbox'];
  for(const id of ids){
   await page.locator('#settings').click();await chooseSettingsSection(page,await page.locator('#settingsCategory').inputValue());await page.locator('#themes [data-theme='+id+']').click();await page.waitForFunction(x=>document.body.dataset.theme===x,id);
   const selected=await page.locator('#themes [data-theme='+id+']').evaluate(button=>{const svg=button.querySelector('svg'),style=getComputedStyle(svg);return {pressed:button.getAttribute('aria-pressed'),hidden:svg.getAttribute('aria-hidden'),color:style.color,bg:getComputedStyle(button).backgroundColor,opacity:getComputedStyle(svg.parentElement).opacity};});
   ok(selected.pressed==='true'&&selected.hidden==='true'&&selected.opacity==='1'&&contrast(selected.color,selected.bg)>=3,id+': selected check is visible, semantic and contrasted');
   await page.locator('#settingsDialog .close-dialog').click();
   const normal=await page.evaluate(()=>{const svg=document.querySelector('#findToggle svg'),disabled=document.querySelector('#prevFile svg'),primary=document.querySelector('#openMenu'),p=primary.querySelector('svg');return {color:getComputedStyle(svg).color,parent:getComputedStyle(svg.parentElement).color,bg:getComputedStyle(document.body).backgroundColor,disabled:getComputedStyle(disabled).color,disabledFlag:disabled.parentElement.disabled,primary:getComputedStyle(p).color,primaryBg:getComputedStyle(primary).backgroundColor,stroke:getComputedStyle(svg).strokeWidth};});
   ok(normal.color===normal.parent&&normal.stroke==='2px'&&normal.disabledFlag&&contrast(normal.color,normal.bg)>=3&&contrast(normal.disabled,normal.bg)>=3&&contrast(normal.primary,normal.primaryBg)>=3,id+': currentColor/default/primary/disabled use readable inherited theme colors');
   await page.keyboard.press('Tab');await page.locator('#findToggle').focus();const focus=await page.locator('#findToggle').evaluate(x=>({visible:x.matches(':focus-visible'),width:getComputedStyle(x).outlineWidth,color:getComputedStyle(x).outlineColor}));
   ok(focus.visible&&focus.width==='2px'&&contrast(focus.color,normal.bg)>=3,id+': keyboard focus remains distinct from icon/selection');
   const target=await page.locator('#nextFile').boundingBox();await page.mouse.move(target.x+24,target.y+24);await page.mouse.down();
   const pressed=await page.locator('#nextFile').evaluate(x=>{const svg=x.querySelector('svg'),r=svg.getBoundingClientRect();return {color:getComputedStyle(svg).color,bg:getComputedStyle(x).backgroundColor,x:r.x,y:r.y,width:r.width,height:r.height};});await page.mouse.move(380,600);await page.mouse.up();
   const released=await page.locator('#nextFile').evaluate(x=>{const r=x.querySelector('svg').getBoundingClientRect();return {bg:getComputedStyle(x).backgroundColor,x:r.x,y:r.y,width:r.width,height:r.height};});
   ok(contrast(pressed.color,pressed.bg)>=3&&pressed.bg!==released.bg&&['x','y','width','height'].every(k=>pressed[k]===released[k])&&await page.locator('#filename').textContent()==='A.md',id+': press/release keeps contrast, geometry and actual document state');
   measurements.push({theme:id,selected,normal,focus,pressed,released});
  }
  for(const [width,height] of [[320,568],[360,800],[390,844],[600,960],[844,390],[1280,800]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(60);
   const bounds=await page.locator('header .icon').evaluateAll(nodes=>nodes.filter(x=>x.getClientRects().length).map(x=>{const b=x.getBoundingClientRect(),s=x.querySelector('svg').getBoundingClientRect();return {id:x.id,x:b.x,y:b.y,w:b.width,h:b.height,sx:s.x,sy:s.y,sw:s.width,sh:s.height};}));
   ok(bounds.every(b=>b.w>=48&&b.h>=48&&b.sw===24&&b.sh===24&&Math.abs((b.x+b.w/2)-(b.sx+b.sw/2))<1&&Math.abs((b.y+b.h/2)-(b.sy+b.sh/2))<1),width+'x'+height+':24px glyphs are centered in actual48px controls');
   ok(bounds.every((a,i)=>bounds.slice(i+1).every(b=>Math.min(a.x+a.w,b.x+b.w)<=Math.max(a.x,b.x)||Math.min(a.y+a.h,b.y+b.h)<=Math.max(a.y,b.y)))&&await page.evaluate(()=>document.body.scrollWidth<=innerWidth),width+'x'+height+': no toolbar target overlap or body overflow');
  }
  const registry=JSON.parse(fs.readFileSync(path.join(root,'web/icons/manifest.json'),'utf8')).icons;
  const proof=Object.entries(registry).map(([name,x])=>({name,svg:fs.readFileSync(path.join(root,'web/icons',x.file),'utf8')}));
  const boxes=await page.evaluate(proof=>{const group=document.createElement('div');group.setAttribute('aria-hidden','true');group.style.cssText='position:absolute;left:-10000px;top:0';document.body.append(group);const boxes=proof.map(({name,svg})=>{const template=document.createElement('template');template.innerHTML=svg;const node=template.content.firstElementChild;group.append(node);const b=node.getBBox();return{name,width:b.width,height:b.height};});group.remove();return boxes;},proof);
  ok(boxes.length===23&&boxes.every(x=>x.width>0&&x.height>0),'all23 pinned SVGs render nonempty geometry in Chromium');
  ok(await page.locator('.mr-icon').evaluateAll(nodes=>nodes.every(x=>getComputedStyle(x).animationName==='none')),'icon system adds no spinner/keyframe animation under reduced motion');
  ok(await page.frameLocator('#reader').locator('.mr-icon').count()===0&&await page.locator('#editor').inputValue()==='# A\n\nĐọc lâu, sửa rõ.\n','icon presentation stays outside reader/source and preserves bytes');
  ok(errors.length===0,'no page errors during12-theme/responsive icon checks');
  const out=path.join(root,'test-results/ui-p2e');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'icon-measurements.json'),JSON.stringify({measurements,geometry:boxes},null,2));
  await context.close();
  const native=await browser.newContext({viewport:{width:390,height:844}}),p=await native.newPage();p.setDefaultTimeout(12000);p.on('pageerror',e=>errors.push(e.message));
  try{
   await p.route(nativeURL,r=>r.fulfill({contentType:'text/html',body:html}));
   await p.addInitScript(()=>{
    if(window!==top)return;const channel=new MessageChannel();window.renameOps=0;window.renameQuery=null;
    window.__finishRename=success=>{const q=renameQuery;renameQuery=null;channel.port1.postMessage(JSON.stringify(success?{id:q.id,result:{id:'a',name:q.args.name,path:q.args.name,size:20}}:{id:q.id,error:'Đổi tên cần quyền ghi. Chọn lại thư mục.'}));};
    channel.port1.onmessage=e=>{const q=JSON.parse(e.data);let result;if(q.op==='rename'){renameOps++;renameQuery=q;return;}
     if(q.op==='restore')result={count:1,folder:true,label:'Docs',generation:'g',activePath:'A.md',sessionToken:'s'};
     else if(q.op==='index')result={entries:[{id:'a',name:'A.md',path:'A.md',size:20,document:true}]};
     else if(q.op==='read')result={data:btoa('# Native\n\nText.\n'),eof:true};
     else if(q.op==='loadPreferences')result={mermaid:false};else result=true;
     channel.port1.postMessage(JSON.stringify({id:q.id,result}));};channel.port1.start();addEventListener('load',()=>postMessage('markread-native-init:__NATIVE_NONCE__',location.origin,[channel.port2]));
   });await p.goto(nativeURL);await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-startup')&&document.getElementById('filename').textContent==='A.md');
   await p.locator('#filename').dispatchEvent('contextmenu');await p.locator('#renameInput').fill('New.md');await p.evaluate(()=>window.__button=document.getElementById('renameSubmit'));await p.locator('#renameSubmit').click();await p.waitForFunction(()=>renameQuery!==null);
   ok(await p.locator('#renameForm').getAttribute('aria-busy')==='true'&&await p.locator('#renameSubmit').isDisabled()&&await p.locator('#renameSubmit svg').getAttribute('data-icon')==='loader-circle','simulated native rename busy uses static loader and actual disabled/busy state');
   ok(await p.locator('#renameSubmit .icon-label').textContent()==='Đang đổi tên…'&&await p.locator('#renameSubmit svg').evaluate(x=>getComputedStyle(x).animationName==='none'),'busy label remains meaningful without motion or duplicate accessible SVG name');
   await p.evaluate(()=>__finishRename(false));await p.waitForFunction(()=>document.getElementById('renameForm').getAttribute('aria-busy')==='false');
   ok(await p.evaluate(()=>__button===document.getElementById('renameSubmit')&&renameOps===1)&&await p.locator('#renameSubmit svg').getAttribute('data-icon')==='pencil'&&await p.locator('#renameSubmit').isEnabled(),'rename error restores glyph on the same button with one handler invocation');
   ok(await p.locator('#renameError').textContent()==='Đổi tên cần quyền ghi. Chọn lại thư mục.'&&await p.locator('#editor').inputValue()==='# Native\n\nText.\n','native error message/source are unchanged by icon update');
   await p.locator('#renameSubmit').click();await p.waitForFunction(()=>renameOps===2);await p.evaluate(()=>__finishRename(true));await p.waitForFunction(()=>document.getElementById('filename').textContent==='New.md');
   ok(await p.locator('#renameDialog').isHidden()&&await p.locator('#renameSubmit svg').getAttribute('data-icon')==='pencil'&&await p.locator('#editor').inputValue()==='# Native\n\nText.\n','rename retry retains original behavior and resets decorative state');
   ok(errors.length===0,'no errors in MessagePort icon busy/retry simulation');
  }finally{await native.close();}
  console.log(`P2E ICON STATES: ${count} PASS`);
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
