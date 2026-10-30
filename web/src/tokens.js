import {themes} from './themes.js';

// Resolve each palette once. Mixing uses encoded sRGB; contrast uses linear light.
const channels=hex=>hex.slice(1).match(/../g).map(part=>parseInt(part,16));
const hex=values=>'#'+values.map(value=>Math.round(value).toString(16).padStart(2,'0')).join('');
const mix=(a,b,amount)=>hex(channels(a).map((value,index)=>value*(1-amount)+channels(b)[index]*amount));
const luminance=value=>channels(value).map(channel=>{const c=channel/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,c,index)=>sum+c*[.2126,.7152,.0722][index],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};

function resolve(id,{light,palette:p}){
  const bases=[p.bg,p.panel,p.surface,p.selected,p.quote,p.code];
  const states=bases.flatMap(base=>[base,mix(base,p.text,.04),mix(base,p.text,.08)]);
  const ensure=(seed,target=4.8,backgrounds=states)=>{
    for(let step=0;step<=100;step++){
      const candidate=mix(seed,light?'#000000':'#ffffff',step/100);
      if(backgrounds.every(background=>contrast(candidate,background)>=target))return candidate;
    }
    throw new Error(`Cannot resolve ${id} color ${seed}`);
  };
  const onAccent=contrast(p.panel,p.accent)>=4.8?p.panel:
    (contrast('#000000',p.accent)>=contrast('#ffffff',p.accent)?'#000000':'#ffffff');
  const opposite=luminance(onAccent)>.5?'#000000':'#ffffff';
  const semanticSeeds=light?
    {error:'#b42332',success:'#246744',warning:'#855500',info:'#265f9e'}:
    {error:'#ff9b9b',success:'#9dccb0',warning:'#e6c786',info:'#a9c9f6'};
  const semantic=Object.fromEntries(Object.entries(semanticSeeds).map(([key,value])=>[key,ensure(value)]));
  const tokens={
    'mr-bg':p.bg,'mr-surface':p.panel,'mr-surface-elevated':p.surface,
    'mr-text-primary':ensure(p.text),'mr-text-secondary':ensure(p.muted),
    'mr-heading':ensure(p.heading),'mr-accent-fill':p.accent,
    'mr-accent-text':ensure(p.accent),'mr-on-accent':onAccent,
    'mr-border':p.line,'mr-border-control':ensure(p.line,3.2),
    'mr-hover':mix(p.surface,p.text,.04),'mr-pressed':mix(p.surface,p.text,.08),
    'mr-hover-surface':mix(p.panel,p.text,.04),'mr-pressed-surface':mix(p.panel,p.text,.08),
    'mr-hover-bg':mix(p.bg,p.text,.04),'mr-pressed-bg':mix(p.bg,p.text,.08),
    'mr-selected':p.selected,'mr-selected-hover':mix(p.selected,p.text,.04),
    'mr-selected-pressed':mix(p.selected,p.text,.08),
    'mr-selected-text':ensure(p.accent),'mr-focus':ensure(p.heading),
    'mr-disabled-text':ensure(mix(p.muted,p.bg,.4),3.2),
    'mr-disabled-surface':p.surface,
    'mr-accent-hover':mix(p.accent,opposite,.04),
    'mr-accent-pressed':mix(p.accent,opposite,.08),
    'mr-error':semantic.error,'mr-success':semantic.success,
    'mr-warning':semantic.warning,'mr-info':semantic.info,
    'mr-quote':p.quote,'mr-code':p.code,
    'mr-syntax1':ensure(p.syntax1,4.8,[p.code]),
    'mr-syntax2':ensure(p.syntax2,4.8,[p.code]),
    // Component aliases keep rules independent from the palette algorithm.
    'mr-button-bg':p.surface,'mr-file-current-bg':p.selected,
    'mr-field-border':ensure(p.line,3.2),'mr-reader-link':ensure(p.accent)
  };
  const legacy={bg:tokens['mr-bg'],panel:tokens['mr-surface'],surface:tokens['mr-surface-elevated'],
    text:tokens['mr-text-primary'],heading:tokens['mr-heading'],muted:tokens['mr-text-secondary'],
    accent:tokens['mr-accent-text'],line:tokens['mr-border'],selected:tokens['mr-selected'],
    quote:p.quote,code:p.code,syntax1:tokens['mr-syntax1'],syntax2:tokens['mr-syntax2']};
  return Object.freeze({tokens:Object.freeze(tokens),legacy:Object.freeze(legacy)});
}

export const resolvedThemes=Object.freeze(Object.fromEntries(Object.entries(themes).map(([id,theme])=>[id,resolve(id,theme)])));
export const cssVariables=theme=>Object.entries({...theme.tokens,...theme.legacy}).map(([key,value])=>`--${key}:${value}`).join(';');
