import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadIconRegistry,validateIconSVG,replaceShellIcons} from '../icon-registry.mjs';
import {iconMarkup} from '../src/icon-markup.js';

const {manifest,registry,license}=loadIconRegistry();
const expected='menu folder-open file-text chevron-left chevron-right search download settings ellipsis-vertical arrow-up-down x check chevron-down arrow-up arrow-down book-open code-xml columns-2 pencil copy info triangle-alert loader-circle'.split(' ');
test('the pinned subset contains exactly the23 P1 names',()=>assert.deepEqual(Object.keys(registry).sort(),expected.sort()));
test('source URLs are pinned to one verified Lucide revision',()=>{
 assert.equal(manifest.version,'0.468.0');assert.equal(manifest.commit,'f12b0de177fbc2a6795e99be065887e72b237123');
 for(const [name,entry] of Object.entries(manifest.icons))assert.equal(entry.url,`https://raw.githubusercontent.com/lucide-icons/lucide/${manifest.commit}/icons/${name}.svg`);
});
for(const name of expected)test('reviewed SVG and decorative markup: '+name,()=>{
 const markup=iconMarkup(registry,name);assert.ok(validateIconSVG(registry[name]));
 for(const attr of ['viewBox="0 0 24 24"','stroke="currentColor"','stroke-width="2"','fill="none"','aria-hidden="true"','focusable="false"',`data-icon="${name}"`])assert.ok(markup.includes(attr),name+': '+attr);
 assert.doesNotMatch(markup,/\s(?:id|tabindex|role|aria-label|href|style|on\w+)=|<title|<use|<script/i);
});
test('unknown, inherited and markup-injection names never produce SVG',()=>{
 for(const name of ['unknown','constructor','__proto__','menu" onload="x','menu<script>',' menu','MENU'])assert.throws(()=>iconMarkup(registry,name));
});
test('shell placeholder resolution rejects missing or malformed icons',()=>{
 assert.match(replaceShellIcons('__ICON_menu__',registry),/data-icon="menu"/);
 assert.throws(()=>replaceShellIcons('__ICON_missing__',registry));assert.throws(()=>replaceShellIcons('__ICON_"><script>__',registry));
});
const svg=registry.menu;
for(const [name,input] of Object.entries({
 empty:svg.replace(/<line[^>]*\/>/g,''),
 script:svg.replace('</svg>','<script>alert(1)</script></svg>'),
 externalUse:svg.replace('</svg>','<use href="https://bad.test/x"/></svg>'),
 event:svg.replace('width="24"','width="24" onload="alert(1)"'),
 hiddenStyle:svg.replace('width="24"','width="24" style="display:none"'),
 duplicateId:svg.replace('width="24"','width="24" id="x"'),
 foreignObject:svg.replace('</svg>','<foreignObject/></svg>'),
 unbalanced:svg.replace('</svg>',''),
 duplicateAttribute:svg.replace('width="24"','width="24" width="24"'),
 wrongStroke:svg.replace('stroke-width="2"','stroke-width="1.7"'),
 wrongViewBox:svg.replace('0 0 24 24','0 0 48 24'),
 entity:svg.replace('currentColor','&#35;fff')
}))test('build rejects unsafe/incompatible SVG: '+name,()=>assert.throws(()=>validateIconSVG(input)));
test('runtime imports match the reviewed subset without bundling a library',()=>{
 const source=fs.readFileSync(new URL('../src/icons.js',import.meta.url),'utf8');
 const names=[...source.matchAll(/from '\.\.\/icons\/lucide\/([a-z0-9-]+)\.svg'/g)].map(x=>x[1]);assert.deepEqual(names.sort(),expected.sort());
});
test('both copyright/permission notices are shipped with the Android asset',()=>{
 assert.match(license,/ISC License/);assert.match(license,/MIT License/);assert.match(license,/Lucide Contributors/);assert.match(license,/Cole Bemis/);
 const notices=fs.readFileSync(new URL('../../app/src/main/assets/THIRD_PARTY_NOTICES.txt',import.meta.url),'utf8').replace(/\r\n/g,'\n');
 for(const entry of manifest.licenses)assert.ok(notices.includes(fs.readFileSync(new URL('../icons/'+entry.file,import.meta.url),'utf8')));
});
