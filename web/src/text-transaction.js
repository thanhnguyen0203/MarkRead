// Native textarea history only. No shadow history, block mapping or persistence.
function isHigh(code){return code>=0xd800&&code<=0xdbff;}
function isLow(code){return code>=0xdc00&&code<=0xdfff;}
function splitPair(text,at){return at>0&&isHigh(text.charCodeAt(at-1))&&isLow(text.charCodeAt(at));}

function withTextarea(input,pane,action){
  const doc=input.ownerDocument,active=doc.activeElement;
  const paneStyle=pane.getAttribute('style'),inputMode=input.getAttribute('inputmode');
  const scrollTop=input.scrollTop,scrollLeft=input.scrollLeft;
  const selection=active&&typeof active.selectionStart==='number'?{start:active.selectionStart,end:active.selectionEnd,direction:active.selectionDirection}:null;
  try{
    // Avoid requesting a new soft keyboard during the synchronous native edit.
    input.setAttribute('inputmode','none');
    if(!input.getClientRects().length){
      pane.style.setProperty('display','flex','important');
      for(const [key,value] of Object.entries({position:'fixed',top:'0',left:'0',width:'1px',height:'1px',opacity:'0','pointer-events':'none','z-index':'-1'}))pane.style.setProperty(key,value,'important');
    }
    input.focus({preventScroll:true});
    if(doc.activeElement!==input)return false;
    return action(doc);
  }finally{
    if(paneStyle===null)pane.removeAttribute('style');else pane.setAttribute('style',paneStyle);
    if(inputMode===null)input.removeAttribute('inputmode');else input.setAttribute('inputmode',inputMode);
    input.scrollTop=scrollTop;input.scrollLeft=scrollLeft;
    if(active?.isConnected&&active!==input){
      active.focus({preventScroll:true});
      if(selection)try{active.setSelectionRange(selection.start,selection.end,selection.direction);}catch{/* Non-text controls own their native selection. */}
    }
  }
}

export function replaceTextarea(input,pane,after){
  const before=input.value;
  if(before===after)return true;
  const oldSelection=[input.selectionStart,input.selectionEnd,input.selectionDirection];
  let start=0,suffix=0;
  while(start<before.length&&start<after.length&&before[start]===after[start])start++;
  if(splitPair(before,start)||splitPair(after,start))start--;
  while(suffix<before.length-start&&suffix<after.length-start&&before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;
  if(splitPair(before,before.length-suffix)||splitPair(after,after.length-suffix))suffix--;
  try{
    const applied=withTextarea(input,pane,doc=>{
      if(input.value!==before||typeof doc.execCommand!=='function')return false;
      input.setSelectionRange(start,before.length-suffix);
      doc.execCommand('insertText',false,after.slice(start,after.length-suffix));
      if(input.value===after)return true;
      // Unsupported/partial native editing must never be reported as a successful Replace.
      if(input.value!==before)try{doc.execCommand('undo');}catch{/* Restore exact source below. */}
      return false;
    });
    if(applied&&input.value===after)return true;
  }catch{/* Fail closed without applying a non-undoable replacement. */}
  if(input.value!==before)input.value=before;
  input.setSelectionRange(...oldSelection);
  return false;
}

export function textareaHistory(input,pane,command){
  if(command!=='undo'&&command!=='redo')return false;
  try{return withTextarea(input,pane,doc=>{
    if(!doc.queryCommandEnabled?.(command))return false;
    return doc.execCommand(command);
  });}catch{return false;}
}
