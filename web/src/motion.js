// Decorations only. Semantic state, focus and business timers never wait for an animation.
export function createMotion(doc=document){
  const win=doc.defaultView,root=doc.documentElement,media=win.matchMedia('(prefers-reduced-motion: reduce)');
  const active=new Map(),listeners=new Set();let nativeReduced=root.dataset.nativeReducedMotion==='true',themeFrame=0;
  const reduced=()=>media.matches||nativeReduced;
  const cancel=node=>{const a=active.get(node);if(a){active.delete(node);a.onfinish=a.oncancel=null;a.cancel();}};
  const cancelTree=node=>{for(const target of active.keys())if(target===node||node.contains(target))cancel(target);};
  const settle=node=>{cancelTree(node);for(const a of node.getAnimations?.()||[])a.cancel();};
  const update=()=>{
    root.toggleAttribute('data-mr-reduced-motion',reduced());
    if(reduced())for(const node of active.keys())cancel(node);
    for(const listener of listeners)listener(reduced());
  };
  media.addEventListener('change',update);
  win.addEventListener('markread-motion-preference',e=>{if(typeof e.detail==='boolean'){nativeReduced=e.detail;root.dataset.nativeReducedMotion=String(e.detail);update();}});
  const stopForInput=e=>{for(const node of active.keys())if(node===e.target||node.contains(e.target))cancel(node);};
  for(const name of ['pointerdown','keydown','beforeinput','compositionstart'])doc.addEventListener(name,stopForInput,true);
  const cancelAll=()=>{for(const node of active.keys())cancel(node);win.cancelAnimationFrame(themeFrame);themeFrame=0;doc.body?.removeAttribute('data-mr-theme-commit');};
  win.addEventListener('pagehide',cancelAll);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)cancelAll();});
  update();
  return {
    reduced,cancel,cancelTree,settle,
    onChange(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
    exitDrawer(node){
      const transform=win.getComputedStyle(node).transform;cancel(node);
      if(reduced()||typeof node.animate!=='function')return;
      const style=win.getComputedStyle(root),duration=parseFloat(style.getPropertyValue('--mr-motion-drawer-exit'))||0;if(!duration)return;
      try{
        const animation=node.animate([{visibility:'visible',transform},{visibility:'visible',transform:'translateX(-100%)'}],{duration,easing:style.getPropertyValue('--mr-ease-exit').trim()||'ease-in',fill:'none'});
        active.set(node,animation);animation.onfinish=animation.oncancel=()=>{if(active.get(node)===animation)active.delete(node);};
      }catch{/* Closing state is immediate even without a visual exit. */}
    },
    enter(node,kind='menu'){
      cancel(node);if(reduced()||typeof node.animate!=='function'||!node.isConnected)return;
      const style=win.getComputedStyle(root),token=kind==='dialog'?'enter':'fast',duration=parseFloat(style.getPropertyValue('--mr-motion-'+token))||0;
      if(!duration)return;
      try{
        const animation=node.animate([{opacity:0,transform:`translateY(${kind==='dialog'?8:4}px)`},{opacity:1,transform:'translateY(0)'}],{duration,easing:style.getPropertyValue('--mr-ease-enter').trim()||'ease-out',fill:'none'});
        active.set(node,animation);
        animation.onfinish=animation.oncancel=()=>{if(active.get(node)===animation)active.delete(node);};
      }catch{/* Missing/disabled WAAPI keeps the already-correct static UI. */}
    },
    commitTheme(){
      // Keep foreground/background changes atomic. The selected check can still give feedback.
      doc.body.setAttribute('data-mr-theme-commit','');win.cancelAnimationFrame(themeFrame);
      themeFrame=win.requestAnimationFrame(()=>{themeFrame=win.requestAnimationFrame(()=>{themeFrame=0;doc.body.removeAttribute('data-mr-theme-commit');});});
    }
  };
}
