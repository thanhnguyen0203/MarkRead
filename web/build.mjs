import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { build } from 'esbuild';
import {loadIconRegistry,replaceShellIcons} from './icon-registry.mjs';
const cwd=path.dirname(fileURLToPath(import.meta.url));
const iconAssets=loadIconRegistry();
const fontCSS=['Merriweather.woff2','Merriweather-Italic.woff2'].map((name,i)=>`@font-face{font-family:Merriweather;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(cwd,'fonts',name)).toString('base64')}) format('woff2');font-weight:300 900;font-style:${i?'italic':'normal'};font-display:swap;}`).join('');
let mathCSS=fs.readFileSync(path.join(cwd,'node_modules/katex/dist/katex.min.css'),'utf8');
// WOFF2 is supported by the target modern browsers; remove duplicate fallback payloads.
mathCSS=mathCSS.replace(/src:[^;}]+/g,rule=>{const match=rule.match(/url\(([^)]+\.woff2)\)\s*format\([^)]+\)/);return match?'src:'+match[0]:rule;});
mathCSS=mathCSS.replace(/url\((?:["']?)(fonts\/[^)'"\s]+)(?:["']?)\)/g,(_,p)=>'url(data:font/woff2;base64,'+fs.readFileSync(path.join(cwd,'node_modules/katex/dist',p)).toString('base64')+')');
const worker=await build({entryPoints:[path.join(cwd,'src/search-worker.js')],bundle:true,write:false,minify:true,format:'iife',platform:'browser',target:'chrome100'});
const result=await build({entryPoints:[path.join(cwd,'src/app.js')],bundle:true,write:false,minify:true,format:'iife',platform:'browser',target:['chrome100','firefox100','safari16'],loader:{'.md':'text','.css':'text','.svg':'text'},legalComments:'inline',plugins:[{name:'inline-search-worker',setup(b){b.onResolve({filter:/^inline-search-worker$/},()=>({path:'search-worker',namespace:'search'}));b.onLoad({filter:/.*/,namespace:'search'},()=>({contents:worker.outputFiles[0].text,loader:'text'}));}},{name:'inline-font',setup(b){b.onResolve({filter:/^inline-merriweather-css$/},()=>({path:'inline-merriweather-css',namespace:'font'}));b.onLoad({filter:/.*/,namespace:'font'},()=>({contents:fontCSS,loader:'text'}));}},{name:'inline-katex',setup(b){b.onResolve({filter:/^inline-katex-css$/},()=>({path:'inline-katex-css',namespace:'internal'}));b.onLoad({filter:/.*/,namespace:'internal'},()=>({contents:mathCSS,loader:'text'}));}}]});
let bundle=fs.readFileSync(path.join(cwd,'node_modules/mermaid/dist/mermaid.min.js'),'utf8')+'\n'+result.outputFiles[0].text;
bundle=bundle.replace(/<\/(script|body|head|html)/gi,(_,name)=>'<\\/'+name).replace(/<!--/g,'\\x3c!--').replace(/<script/gi,'\\x3cscript');
const hash=crypto.createHash('sha256').update(bundle).digest('base64');
const csp=`default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; img-src blob: data:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'self' about:; worker-src blob:; media-src 'none'; manifest-src 'none'`;
const shell=replaceShellIcons(fs.readFileSync(path.join(cwd,'src/shell.html'),'utf8'),iconAssets.registry);
const replacements={__CSP__:csp,__APP_CSS__:fs.readFileSync(path.join(cwd,'src/app.css'),'utf8'),__BUNDLE__:bundle};
const output=shell.replace(/__CSP__|__APP_CSS__|__BUNDLE__/g,s=>replacements[s]).replace('__LUCIDE_LICENSE__','<!-- Lucide0.468.0 / Feather notices\n'+iconAssets.license.replaceAll('--','- -')+'\n-->');
fs.mkdirSync(path.join(cwd,'dist'),{recursive:true});
fs.writeFileSync(path.join(cwd,'dist/MarkRead.html'),output);
// QA hosting configuration has no identity and is excluded from the deliverable.
fs.mkdirSync(path.join(cwd,'.openai'),{recursive:true});fs.writeFileSync(path.join(cwd,'.openai/hosting.json'),JSON.stringify({static:{directory:'dist'}}));
console.log(JSON.stringify({file:'dist/MarkRead.html',bytes:Buffer.byteLength(output),sha256:crypto.createHash('sha256').update(output).digest('hex')}));
