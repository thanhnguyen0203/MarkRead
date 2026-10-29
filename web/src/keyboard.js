// Native text input remains owned by the browser. These helpers only handle explicit UI keys.
export const compositions=new Set();
export const isIME=e=>e.isComposing||e.keyCode===229||compositions.has(e.target);
export function watchComposition(doc,start,end){
  doc.addEventListener('compositionstart',e=>{compositions.add(e.target);start(e.target);},true);
  doc.addEventListener('compositionend',e=>{compositions.delete(e.target);end(e.target);},true);
}
export function indentTextarea(e,input){
  if(e.defaultPrevented||e.key!=='Tab'||e.shiftKey||e.ctrlKey||e.metaKey||e.altKey||isIME(e))return;
  // Chromium's native editing command retains its undo buffer. Unsupported engines keep native Tab.
  const doc=input.ownerDocument;let changed=false,handled=false;
  const observed=()=>{changed=true;};input.addEventListener('input',observed);
  try{handled=doc.execCommand('insertText',false,'  ');}catch{/* Keep the native escape route. */}
  input.removeEventListener('input',observed);
  if(handled||changed){e.preventDefault();if(!changed)input.dispatchEvent(new Event('input',{bubbles:true}));}
}
export function focusable(root){
  return [...root.querySelectorAll('button,input,select,textarea,a[href],summary,iframe,[tabindex]')]
    .filter(x=>!x.disabled&&x.tabIndex>=0&&x.getClientRects().length&&getComputedStyle(x).visibility!=='hidden');
}
export function isolate(root){
  const hidden=root.getAttribute('aria-hidden'),native='inert' in root,prior=root.inert,tabStops=[];
  if(native)root.inert=true;
  else for(const node of focusable(root)){tabStops.push([node,node.getAttribute('tabindex')]);node.setAttribute('tabindex','-1');}
  root.setAttribute('aria-hidden','true');
  return ()=>{
    if(native)root.inert=prior;
    for(const [node,value] of tabStops)if(node.getAttribute('tabindex')==='-1'){if(value===null)node.removeAttribute('tabindex');else node.setAttribute('tabindex',value);}
    if(hidden===null)root.removeAttribute('aria-hidden');else root.setAttribute('aria-hidden',hidden);
  };
}
export function bindPopup(trigger,popup,selected=()=>null,onChange=()=>{}){
  const options=()=>[...popup.querySelectorAll('button')].filter(x=>!x.disabled&&!x.hidden&&x.getClientRects().length);
  const current=items=>{const node=selected();return items.includes(node)?node:null;};
  const activate=node=>{for(const item of options())item.tabIndex=item===node?0:-1;};
  const setOpen=open=>{
    const changed=popup.hidden===open;
    popup.hidden=!open;trigger.setAttribute('aria-expanded',String(open));
    if(open){const items=options();activate(current(items)||items[0]);}
    if(changed)onChange(open);
  };
  trigger.addEventListener('keydown',e=>{
    if(isIME(e)||!['ArrowDown','ArrowUp'].includes(e.key))return;
    e.preventDefault();setOpen(true);const items=options(),next=current(items)||items[e.key==='ArrowUp'?items.length-1:0];activate(next);next?.focus();
  });
  popup.addEventListener('keydown',e=>{
    if(isIME(e))return;
    if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
      const items=options(),at=items.indexOf(popup.ownerDocument.activeElement);if(!items.length)return;
      e.preventDefault();const next=items[e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length];activate(next);next.focus();
    }
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setOpen(false);trigger.focus();}
  });
  // Wait for native Tab to choose its destination before hiding the current item.
  popup.addEventListener('focusout',()=>queueMicrotask(()=>{if(!popup.contains(popup.ownerDocument.activeElement))setOpen(false);}));
  return {setOpen};
}
