import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {iconMarkup} from './src/icon-markup.js';

const directory=path.join(path.dirname(fileURLToPath(import.meta.url)),'icons');
const attributes={svg:['xmlns','width','height','viewBox','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin'],path:['d'],circle:['cx','cy','r'],rect:['x','y','width','height','rx','ry'],line:['x1','x2','y1','y2'],polyline:['points'],polygon:['points'],ellipse:['cx','cy','rx','ry']};
// A deliberately narrow validator for this pinned geometry-only subset; not a user-SVG sanitizer.
export function validateIconSVG(svg){
  const stack=[];let at=0,roots=0,geometry=0;
  for(const tag of svg.matchAll(/<(\/?)([A-Za-z][\w-]*)([^<>]*)>/g)){
    if(svg.slice(at,tag.index).trim())throw new Error('Unexpected SVG content');at=tag.index+tag[0].length;
    const [,closing,name,tail]=tag;if(!Object.hasOwn(attributes,name))throw new Error('Unsupported SVG element '+name);
    if(closing){if(tail.trim()||stack.pop()!==name)throw new Error('Unbalanced SVG');continue;}
    const values={};let end=0;const body=tail.replace(/\/\s*$/,'');
    for(const attr of body.matchAll(/\s+([\w:-]+)="([^"<>]*)"/g)){
      if(body.slice(end,attr.index).trim()||!attributes[name].includes(attr[1])||Object.hasOwn(values,attr[1])||attr[2].includes('&'))throw new Error('Unsupported SVG attribute');
      values[attr[1]]=attr[2];end=attr.index+attr[0].length;
    }
    if(body.slice(end).trim())throw new Error('Malformed SVG attribute');
    if(name==='svg'){
      roots++;if(stack.length||roots!==1)throw new Error('Nested SVG');
      const expected={xmlns:'http://www.w3.org/2000/svg',width:'24',height:'24',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'2','stroke-linecap':'round','stroke-linejoin':'round'};
      if(Object.entries(expected).some(([key,value])=>values[key]!==value))throw new Error('Icon geometry/style contract mismatch');
    }else{
      if(stack.length!==1||stack[0]!=='svg'||!Object.keys(values).length)throw new Error('Missing icon geometry');
      if(Object.values(values).some(value=>!value||!/^[a-zA-Z0-9\s.,+\-]+$/.test(value)))throw new Error('Invalid geometry value');geometry++;
    }
    if(!/\/\s*$/.test(tail))stack.push(name);
  }
  if(svg.slice(at).trim()||stack.length||roots!==1||!geometry)throw new Error('Empty or malformed SVG');
  return svg;
}
export function loadIconRegistry(){
  const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'),'utf8')),registry={};
  for(const [name,entry] of Object.entries(manifest.icons)){
    if(!/^[a-z][a-z0-9-]*$/.test(name)||entry.file!==`lucide/${name}.svg`)throw new Error('Invalid icon registry path');
    const bytes=fs.readFileSync(path.join(directory,entry.file));
    if(crypto.createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw new Error('Icon source hash mismatch: '+name);
    registry[name]=validateIconSVG(bytes.toString('utf8'));
  }
  for(const entry of manifest.licenses){
    if(!/^LICENSE-(lucide|feather)$/.test(entry.file))throw new Error('Invalid license path');
    if(crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,entry.file))).digest('hex')!==entry.sha256)throw new Error('License source hash mismatch');
  }
  return {manifest,registry:Object.freeze(registry),license:manifest.licenses.map(x=>fs.readFileSync(path.join(directory,x.file),'utf8')).join('\n')};
}
export function replaceShellIcons(shell,registry){
  const result=shell.replace(new RegExp('__ICON_([a-z][a-z0-9-]*)__','g'),(_,name)=>iconMarkup(registry,name));
  if(result.includes('__ICON_'))throw new Error('Unresolved icon placeholder');return result;
}
