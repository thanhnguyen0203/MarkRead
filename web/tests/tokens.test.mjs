import test from 'node:test';
import assert from 'node:assert/strict';
import {themes} from '../src/themes.js';
import {resolvedThemes,cssVariables} from '../src/tokens.js';

const rgb=h=>h.slice(1).match(/../g).map(n=>parseInt(n,16));
const mix=(a,b,t)=>'#'+rgb(a).map((n,i)=>Math.round(n*(1-t)+rgb(b)[i]*t).toString(16).padStart(2,'0')).join('');
const lum=h=>rgb(h).map(n=>{const x=n/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const expected={
  dark:['#acb6b0','#91c7b0','#1b1e20','#8e938f'],
  light:['#526057','#2c684d','#f5f6f5','#767a77'],
  sepia:['#5d5544','#57572e','#ffffff','#757064'],
  black:['#9faea4','#9dcea9','#101211','#868d88'],
  'tokyo-night':['#a6b0d4','#8fb1f8','#16161e','#8b8fa0'],
  'tokyo-light':['#41495f','#2d4978','#d5d6db','#5f6268'],
  'blue-gray':['#ced9df','#bbdde7','#202c32','#a9b2b6'],
  nord:['#d9dfe8','#cbe3ea','#272d38','#b4b8c0'],
  dracula:['#c3cbe4','#d9c0fc','#21222c','#a4a5b0'],
  'rose-pine':['#b8b2c8','#ebbcba','#1f1d2e','#94919e'],
  forest:['#c1d1c6','#b9d5ab','#18231d','#a0aba3'],
  gruvbox:['#d5cbba','#e7c897','#1d2021','#a9a6a4']
};
assert.deepEqual(Object.keys(resolvedThemes),Object.keys(expected));

for(const [id,{palette:p}] of Object.entries(themes))test(`${id}: resolved tokens retain primitives and meet contrast targets`,()=>{
  const {tokens:t,legacy}=resolvedThemes[id];
  assert.deepEqual([t['mr-text-secondary'],t['mr-accent-text'],t['mr-on-accent'],t['mr-border-control']],expected[id]);
  assert.equal(t['mr-bg'],p.bg);assert.equal(t['mr-accent-fill'],p.accent);
  assert.equal(t['mr-selected'],p.selected);assert.equal(legacy.accent,t['mr-accent-text']);
  assert.equal(legacy.bg,p.bg);assert.equal(legacy.quote,p.quote);
  assert.equal(cssVariables(resolvedThemes[id]).includes(`--mr-focus:${t['mr-focus']}`),true);
  assert.equal(cssVariables(resolvedThemes[id]).includes(`--accent:${legacy.accent}`),true);
  const states=[p.bg,p.panel,p.surface,p.selected,p.quote,p.code].flatMap(b=>[b,mix(b,p.text,.04),mix(b,p.text,.08)]);
  for(const key of ['mr-text-primary','mr-heading','mr-text-secondary','mr-accent-text','mr-error','mr-success','mr-warning','mr-info'])for(const bg of states)assert.ok(ratio(t[key],bg)>=4.5,`${id} ${key} on ${bg}`);
  for(const bg of states){assert.ok(ratio(t['mr-border-control'],bg)>=3,`${id} control border`);assert.ok(ratio(t['mr-focus'],bg)>=3,`${id} focus`);}
  const on=t['mr-on-accent'];
  for(const key of ['mr-accent-fill','mr-accent-hover','mr-accent-pressed'])assert.ok(ratio(on,t[key])>=4.5,`${id} ${key}`);
  for(const key of ['mr-syntax1','mr-syntax2'])assert.ok(ratio(t[key],p.code)>=4.5,`${id} ${key}`);
});
