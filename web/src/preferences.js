import {themes} from './themes.js';
import {cleanCSS} from './core.js';

export const DEFAULTS=Object.freeze({theme:'dark',font:'sans',size:18,width:860,leading:1.8,css:'',mermaid:true,unified:false,descending:false});
export function appearanceSettings(saved){
  const settings={...DEFAULTS};
  if(!saved||typeof saved!=='object'||Array.isArray(saved))return settings;
  if(Object.hasOwn(themes,saved.theme))settings.theme=saved.theme;
  if(['sans','serif','merriweather','mono'].includes(saved.font))settings.font=saved.font;
  for(const [key,lo,hi] of [['size',12,32],['width',480,1400],['leading',1.2,2.4]])if(Number.isFinite(saved[key]))settings[key]=Math.max(lo,Math.min(hi,saved[key]));
  try{if(typeof saved.css==='string')settings.css=cleanCSS(saved.css);}catch{/* Keep the other preferences if old CSS is invalid. */}
  settings.mermaid=saved.mermaid!==false;settings.unified=saved.unified===true;settings.descending=saved.descending===true;
  return settings;
}
