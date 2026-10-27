import {IS_ANDROID,nativeReady,nativeCall,nativeSnapshot,nativeExport} from './native.js';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import xml from 'highlight.js/lib/languages/xml';
import {MAX_DOC,MAX_IMAGE,MAX_FILES,MARKDOWN,IMAGE,escapeHTML,localTarget,cleanCSS,decodeText,imageType,slugify,diagramAllowed} from './core.js';
import {themes} from './themes.js';
import {fileTree,orderedPaths,adjacentPath,mappedBlocks,replaceBlock,editableBlockEnd,renamedDocumentPath} from './workspace.js';
import demo from './demo.md';
import searchWorkerCode from 'inline-search-worker';
import paperCSS from './paper.css';
import katexCSS from 'inline-katex-css';
import fontCSS from 'inline-merriweather-css';
for (const [name,lang] of Object.entries({python,javascript,json,sql,css,bash,xml})) hljs.registerLanguage(name,lang);
const $ = id => document.getElementById(id);
const DEFAULTS={theme:'dark',font:'sans',size:18,width:860,leading:1.8,css:'',mermaid:true,remember:false,unified:false,descending:false};
const STORAGE_KEY='markread-appearance-v1';
let settings={...DEFAULTS};
try {
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  if(saved?.remember) {
    settings.theme=Object.hasOwn(themes,saved.theme)?saved.theme:'dark';
    settings.font=['sans','serif','merriweather','mono'].includes(saved.font)?saved.font:'sans';
    for(const [key,lo,hi] of [['size',12,32],['width',480,1400],['leading',1.2,2.4]]) if(Number.isFinite(saved[key])) settings[key]=Math.max(lo,Math.min(hi,saved[key]));
    settings.css=typeof saved.css==='string'?cleanCSS(saved.css):'';
    settings.mermaid=saved.mermaid!==false; settings.unified=saved.unified===true; settings.descending=saved.descending===true; settings.remember=true;
  }
} catch { /* Storage can be unavailable for local files; run in memory. */ }
const palettes=Object.fromEntries(Object.entries(themes).map(([id,t])=>[id,t.palette]));
for(const [id,t] of Object.entries(themes)){
  const b=document.createElement('button');b.dataset.theme=id;
  for(const key of ['bg','text','accent','line'])b.style.setProperty('--preview-'+key,t.palette[key]);
  const label=document.createElement('span');label.textContent=t.name;
  const check=document.createElement('span');check.className='theme-check';check.textContent='✓';check.setAttribute('aria-hidden','true');
  b.append(label,check);$('themes').append(b);
}

let files=new Map(), drafts=new Map(), originals=new Map(), current='',source=demo,mode='read',session=0,renderSerial=0,openSerial=0;
let imageURLs=new Map(), toastTimer, renderTimer, loadTarget='',renderQueue=Promise.resolve();
let editOriginal=demo;
let inlineEdit=null,readerSnapshot={text:null,path:null};const collapsedFolders=new Set();
const blockMarkup=new WeakMap();
const documentBar=document.querySelector('main>header'),main=documentBar.parentElement;
let barOffset=0,barFrame=0,scrollIntentUntil=0;
function paintDocumentBar(){
  barFrame=0;const height=documentBar.offsetHeight;
  barOffset=Math.max(0,Math.min(height,barOffset));
  main.style.setProperty('--header-offset',barOffset+'px');
  main.style.setProperty('--header-opacity',String(1-barOffset/height));
  documentBar.inert=barOffset>=height;
}
function showDocumentBar(){barOffset=0;scrollIntentUntil=0;cancelAnimationFrame(barFrame);paintDocumentBar();}
function trackReadingScroll(scroller,doc){
  let previous=scroller.scrollTop,viewport=main.clientHeight,direction=0,touchY=0;
  const intent=e=>{scrollIntentUntil=performance.now()+250;if(e.type==='wheel')direction=Math.sign(e.deltaY);if(e.type==='touchmove'){const y=e.touches[0]?.clientY??touchY;direction=Math.sign(touchY-y);touchY=y;}};
  doc.addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY||0;},{passive:true});
  for(const name of ['wheel','touchmove'])doc.addEventListener(name,intent,{passive:true});
  doc.addEventListener('keydown',e=>{if(!e.target.closest('input,textarea')&&['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)){direction=['ArrowUp','PageUp','Home'].includes(e.key)||e.key===' '&&e.shiftKey?-1:1;intent(e);}});
  doc.addEventListener('pointerdown',e=>{if(e.clientX>=doc.documentElement.clientWidth-16){direction=0;intent(e);}},{passive:true});
  const update=()=>{
    const top=Math.max(0,Math.min(scroller.scrollTop,scroller.scrollHeight-scroller.clientHeight)),delta=top-previous;
    const resized=viewport!==main.clientHeight;previous=top;viewport=main.clientHeight;
    if(resized||delta*direction<0||performance.now()>scrollIntentUntil||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if(doc.querySelector('dialog[open]')||document.body.classList.contains('sidebar-open')||!$('modeOptions').hidden)return;
    if(top<=0)barOffset=0;
    else if(delta<0)barOffset+=delta;
    else if(top>72)barOffset+=Math.min(delta,top-72);
    if(!barFrame)barFrame=requestAnimationFrame(paintDocumentBar);
  };
  (scroller===doc.scrollingElement?doc:scroller).addEventListener('scroll',update,{passive:true});
}
documentBar.addEventListener('focusin',showDocumentBar);
trackReadingScroll($('editor'),document);
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4500);}
function status(message){ /* Persistent status bar removed; failures use toast. */ }
function dirty(){return source!==editOriginal;}
function hasDrafts(){return dirty()||[...drafts].some(([p,s])=>s!==originals.get(p));}
function updateDirty(){ $('dirty').textContent=dirty()?'●':''; }
function stats(){const words=(source.match(/\S+/g)||[]).length;$('stats').textContent=`${words.toLocaleString('vi')} từ · ${Math.max(1,Math.ceil(words/220))} phút đọc`;updateDirty();}
function persist(){try{if(settings.remember)localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));else localStorage.removeItem(STORAGE_KEY);}catch{toast('Không lưu được giao diện; phiên này vẫn dùng bình thường.');}}
function uiSettings(){
  document.body.dataset.theme=settings.theme;
  for(const [key,value] of Object.entries(palettes[settings.theme]))document.body.style.setProperty('--'+key,value);
  document.body.style.colorScheme=themes[settings.theme].light?'light':'dark';
  document.body.classList.toggle('unified',settings.unified);
  $('modeMenu').hidden=settings.unified;
  if(settings.unified)setModeMenu(false);
  $('unifiedEnabled').checked=settings.unified;
  for(const b of $('themes').querySelectorAll('button')){b.classList.toggle('active',b.dataset.theme===settings.theme);b.setAttribute('aria-pressed',String(b.dataset.theme===settings.theme));}
  $('fontText').textContent=document.querySelector('[data-font="'+settings.font+'"] span').textContent;for(const b of document.querySelectorAll('[data-font]'))b.setAttribute('aria-selected',String(b.dataset.font===settings.font));$('fontSize').value=settings.size;$('width').value=settings.width;$('lineHeight').value=settings.leading;
  $('fontValue').textContent=`${settings.size} px`;$('widthValue').textContent=`${settings.width} px`;$('lineValue').textContent=settings.leading.toFixed(1);
  $('mermaidEnabled').checked=settings.mermaid;$('remember').checked=settings.remember;
}
const markdown=new Marked({gfm:true,breaks:false});
let mathCount=0;
function mathHTML(tex,display){
  mathCount++;
  if(tex.length>3000||mathCount>600)return `<code class="math-error">${escapeHTML(tex.slice(0,3000))}</code>`;
  try{return katex.renderToString(tex,{displayMode:display,throwOnError:false,trust:false,strict:'ignore',maxExpand:500,maxSize:20,output:'htmlAndMathml',macros:{}});}
  catch{return `<code class="math-error">${escapeHTML(tex)}</code>`;}
}
// Math stays inert until after raw Markdown HTML has been sanitized.
let mathTokens=[];
markdown.use({extensions:[
  {name:'mathBlock',level:'block',start:s=>{const n=s.search(/(?:\$\$|\\\[)/);return n<0?undefined:n;},tokenizer(s){const m=/^(?:\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\])(?:\n|$)/.exec(s);if(m)return {type:'mathBlock',raw:m[0],text:m[1]??m[2]};},renderer(t){const n=mathTokens.push({text:t.text,display:true})-1;return `<div data-math-token="${n}"></div>`;}},
  {name:'mathInline',level:'inline',start:s=>{const n=s.search(/\$(?!\$)|\\\(/);return n<0?undefined:n;},tokenizer(s){const m=/^(?:\$([^$\n]+?)\$(?!\$)|\\\(([\s\S]+?)\\\))/.exec(s);if(m)return {type:'mathInline',raw:m[0],text:m[1]??m[2]};},renderer(t){const n=mathTokens.push({text:t.text,display:false})-1;return `<span data-math-token="${n}"></span>`;}}
]});
function saveCurrent(){if(current)drafts.set(current,source);}
function isDocument(path){return MARKDOWN.test(path)||files.get(path)?.document===true;}
function allPaths(){return orderedPaths(fileTree([...files.keys()].filter(isDocument),settings.descending));}
function updateNavigation(){const paths=allPaths();for(const [id,delta,label] of [['prevFile',-1,'Tệp trước'],['nextFile',1,'Tệp sau']]){const path=adjacentPath(paths,current,delta);$(id).disabled=!path;$(id).title=path?`${label}: ${path}`:label;}}
function renderFileList(){
  const q=$('fileFilter').value.toLocaleLowerCase('vi');const fragment=document.createDocumentFragment();
  const paths=[...files.keys()].filter(p=>isDocument(p)&&p.toLocaleLowerCase('vi').includes(q));
  const append=(nodes,parent)=>{for(const node of nodes){if(node.directory){const group=document.createElement('details');group.className='folder-group';group.open=!!q||!collapsedFolders.has(node.path);const title=document.createElement('summary');title.textContent=node.name;title.title=node.path;group.append(title);group.addEventListener('toggle',()=>{if(group.open)collapsedFolders.delete(node.path);else collapsedFolders.add(node.path);});append(node.children,group);parent.append(group);continue;}
    const path=node.path,b=document.createElement('button');b.className='file-row'+(current===path?' active':'');b.role='listitem';b.setAttribute('aria-label',path);if(current===path)b.setAttribute('aria-current','page');
    const icon=document.createElement('span');icon.className='file-icon';icon.textContent=(/\.([^.]+)$/.exec(node.name)?.[1]||'TXT').slice(0,5).toUpperCase();const label=document.createElement('span');label.className='file-label';label.textContent=node.name.replace(/\.(md|markdown)$/i,'');b.title=path;b.append(icon,label);b.addEventListener('click',()=>openFile(path));bindRenameHold(b,()=>path);parent.append(b);
  }};
  append(fileTree(paths,settings.descending),fragment);
  if(!paths.length){const e=document.createElement('div');e.className='empty-files';e.textContent=files.size?'Không tìm thấy tệp Markdown phù hợp.':'Tài liệu của bạn sẽ ở đây. Chọn thư mục hoặc các tệp để bắt đầu.';fragment.append(e);}
  $('files').replaceChildren(fragment);$('sortOrder').setAttribute('aria-pressed',String(settings.descending));$('sortOrder').title=settings.descending?'Tên giảm dần · bấm để tăng dần':'Tên tăng dần · bấm để giảm dần';updateNavigation();
}
async function moveFile(delta){const path=adjacentPath(allPaths(),current,delta);if(path)await openFile(path);}

// Long presses ignore scrolling and suppress the subsequent synthetic click.
function bindRenameHold(element,pathForElement){
  let timer,start,suppressUntil=0;
  const stop=()=>{clearTimeout(timer);timer=null;start=null;};
  element.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;stop();start={x:e.clientX,y:e.clientY};
    timer=setTimeout(()=>{stop();suppressUntil=Date.now()+800;showRename(pathForElement());},550);
  });
  element.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)stop();});
  for(const name of ['pointerup','pointercancel','pointerleave','lostpointercapture'])element.addEventListener(name,stop);
  element.addEventListener('click',e=>{if(Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  element.addEventListener('contextmenu',e=>{e.preventDefault();stop();if(Date.now()>=suppressUntil){suppressUntil=Date.now()+800;showRename(pathForElement());}});
  element.addEventListener('keydown',e=>{if(e.key==='F2'){e.preventDefault();showRename(pathForElement());}});
}
let renameTarget=null,renameBusy=false;
function showRename(path){
  if(renameBusy||$('renameDialog').open)return;
  const file=files.get(path);if(!file)return;
  finishInline();const name=path.split('/').pop();
  renameTarget={path,file,epoch:session};$('renameInput').value=name;
  $('renameError').textContent='';
  $('renameDialog').showModal();$('renameInput').focus();$('renameInput').setSelectionRange(0,name.lastIndexOf('.')>0?name.lastIndexOf('.'):name.length);
}
function moveMapKey(map,oldPath,newPath){if(map.has(oldPath)){const value=map.get(oldPath);map.delete(oldPath);map.set(newPath,value);}}
bindRenameHold($('filename'),()=>current);
$('renameCancel').addEventListener('click',()=>$('renameDialog').close());
$('renameDialog').addEventListener('cancel',e=>{if(renameBusy)e.preventDefault();});
$('renameDialog').addEventListener('close',()=>{if(!renameBusy)renameTarget=null;});
$('renameForm').addEventListener('submit',async e=>{
  e.preventDefault();if(renameBusy||!renameTarget)return;
  const target=renameTarget;
  try{
    if(target.epoch!==session||files.get(target.path)!==target.file)throw new Error('Bộ tệp đã thay đổi. Hãy chọn lại tệp.');
    const proposedPath=renamedDocumentPath(target.path,$('renameInput').value);
    if(proposedPath===target.path){$('renameDialog').close();return;}
    const duplicate=[...files.keys()].some(p=>p!==target.path&&(p.normalize('NFC').toLocaleLowerCase('vi')===proposedPath.toLocaleLowerCase('vi')||p.normalize('NFC').toLocaleLowerCase('vi').startsWith(proposedPath.toLocaleLowerCase('vi')+'/')));
    if(duplicate)throw new Error('Đã có tệp cùng tên trong thư mục. Hãy chọn tên khác.');
    renameBusy=true;
    for(const el of $('renameDialog').querySelectorAll('button,input'))el.disabled=true;
    $('renameError').textContent='';$('renameSubmit').textContent='Đang đổi tên…';
    let nextPath=proposedPath,nextFile;
    if(IS_ANDROID){
      const meta=await nativeCall('rename',{fileId:target.file.id,name:proposedPath.split('/').pop()});
      nextPath=meta.path;Object.assign(target.file,{name:meta.name,path:meta.path,size:meta.size,document:true});
      if(target.file.webkitRelativePath)target.file.webkitRelativePath=target.file.webkitRelativePath.split('/')[0]+'/'+meta.path;
      nextFile=target.file;
    }else nextFile={document:true,name:nextPath.split('/').pop(),size:target.file.size,webkitRelativePath:target.file.webkitRelativePath?target.file.webkitRelativePath.split('/')[0]+'/'+nextPath:'',arrayBuffer:()=>target.file.arrayBuffer()};
    if(target.epoch!==session||files.get(target.path)!==target.file)return;
    saveCurrent();openSerial++;files.delete(target.path);files.set(nextPath,nextFile);
    moveMapKey(drafts,target.path,nextPath);moveMapKey(originals,target.path,nextPath);
    if(current===target.path){current=nextPath;$('filename').textContent=nextFile.name;$('filename').title=nextPath+' · Ấn giữ để đổi tên';$('filename').setAttribute('aria-label',nextFile.name+' · Ấn giữ để đổi tên');scheduleRender();}
    renderFileList();$('renameDialog').close();toast('Đã đổi tên thành '+nextFile.name+'.');
  }catch(error){$('renameError').textContent=error.message||'Không đổi được tên tệp.';}
  finally{renameBusy=false;for(const el of $('renameDialog').querySelectorAll('button,input'))el.disabled=false;$('renameSubmit').textContent='Đổi tên';if(!$('renameDialog').open)renameTarget=null;}
});

function setOpenMenu(open){$('openOptions').hidden=!open;$('openMenu').setAttribute('aria-expanded',String(open));}
$('openMenu').addEventListener('click',()=>setOpenMenu($('openOptions').hidden));
document.addEventListener('click',e=>{if(!e.target.closest('.library-actions'))setOpenMenu(false);});
$('openMenu').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();setOpenMenu(true);$('openFolder').focus();}});
$('openOptions').addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();(document.activeElement===$('openFolder')?$('openFiles'):$('openFolder')).focus();}if(e.key==='Escape'){setOpenMenu(false);$('openMenu').focus();}});

function revokeImages(){for(const url of imageURLs.values())URL.revokeObjectURL(url);imageURLs.clear();}
async function importFiles(list, folder, confirmed=false){
  const incoming=[...list];if(!incoming.length&&!confirmed)return;
  if(incoming.length>MAX_FILES){toast(`Chỉ nhận tối đa ${MAX_FILES} tệp mỗi lần. Hãy chọn thư mục nhỏ hơn.`);return;}
  if(!confirmed&&hasDrafts()&&!confirm('Có bản sửa chưa tải xuống. Bỏ bản sửa và thay bộ tệp?'))return;
  finishInline(false,false);collapsedFolders.clear();invalidateFind();session++;openSerial++;renderSerial++;revokeImages();files.clear();drafts.clear();originals.clear();current='';source=demo;editOriginal=demo;$('editor').value=source;$('filename').title='';$('fileFilter').value='';loadTarget='';
  let root='';
  for(const file of incoming){let path=file.webkitRelativePath||file.name;if(folder&&file.webkitRelativePath){root=path.split('/')[0];path=path.split('/').slice(1).join('/');}
    if(!path||path.split('/').some(x=>x==='..'||x==='.')||/[\x00-\x1f\\]/.test(path))continue;
    if(file.document===true||MARKDOWN.test(path)||IMAGE.test(path)||/\.css$/i.test(path)){if(!files.has(path))files.set(path,file);}
  }
  $('folderName').textContent=root||'CÁC TỆP ĐÃ CHỌN';$('folderName').title=root||'Không giữ quyền sau khi đóng trang';renderFileList();
  const docs=allPaths();
  if(docs.length)await openFile(docs[0]);else{ $('filename').textContent='Chào mừng.md';stats();scheduleRender();toast('Bộ tệp chưa có .md hoặc .markdown.'); }
  status(`${docs.length} tài liệu · chỉ bộ tệp đã chọn`);
}
async function openFile(path,fragment=''){
  finishInline();
  const file=files.get(path);if(!file||!isDocument(path)){toast('Tệp Markdown chưa được cấp quyền trong bộ tệp này.');return;}
  if(file.size>MAX_DOC){toast('Tệp vượt quá giới hạn 5 MiB. Hãy chia nhỏ tài liệu.');return;}
  const ticket=++openSerial,epoch=session;
  try{
    const text=drafts.has(path)?drafts.get(path):decodeText(await file.arrayBuffer());
    if(ticket!==openSerial||epoch!==session)return;
    saveCurrent();if(!originals.has(path))originals.set(path,text);current=path;source=text;editOriginal=originals.get(path);$('editor').value=text;$('filename').textContent=path.split('/').pop();$('filename').title=path+' · Ấn giữ để đổi tên';$('filename').setAttribute('aria-label',path.split('/').pop()+' · Ấn giữ để đổi tên');
    const parts=path.split('/');for(let i=1;i<parts.length;i++)collapsedFolders.delete(parts.slice(0,i).join('/'));
    loadTarget=fragment;showDocumentBar();invalidateFind();$('findInput').value='';$('findCount').textContent='';document.body.classList.remove('sidebar-open');stats();renderFileList();scheduleRender();
  }catch(e){if(ticket===openSerial)toast(e.message||'Không đọc được tệp. Hãy chọn lại quyền truy cập.');}
}
async function localImage(raw,base,epoch){
  const target=localTarget(raw,base);if(!target||!IMAGE.test(target.path))return null;const file=files.get(target.path);
  if(!file||file.size>MAX_IMAGE)return null;if(imageURLs.has(target.path))return imageURLs.get(target.path);
  const bytes=await file.arrayBuffer();if(epoch!==session)return null;const mime=imageType(bytes);if(!mime)return null;
  const url=URL.createObjectURL(new Blob([bytes],{type:mime}));imageURLs.set(target.path,url);return url;
}
function safeHTML(text){
  mathTokens=[];mathCount=0;
  const root=document.createElement('div'),trustedBlocks=[];
  const tokens=markdown.lexer(text);
  const blocks=mappedBlocks(text,tokens);
  for(const block of blocks){const list=block.tokens;list.links=tokens.links;
  const raw=markdown.parser(list);
  const fragment=DOMPurify.sanitize(raw,{
    RETURN_DOM_FRAGMENT:true,
    ALLOWED_TAGS:['p','br','hr','h1','h2','h3','h4','h5','h6','strong','em','del','s','ul','ol','li','blockquote','pre','code','a','img','table','thead','tbody','tr','th','td','caption','sup','sub','kbd','samp','details','summary','input','div','span','figure','figcaption','dl','dt','dd','abbr'],
    ALLOWED_ATTR:['href','src','alt','title','class','align','colspan','rowspan','start','reversed','type','checked','disabled','open','data-math-token'],
    ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false,SANITIZE_NAMED_PROPS:true
  });
  const wrap=document.createElement('div');wrap.append(fragment);root.append(wrap);trustedBlocks.push({wrap,...block});
  }
  // Never let untrusted attributes survive into a live document.
  for(const input of root.querySelectorAll('input')){if(input.type!=='checkbox'){input.remove();continue;}input.disabled=true;input.removeAttribute('name');}
  for(const el of root.querySelectorAll('[class]')){if(el.tagName!=='CODE')el.removeAttribute('class');else el.className=[...el.classList].filter(s=>/^language-[\w+-]+$/.test(s)).join(' ');}
  for(const a of root.querySelectorAll('a')){const target=a.getAttribute('href')||'';a.removeAttribute('href');a.dataset.target=target;a.setAttribute('role','link');a.tabIndex=0;}
  const images=[];for(const img of root.querySelectorAll('img')){images.push({node:img,raw:img.getAttribute('src')||''});img.removeAttribute('src');img.removeAttribute('srcset');}
  for(const n of root.querySelectorAll('[data-math-token]')){const token=mathTokens[Number(n.getAttribute('data-math-token'))];n.removeAttribute('data-math-token');if(token)n.innerHTML=mathHTML(token.text,token.display);}
  const headings=[],counts=new Map();for(const h of root.querySelectorAll('h1,h2,h3,h4,h5,h6')){const slug=slugify(h.textContent),count=(counts.get(slug)||0)+1;counts.set(slug,count);h.id=slug+(count>1?'-'+count:'');headings.push({id:h.id,text:h.textContent,level:Number(h.tagName[1])});}
  for(const table of root.querySelectorAll('table')){const wrap=document.createElement('div');wrap.className='table-wrap';table.replaceWith(wrap);wrap.append(table);}
  let diagramOrder=0;for(const code of root.querySelectorAll('pre > code'))if(/(?:^|\s)language-mermaid(?:\s|$)/i.test(code.className))code.dataset.diagramOrder=++diagramOrder;
  for(const {wrap,start,end} of trustedBlocks){wrap.className='md-block';wrap.dataset.start=start;wrap.dataset.end=editableBlockEnd(text,start,end);blockMarkup.set(wrap,wrap.innerHTML);}
  return {root,images,headings};
}
let diagramSerial=0;
async function diagrams(root,ticket){
  let count=0;
  for(const code of root.querySelectorAll('pre > code')){
    const lang=(code.className.match(/language-([\w+-]+)/)||[])[1]||'';
    if(lang.toLowerCase()==='mermaid'){
      count=Number(code.dataset.diagramOrder)||count+1;const src=code.textContent;
      if(!settings.mermaid)continue;
      if(count>8||!diagramAllowed(src)){const p=document.createElement('p');p.className='diagram-error';p.textContent='Sơ đồ vượt giới hạn hoặc chứa cấu hình/cú pháp không được hỗ trợ an toàn. Giữ mã nguồn bên dưới.';code.parentElement.before(p);continue;}
      let holder;
      try{
        globalThis.mermaid.initialize({startOnLoad:false,securityLevel:'strict',suppressErrorRendering:true,theme:themes[settings.theme].light?'neutral':'dark',fontFamily:'Arial, sans-serif',maxTextSize:12000,maxEdges:200,flowchart:{htmlLabels:false,useMaxWidth:true},sequence:{useMaxWidth:true},secure:['securityLevel','startOnLoad','maxTextSize','maxEdges','secure','theme','fontFamily','flowchart']});
        holder=document.createElement('div');holder.style.cssText='position:fixed;left:-20000px;top:0;width:900px;visibility:hidden';document.body.append(holder);
        const {svg}=await globalThis.mermaid.render('mrdiagram'+(++diagramSerial),src,holder);
        if(ticket!==null&&ticket!==renderSerial)return;
        const sanitized=DOMPurify.sanitize(svg,{USE_PROFILES:{svg:true,svgFilters:true},FORBID_TAGS:['foreignObject','a','image','feImage','script','animate','animateMotion','set'],FORBID_ATTR:['href','xlink:href','onload'],ALLOW_DATA_ATTR:false});
        const wrap=document.createElement('div');wrap.className='diagram';wrap.innerHTML=sanitized;
        for(const el of wrap.querySelectorAll('*'))for(const attr of [...el.attributes])if(/(?:https?:|data:|javascript:|file:)/i.test(attr.value))el.removeAttribute(attr.name);
        code.parentElement.replaceWith(wrap);
      }catch{const p=document.createElement('p');p.className='diagram-error';p.textContent='Không dựng được sơ đồ. Kiểm tra cú pháp Mermaid; mã nguồn được giữ bên dưới.';code.parentElement.before(p);}
      finally{holder?.remove();}
    }else if(lang&&hljs.getLanguage(lang)&&code.textContent.length<100000){try{code.innerHTML=hljs.highlight(code.textContent,{language:lang,ignoreIllegals:true}).value;}catch{}}
  }
}
function readerStyle(){const p=palettes[settings.theme];const fonts={sans:'-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif',serif:'Georgia,"Times New Roman",serif',merriweather:'"Merriweather",Georgia,serif',mono:'Consolas,"SFMono-Regular",monospace'};return `:root{${Object.entries(p).map(([k,v])=>`--${k}:${v}`).join(';')};--font:${fonts[settings.font]};--size:${settings.size}px;--width:${settings.width}px;--leading:${settings.leading}}`+fontCSS+paperCSS+katexCSS;}
const READER_CSP="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src blob:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; media-src 'none'; worker-src 'none'";
function scheduleRender(delay=0){clearTimeout(renderTimer);const ticket=++renderSerial;renderTimer=setTimeout(()=>{renderQueue=renderQueue.catch(()=>{}).then(()=>render(ticket));},delay);}
function updateOutline(headings){
  const toc=document.createDocumentFragment();for(const h of headings.filter(x=>x.level<=3)){const a=document.createElement('a');a.textContent=h.text;a.href='#'+h.id;a.dataset.level=h.level;a.addEventListener('click',e=>{e.preventDefault();$('reader').contentDocument?.getElementById(h.id)?.scrollIntoView();});toc.append(a);}$('toc').replaceChildren(toc);
}
async function render(ticket){
  if(ticket!==renderSerial)return;
  const text=source,base=current,epoch=session;
  status('Đang dựng tài liệu trên thiết bị…');
  try{
    const {root,images,headings}=safeHTML(text);
    for(const {node,raw} of images){let url;try{url=await localImage(raw,base,epoch);}catch{}if(ticket!==renderSerial)return;if(url){node.src=url;node.loading='lazy';node.decoding='async';}else{const msg=document.createElement('span');msg.className='blocked-image';msg.textContent=`Ảnh chưa được cấp quyền hoặc bị chặn: ${node.alt||raw.slice(0,120)||'ảnh'}`;node.replaceWith(msg);}}
    await diagrams(root,ticket);if(ticket!==renderSerial)return;
    const frame=$('reader');const oldScroll=frame.contentDocument?.scrollingElement?.scrollTop||0;const sameDoc=frame.dataset.path===(base||'demo');
    frame.onload=()=>{
      if(ticket!==renderSerial)return;
      const d=frame.contentDocument;if(!d)return;readerSnapshot={text,path:base};
      d.addEventListener('click',readerClick);d.addEventListener('pointerdown',e=>{if(inlineEdit&&e.target.closest('.md-block')&&!e.target.closest('a,summary,button,input,.inline-editor'))e.preventDefault();});d.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest('a'))readerClick(e);keyboard(e);});
      if(loadTarget){d.getElementById(loadTarget)?.scrollIntoView();loadTarget='';}else if(sameDoc)d.defaultView.scrollTo({top:oldScroll,behavior:'instant'});
      const rendered=[...d.querySelectorAll('#paper>.md-block')];[...root.children].forEach((node,i)=>blockMarkup.set(rendered[i],blockMarkup.get(node)));
      trackReadingScroll(d.scrollingElement,d);
      d.body.classList.toggle('unified-reader',settings.unified);
      if(settings.unified){const add=d.createElement('button');add.className='add-block';add.textContent='＋ Thêm đoạn';add.addEventListener('click',()=>beginInline(null));d.getElementById('paper').append(add);}
      applyFind({scroll:false});status(current?'Đã mở · chỉ đọc bộ tệp được chọn':'Tài liệu mẫu · chưa truy cập tệp của bạn');
    };
    frame.dataset.path=base||'demo';
    const style=(readerStyle()+settings.css).replace(/<\/style/gi,'<\\/style');
    frame.srcdoc=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="${escapeHTML(READER_CSP)}"><style>${style}</style></head><body><article id="paper">${root.innerHTML}</article></body></html>`;
    updateOutline(headings);
  }catch(e){if(ticket===renderSerial){status('Không dựng được bài. Có thể xem trong thẻ Nguồn.');toast('Lỗi hiển thị: '+(e.message||'không xác định'));}}
}
function syncInline(){
  if(!inlineEdit)return;
  const state=inlineEdit;
  try{const next=replaceBlock(source,state.start,state.end,state.input.value,MAX_DOC),delta=next.end-state.end;
    if(delta){for(const block of state.host.parentElement.querySelectorAll(':scope>.md-block'))if(block!==state.host&&Number(block.dataset.start)>=state.end){block.dataset.start=Number(block.dataset.start)+delta;block.dataset.end=Number(block.dataset.end)+delta;}}
    source=next.text;state.end=next.end;state.host.dataset.end=state.end;$('editor').value=source;saveCurrent();stats();}
  catch(e){state.input.value=source.slice(state.start,state.end);toast(e.message);}
}
function readingAnchor(d,preferred){
  const blocks=[...d.querySelectorAll('#paper>.md-block')];
  const node=preferred||blocks.find(b=>b.getBoundingClientRect().top>=0&&b.getBoundingClientRect().height>0)||blocks.find(b=>b.getBoundingClientRect().bottom>0);
  return {node,start:node?Number(node.dataset.start):null,top:node?.getBoundingClientRect().top||0,scroll:d.scrollingElement.scrollTop};
}
function restoreReadingAnchor(d,anchor){
  const node=[...d.querySelectorAll('#paper>.md-block')].find(b=>Number(b.dataset.start)===anchor.start);
  scrollIntentUntil=0;
  d.defaultView.scrollTo({top:node?d.scrollingElement.scrollTop+node.getBoundingClientRect().top-anchor.top:anchor.scroll,behavior:'instant'});
}
function refreshInline(state,anchor){
  const d=state.input.ownerDocument,paper=d.getElementById('paper');
  if(state.original===source.slice(state.start,state.end)){
    state.host.classList.remove('editing-block');state.host.style.height='';state.host.replaceChildren(...state.originalNodes);
    readerSnapshot={text:source,path:current};restoreReadingAnchor(d,anchor);return;
  }
  const {root,images,headings}=safeHTML(source);
  const old=[...paper.querySelectorAll(':scope>.md-block')],bySpan=new Map(old.map(b=>[b.dataset.start+':'+b.dataset.end,b]));
  for(const node of [...root.children]){const previous=bySpan.get(node.dataset.start+':'+node.dataset.end);if(previous&&previous!==state.host&&blockMarkup.get(previous)===blockMarkup.get(node))node.replaceWith(previous);}
  for(const node of old)if(node.parentElement===paper)node.remove();
  const before=state.box.isConnected?state.box:paper.querySelector('.add-block');
  for(const node of [...root.children])paper.insertBefore(node,before);
  readerSnapshot={text:source,path:current};updateOutline(headings);restoreReadingAnchor(d,anchor);
  const epoch=session,base=current;
  // Decorate new nodes without navigating the iframe or disturbing its focused editor.
  renderQueue=renderQueue.catch(()=>{}).then(async()=>{
    for(const {node,raw} of images){if(!node.isConnected||$('reader').contentDocument!==d)continue;let url;try{url=await localImage(raw,base,epoch);}catch{}if(epoch!==session||!node.isConnected||$('reader').contentDocument!==d)continue;if(url){node.src=url;node.loading='lazy';node.decoding='async';}else{const msg=d.createElement('span');msg.className='blocked-image';msg.textContent=`Ảnh chưa được cấp quyền hoặc bị chặn: ${node.alt||raw.slice(0,120)||'ảnh'}`;node.replaceWith(msg);}}
    if(epoch===session&&$('reader').contentDocument===d)await diagrams(paper,null);
  });
}
function finishInline(cancel=false,rerender=true,keepEditor=false,preferred=null){
  if(!inlineEdit)return;
  syncInline();const state=inlineEdit,d=state.input.ownerDocument,anchor=readingAnchor(d,preferred);
  if(cancel){state.input.value=state.original;syncInline();if(anchor.node)anchor.start=Number(anchor.node.dataset.start);}
  inlineEdit=null;state.observer.disconnect();d.defaultView.removeEventListener('resize',resizeInline);
  if(!keepEditor){state.input.blur();state.box.remove();}
  if(rerender){clearTimeout(renderTimer);renderSerial++;refreshInline(state,anchor);applyFind({scroll:false});}
  else{readerSnapshot={text:null,path:null};state.host.classList.remove('editing-block');state.host.style.height='';state.host.replaceChildren(...state.originalNodes);}
  return keepEditor?state.box:null;
}
function resizeInline(){
  if(!inlineEdit)return;
  const {host,box,input}=inlineEdit;
  box.style.left=host.offsetLeft+'px';box.style.top=host.offsetTop+'px';box.style.width=host.clientWidth+'px';
  input.style.height='0px';input.style.height=input.scrollHeight+'px';
  host.style.height=(box.offsetHeight+parseFloat(input.ownerDocument.defaultView.getComputedStyle(box).marginBottom))+'px';
}
function beginInline(block,box=null,caret=0){
  if(!settings.unified)return;
  if(inlineEdit){
    const start=block?Number(block.dataset.start):null;box=finishInline(false,true,true,block);
    if(start!==null){block=[...$('reader').contentDocument.querySelectorAll('.md-block')].find(b=>Number(b.dataset.start)<=start&&Number(b.dataset.end)>start);if(!block){box?.remove();return;}caret+=start-Number(block.dataset.start);}
  }
  if(readerSnapshot.text!==source||readerSnapshot.path!==current){scheduleRender();return;}
  clearTimeout(renderTimer);renderSerial++;
  const d=$('reader').contentDocument;
  if(!d)return;
  const start=block?Number(block.dataset.start):source.length,end=block?Number(block.dataset.end):source.length;
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>source.length)return;
  const original=source.slice(start,end),host=block||d.createElement('div');
  if(!block){host.className='md-block';host.dataset.start=start;host.dataset.end=end;d.querySelector('.add-block').before(host);}
  const anchor=readingAnchor(d,host),originalNodes=[...host.childNodes];
  if(!box){box=d.createElement('div');box.className='inline-editor';const input=d.createElement('textarea');input.className='block-source';input.rows=1;input.spellcheck=false;input.setAttribute('aria-label','Mã nguồn khối Markdown');box.append(input);d.getElementById('paper').append(box);
    input.addEventListener('input',()=>{syncInline();resizeInline();});
    input.addEventListener('keydown',e=>{if(e.key==='Escape'||((e.ctrlKey||e.metaKey)&&e.key==='Enter')){e.preventDefault();e.stopPropagation();finishInline(e.key==='Escape');}if(e.key==='Tab'){e.preventDefault();input.setRangeText('  ',input.selectionStart,input.selectionEnd,'end');syncInline();resizeInline();}});
  }
  const input=box.firstElementChild;input.value=original||(!block&&source&&!source.endsWith('\n\n')?'\n\n':'');
  const observer=new ResizeObserver(resizeInline);inlineEdit={start,end,original,input,box,host,originalNodes,observer};
  host.replaceChildren();host.classList.add('editing-block');syncInline();resizeInline();observer.observe(d.getElementById('paper'));d.defaultView.addEventListener('resize',resizeInline);
  input.focus({preventScroll:true});input.setSelectionRange(caret,caret);restoreReadingAnchor(d,anchor);
}
// A tap outside the active source returns to rendered text. Scrolling does not commit.
document.addEventListener('pointerdown',e=>{if(inlineEdit&&e.target!==$('reader'))finishInline();},true);
function inlineCaret(block,e){
  if(!e.clientX&&!e.clientY)return 0;
  const d=block.ownerDocument,range=d.caretRangeFromPoint?.(e.clientX,e.clientY);
  if(!range||range.startContainer.nodeType!==3||!block.contains(range.startContainer))return 0;
  const text=source.slice(Number(block.dataset.start),Number(block.dataset.end)),at=text.indexOf(range.startContainer.textContent);
  return at<0?0:Math.min(text.length,at+range.startOffset);
}
function readerClick(e){
  setModeMenu(false);if(e.target.closest('.inline-editor,.add-block'))return;
  const a=e.target.closest('a[data-target]');
  if(!a){
    const block=e.target.closest('.md-block');
    if(block&&settings.unified&&mode==='read'&&!e.target.closest('summary,button,input')&&!e.target.ownerDocument.getSelection()?.toString())beginInline(block,null,inlineCaret(block,e));
    else if(inlineEdit)finishInline();
    return;
  }
  e.preventDefault();const raw=a.dataset.target;if(raw.startsWith('#')){try{$('reader').contentDocument.getElementById(decodeURIComponent(raw.slice(1)))?.scrollIntoView();}catch{}return;}const target=localTarget(raw,current);if(target&&files.has(target.path)&&isDocument(target.path)){openFile(target.path,target.fragment);}else toast('Liên kết bị chặn: chỉ mở tệp Markdown trong bộ tệp đã chọn.');
}
function setMode(value){finishInline(false,false);if(settings.unified)value='read';mode=value;$('workspace').dataset.mode=value;for(const name of ['read','edit','split']){$(name+'Mode').classList.toggle('active',value===name);$(name+'Mode').setAttribute('aria-pressed',String(value===name));}for(const b of $('modeOptions').querySelectorAll('[data-mode]'))b.setAttribute('aria-checked',String(value===b.dataset.mode));if(value==='edit')$('editor').focus();}
function setModeMenu(open){$('modeOptions').hidden=!open;$('modeToggle').setAttribute('aria-expanded',String(open));}
$('modeToggle').addEventListener('click',()=>setModeMenu($('modeOptions').hidden));
$('modeToggle').addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();setModeMenu(true);($('modeOptions').querySelector('[aria-checked=true]')||$('modeOptions').querySelector('button')).focus();}});
$('modeOptions').addEventListener('keydown',e=>{const options=[...$('modeOptions').querySelectorAll('button')],at=options.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();options[e.key==='Home'?0:e.key==='End'?options.length-1:(at+(e.key==='ArrowDown'?1:-1)+options.length)%options.length].focus();}if(e.key==='Tab')setModeMenu(false);});
for(const b of $('modeOptions').querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{setModeMenu(false);setMode(b.dataset.mode);if(mode==='read')$('modeToggle').focus();});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#modeMenu'))setModeMenu(false);},true);
let exportURL='';
let saving=false;
async function download(){
  finishInline();
  if(IS_ANDROID){
    if(saving){toast('Đang chuẩn bị bản lưu.');return;}
    saving=true;status('Đang chuẩn bị bản Markdown…');
    try{const result=await nativeExport(current.split('/').pop()||'Tai_lieu.md',source);toast(result.cancelled?'Đã hủy lưu.':'Đã lưu bản Markdown vào vị trí bạn chọn.');}
    catch(e){toast(e.message||'Không lưu được tệp. Bản sửa vẫn ở trong bộ nhớ.');}
    finally{saving=false;status('Sẵn sàng · không có quyền Internet');}
    return;
  }
  if(exportURL)URL.revokeObjectURL(exportURL);
  exportURL=URL.createObjectURL(new Blob([source],{type:'text/markdown;charset=utf-8'}));
  $('exportLink').href=exportURL;$('exportLink').download=(current.split('/').pop()||'Chao_mung.md').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_');
  $('exportText').value=source;$('exportFeedback').textContent='';$('exportDialog').showModal();
}
$('copyExport').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('exportText').value);$('exportFeedback').textContent='Đã sao chép nội dung.';}catch{$('exportText').focus();$('exportText').select();$('exportFeedback').textContent='Đã chọn toàn bộ. Dùng lệnh Sao chép của trình duyệt.';}});
$('exportLink').addEventListener('click',()=>{$('exportFeedback').textContent='Đã yêu cầu tải bản sao. Kiểm tra thư mục tải xuống trước khi đóng trang.';});
$('exportDialog').addEventListener('close',()=>{if(exportURL)URL.revokeObjectURL(exportURL);exportURL='';$('exportText').value='';$('exportLink').removeAttribute('href');});

async function clearFiles(){finishInline();if(hasDrafts()&&!confirm('Có bản sửa chưa tải xuống. Gỡ tệp và bỏ các bản sửa?'))return; if(IS_ANDROID){try{await nativeCall('forget');}catch(e){toast(e.message);return;}}session++;openSerial++;renderSerial++;revokeImages();files.clear();drafts.clear();originals.clear();current='';source=demo;editOriginal=demo;loadTarget='';$('editor').value=demo;$('filename').textContent='Chào mừng.md';$('filename').title='';$('folderName').textContent='CHƯA CẤP QUYỀN THƯ MỤC';$('folderName').title='';$('fileFilter').value='';$('findInput').value='';renderFileList();stats();scheduleRender();toast('Đã gỡ bộ tệp và bản sửa khỏi phiên làm việc.');}
// Search runs on source offsets; replacement never edits rendered HTML.
let findMatches=[],findIndex=-1,findText='',findKey='',findLimited=false,findTicket=0,activeSearch=null,findTimer,replaceBusy=false;
function searchArgs(){return {text:source,query:$('findInput').value,caseSensitive:$('findCase').getAttribute('aria-pressed')==='true',regex:$('findRegex').getAttribute('aria-pressed')==='true',maxBytes:MAX_DOC};}
function searchKey(){return JSON.stringify([$('findInput').value,$('findCase').getAttribute('aria-pressed'),$('findRegex').getAttribute('aria-pressed')]);}
function cancelSearch(){if(activeSearch){activeSearch.cancel();activeSearch=null;}}
function workerSearch(args){
  cancelSearch();
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(new Blob([searchWorkerCode],{type:'text/javascript'}));let worker,timer;
    const finish=(error,value)=>{clearTimeout(timer);worker?.terminate();URL.revokeObjectURL(url);if(activeSearch?.worker===worker)activeSearch=null;error?reject(error):resolve(value);};
    try{worker=new Worker(url);}catch{finish(new Error('Không khởi động được tìm kiếm. Hãy mở lại ứng dụng.'));return;}
    activeSearch={worker,cancel:()=>finish(new Error('search-cancelled'))};
    timer=setTimeout(()=>finish(new Error('Regex xử lý quá lâu. Hãy dùng biểu thức đơn giản hơn.')),2500);
    worker.onmessage=e=>finish(e.data.error?new Error(e.data.error):null,e.data.result);
    worker.onerror=e=>{e.preventDefault();finish(new Error('Không xử lý được tìm kiếm.'));};
    worker.postMessage(args);
  });
}
function clearFindMarks(){const d=$('reader').contentDocument;if(!d)return;for(const m of d.querySelectorAll('mark[data-search]'))m.replaceWith(d.createTextNode(m.textContent));for(const b of d.querySelectorAll('.search-block-current'))b.classList.remove('search-block-current');d.getElementById('paper')?.normalize();}
function findControls(){const ready=!replaceBusy&&findText===source&&findKey===searchKey()&&findMatches.length>0;for(const id of ['findPrev','findNext','replaceOne'])$(id).disabled=!ready;$('replaceAll').disabled=!ready||findLimited;}
function showFind(scroll=true){
  clearFindMarks();findControls();
  if(!findMatches.length){$('findCount').textContent=$('findInput').value?'0 kết quả':'';return;}
  $('findCount').textContent=`${findIndex+1}/${findMatches.length}${findLimited?'+':''}`;
  const hit=findMatches[findIndex],d=$('reader').contentDocument;
  if(!hit)return;
  const editor=$('editor');editor.setSelectionRange(hit.start,hit.end);
  if(mode==='edit'||mode==='split'){if(scroll){const line=source.slice(0,hit.start).split('\n').length-1;editor.scrollTop=Math.max(0,line*parseFloat(getComputedStyle(editor).lineHeight)-editor.clientHeight/2);}if(mode==='edit')return;}
  if(!d||readerSnapshot.text!==source||readerSnapshot.path!==current)return;
  const block=[...d.querySelectorAll('.md-block')].find(b=>Number(b.dataset.start)<=hit.start&&Number(b.dataset.end)>=hit.end);
  if(!block)return;
  const needle=source.slice(hit.start,hit.end);let marked=false;
  if(needle){const walker=d.createTreeWalker(block,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('script,style,svg,math,.katex,button,textarea')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);const flat=nodes.map(n=>n.nodeValue).join('');let occurrence=0,rawAt=Number(block.dataset.start);while((rawAt=source.indexOf(needle,rawAt))>=0&&rawAt<=hit.start){occurrence++;rawAt+=needle.length;}let at=-1;while(occurrence-->0){at=flat.indexOf(needle,at+1);if(at<0)break;}if(at>=0){let pos=0;for(const node of nodes){const end=pos+node.length;if(end>at&&pos<at+needle.length){const a=Math.max(0,at-pos),b=Math.min(node.length,at+needle.length-pos);const f=d.createDocumentFragment();f.append(d.createTextNode(node.nodeValue.slice(0,a)));const m=d.createElement('mark');m.dataset.search='1';m.className='current';m.textContent=node.nodeValue.slice(a,b);f.append(m,d.createTextNode(node.nodeValue.slice(b)));node.replaceWith(f);marked=true;}pos=end;}}}
  if(!marked)block.classList.add('search-block-current');
  if(scroll)(block.querySelector('mark[data-search]')||block).scrollIntoView({block:'center',behavior:'instant'});
}
async function applyFind({offset=null,scroll=true}={}){
  if(inlineEdit||replaceBusy||$('findbar').hidden)return;
  const text=source,key=searchKey();
  if(findText===text&&findKey===key){showFind(scroll);return;}
  const ticket=++findTicket;findControls();$('findError').textContent='';
  try{const result=await workerSearch(searchArgs());if(ticket!==findTicket||text!==source||key!==searchKey()||$('findbar').hidden)return;
    findText=text;findKey=key;findMatches=result.matches;findLimited=result.limited;
    findIndex=offset===null?0:findMatches.findIndex(m=>m.start>=offset);if(findIndex<0)findIndex=0;
    showFind(scroll);
  }catch(error){if(ticket!==findTicket||error.message==='search-cancelled')return;findMatches=[];findIndex=-1;findKey='';$('findCount').textContent='';$('findError').textContent=error.message;clearFindMarks();findControls();}
}
function invalidateFind(){++findTicket;cancelSearch();clearTimeout(findTimer);findControls();findTimer=setTimeout(()=>applyFind({scroll:false}),140);}
function moveFind(delta){if(!findMatches.length||findText!==source||findKey!==searchKey())return;findIndex=(findIndex+delta+findMatches.length)%findMatches.length;showFind();}
async function replaceFind(all=false){
  if(replaceBusy||findText!==source||findKey!==searchKey()||!findMatches.length)return;
  finishInline(false,false);const text=source,key=searchKey(),epoch=session,path=current;const ticket=++findTicket;
  replaceBusy=true;findControls();$('findError').textContent='';
  try{
    const result=await workerSearch({...searchArgs(),action:all?'replaceAll':'replace',replacement:$('replaceInput').value,index:findIndex});
    if(ticket!==findTicket||text!==source||key!==searchKey()||epoch!==session||path!==current)return;
    source=result.text;$('editor').value=source;saveCurrent();stats();findText='';findKey='';
    replaceBusy=false;scheduleRender();await applyFind({offset:all?0:result.nextOffset+(result.zeroLength?1:0)});
    toast(all?`Đã thay ${result.count} kết quả.`:'Đã thay 1 kết quả.');
  }catch(error){if(ticket===findTicket&&error.message!=='search-cancelled')$('findError').textContent=error.message;}
  finally{replaceBusy=false;findControls();}
}
function toggleFind(show){
  if(show)finishInline();$('findbar').hidden=!show;$('findToggle').setAttribute('aria-expanded',String(show));
  if(show){applyFind();$('findInput').focus();}else{++findTicket;cancelSearch();clearTimeout(findTimer);clearFindMarks();}
}
function keyboard(e){if((e.ctrlKey||e.metaKey)&&!e.altKey){const key=e.key.toLowerCase();if(key==='s'){e.preventDefault();download();}if(key==='o'){e.preventDefault();if(IS_ANDROID)chooseNative(false);else $('filesInput').click();}if(key==='f'||key==='h'){e.preventDefault();toggleFind(true);if(key==='h')$('replaceInput').focus();}}if(e.key==='Escape'){if(!$('modeOptions').hidden){e.preventDefault();setModeMenu(false);$('modeToggle').focus();return;}if(!$('fontOptions').hidden){e.preventDefault();setFontMenu(false);$('font').focus();return;}if(!$('openOptions').hidden){e.preventDefault();setOpenMenu(false);$('openMenu').focus();return;}setFontMenu(false);if(inlineEdit){e.preventDefault();finishInline();return;}toggleFind(false);document.body.classList.remove('sidebar-open');}}
function setFontMenu(open){$('fontOptions').hidden=!open;$('font').setAttribute('aria-expanded',String(open));}
$('font').addEventListener('click',()=>setFontMenu($('fontOptions').hidden));
$('font').addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();setFontMenu(true);document.querySelector('[data-font="'+settings.font+'"]').focus();}});
$('fontOptions').addEventListener('keydown',e=>{const options=[...$('fontOptions').querySelectorAll('button')],at=options.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const i=e.key==='Home'?0:e.key==='End'?options.length-1:(at+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options[i].focus();}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setFontMenu(false);$('font').focus();}});
for(const b of document.querySelectorAll('[data-font]'))b.addEventListener('click',()=>{settings.font=b.dataset.font;setFontMenu(false);settingsChange();$('font').focus();});
document.addEventListener('click',e=>{if(!e.target.closest('.font-setting'))setFontMenu(false);});
function settingsChange(){finishInline(false,false);uiSettings();persist();scheduleRender(80);if(IS_ANDROID)nativeCall('theme',{theme:settings.theme}).catch(()=>{});}
async function chooseNative(folder){
  if(hasDrafts()&&!confirm('Có bản sửa chưa lưu. Bỏ bản sửa và thay bộ tệp?'))return;
  try{const summary=await nativeCall(folder?'chooseFolder':'chooseFiles',{},300000);const snapshot=await nativeSnapshot(summary);if(!snapshot)return;await importFiles(snapshot.files,snapshot.folder,true);$('folderName').textContent=snapshot.label;if(snapshot.limited)toast('Chỉ nhận tối đa 5.000 mục và 32 cấp thư mục. Hãy chọn thư mục nhỏ hơn nếu thiếu bài.');}
  catch(e){toast(e.message);}
}
$('openFolder').addEventListener('click',()=>{setOpenMenu(false);if(IS_ANDROID){chooseNative(true);return;}if(!('webkitdirectory' in $('folderInput'))){toast('Trình duyệt không hỗ trợ thư mục. Hãy chọn các tệp .md và ảnh.');$('filesInput').click();}else $('folderInput').click();});
$('openFiles').addEventListener('click',()=>{setOpenMenu(false);if(IS_ANDROID)chooseNative(false);else $('filesInput').click();});
for(const [id,folder] of [['folderInput',true],['filesInput',false]])$(id).addEventListener('change',async e=>{try{await importFiles(e.target.files,folder);}catch(err){toast('Không mở được bộ tệp: '+err.message);}e.target.value='';});
$('forget').addEventListener('click',clearFiles);$('fileFilter').addEventListener('input',renderFileList);
$('menu').addEventListener('click',()=>{document.body.classList.toggle('sidebar-open');});for(const id of ['scrim'])$(id).addEventListener('click',()=>document.body.classList.remove('sidebar-open'));
for(const name of ['read','edit','split'])$(name+'Mode').addEventListener('click',()=>setMode(name));
$('editor').addEventListener('input',()=>{if(new Blob([$('editor').value]).size>MAX_DOC){$('editor').value=source;toast('Bản sửa đã vượt giới hạn 5 MiB.');return;}source=$('editor').value;saveCurrent();stats();invalidateFind();scheduleRender(280);});
$('editor').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const el=$('editor');el.setRangeText('  ',el.selectionStart,el.selectionEnd,'end');el.dispatchEvent(new Event('input'));}});
$('prevFile').addEventListener('click',()=>moveFile(-1));$('nextFile').addEventListener('click',()=>moveFile(1));
$('sortOrder').addEventListener('click',()=>{settings.descending=!settings.descending;persist();renderFileList();});
$('download').addEventListener('click',download);$('settings').addEventListener('click',()=>{finishInline();$('customCSS').value=settings.css;$('cssFeedback').textContent='';$('settingsDialog').showModal();});$('help').addEventListener('click',()=>$('helpDialog').showModal());
for(const button of document.querySelectorAll('[data-section]'))button.addEventListener('click',()=>{for(const b of document.querySelectorAll('[data-section]')){b.classList.toggle('active',b===button);if(b===button)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}for(const section of document.querySelectorAll('.settings-section'))section.hidden=section.id!=='section-'+button.dataset.section;document.querySelector('#settingsDialog .settings-content')?.scrollTo(0,0);});
for(const b of document.querySelectorAll('.close-dialog'))b.addEventListener('click',()=>b.closest('dialog').close());
for(const b of $('themes').querySelectorAll('button'))b.addEventListener('click',()=>{settings.theme=b.dataset.theme;settingsChange();});
for(const [id,key] of [['fontSize','size'],['width','width'],['lineHeight','leading']])$(id).addEventListener('input',()=>{settings[key]=Number($(id).value);settingsChange();});
$('unifiedEnabled').addEventListener('change',()=>{finishInline(false,false);settings.unified=$('unifiedEnabled').checked;setMode('read');settingsChange();});
$('mermaidEnabled').addEventListener('change',()=>{settings.mermaid=$('mermaidEnabled').checked;settingsChange();});$('remember').addEventListener('change',()=>{settings.remember=$('remember').checked;persist();});
$('applyCSS').addEventListener('click',()=>{try{const cleaned=cleanCSS($('customCSS').value);settings.css=cleaned;persist();scheduleRender();$('cssFeedback').textContent='Đã áp dụng CSS trong vùng đọc.';}catch(e){$('cssFeedback').textContent=e.message;}});
$('resetCSS').addEventListener('click',()=>{settings.css='';$('customCSS').value='';$('cssFeedback').textContent='Đã xóa CSS.';persist();scheduleRender();});
$('importCSS').addEventListener('click',async()=>{if(!IS_ANDROID){$('cssInput').click();return;}try{const result=await nativeCall('chooseCss',{},300000);if(result.cancelled)return;cleanCSS(result.css);$('customCSS').value=result.css;$('cssFeedback').textContent='Đã nhập CSS. Bấm Áp dụng để dùng.';}catch(e){$('cssFeedback').textContent=e.message;}});$('cssInput').addEventListener('change',async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>100000)throw new Error('CSS vượt 100.000 byte.');const text=decodeText(await f.arrayBuffer());cleanCSS(text);$('customCSS').value=text;$('cssFeedback').textContent='Đã nhập CSS. Bấm Áp dụng để dùng.';}catch(err){$('cssFeedback').textContent=err.message;}e.target.value='';});

$('findToggle').addEventListener('click',()=>toggleFind($('findbar').hidden));$('findClose').addEventListener('click',()=>toggleFind(false));
$('findInput').addEventListener('input',invalidateFind);
for(const id of ['findCase','findRegex'])$(id).addEventListener('click',()=>{$(id).setAttribute('aria-pressed',String($(id).getAttribute('aria-pressed')!=='true'));invalidateFind();});
$('findInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();moveFind(e.shiftKey?-1:1);}});
$('replaceInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();replaceFind(e.ctrlKey||e.metaKey);}});
$('findPrev').addEventListener('click',()=>moveFind(-1));$('findNext').addEventListener('click',()=>moveFind(1));
$('replaceOne').addEventListener('click',()=>replaceFind());$('replaceAll').addEventListener('click',()=>replaceFind(true));
window.addEventListener('keydown',keyboard);window.addEventListener('beforeunload',e=>{if(hasDrafts()){e.preventDefault();e.returnValue='';}});window.addEventListener('pagehide',revokeImages);window.addEventListener('pageshow',e=>{if(e.persisted)scheduleRender();});
$('editor').value=source;uiSettings();renderFileList();stats();scheduleRender();

if(IS_ANDROID){
  window.markReadSave=download;
  window.markReadBack=()=>{if(renameBusy)return 'handled';if(!$('modeOptions').hidden){setModeMenu(false);return 'handled';}if(!$('openOptions').hidden){setOpenMenu(false);return 'handled';}if(!$('fontOptions').hidden){setFontMenu(false);return 'handled';}if(inlineEdit){finishInline();return 'handled';}const dialog=[...document.querySelectorAll('dialog[open]')].pop();if(dialog){dialog.close();return 'handled';}if(document.body.classList.contains('sidebar-open')){document.body.classList.remove('sidebar-open');return 'handled';}if(!$('findbar').hidden){toggleFind(false);return 'handled';}if(mode!=='read'){setMode('read');return 'handled';}return hasDrafts()?'dirty':'exit';};
  nativeReady.then(async()=>{
    try{await nativeCall('theme',{theme:settings.theme});const summary=await nativeCall('restore',{},120000);if(summary.count||summary.folder){const snapshot=await nativeSnapshot(summary);await importFiles(snapshot.files,snapshot.folder,true);$('folderName').textContent=snapshot.label;if(snapshot.limited)toast('Thư mục lớn. Chỉ nhận tối đa 5.000 mục.');}}
    catch(e){toast(e.message||'Không khôi phục được quyền thư mục. Hãy chọn lại.');}
  });
}
