import test from 'node:test';
import assert from 'node:assert/strict';
import {Marked} from 'marked';
import {fileTree,orderedPaths,adjacentPath,mappedBlocks,replaceBlock,editableBlockEnd} from '../src/workspace.js';
import {themes} from '../src/themes.js';
const paths=['Root 10.md','Root 2.md','Unit 2/Part 10.md','Unit 2/Part 2.md','Unit 2/Deep/A.md','Unit 10/C.md'];
test('natural sorting includes all subfolders in displayed tree order',()=>assert.deepEqual(orderedPaths(fileTree(paths)),['Unit 2/Deep/A.md','Unit 2/Part 2.md','Unit 2/Part 10.md','Unit 10/C.md','Root 2.md','Root 10.md']));
test('descending reverses sibling names using numeric comparison',()=>assert.deepEqual(orderedPaths(fileTree(paths,true)),['Unit 10/C.md','Unit 2/Deep/A.md','Unit 2/Part 10.md','Unit 2/Part 2.md','Root 10.md','Root 2.md']));
test('navigation has boundaries and no implicit wrapping',()=>{const p=orderedPaths(fileTree(paths));assert.equal(adjacentPath(p,p[0],-1),null);assert.equal(adjacentPath(p,p.at(-1),1),null);assert.equal(adjacentPath(p,'not-selected.md',1),null);assert.equal(adjacentPath(p,p[0],1),p[1]);});
const markdown=new Marked({gfm:true});
for(const source of ['# Tiếng Việt\n\nĐoạn **đậm**, *nghiêng*.\n\nSau đó.\n','- A\n  - B\n\n- C\n\nKết.','```python\nprint("x")\n```\n\n## Hết\n','A | B\n-- | --\n1 | 2\n\n[đọc][id]\n\n[id]: other.md\n','<div>\nx\n</div>\n\n> quote\n\n\n','\n\n\tcode\n\nĐoạn cuối'])test('block edit preserves unedited bytes: '+source.slice(0,20),()=>{const blocks=mappedBlocks(source,markdown.lexer(source));assert.equal(blocks.map(b=>source.slice(b.start,b.end)).join(''),source);for(const b of blocks){const r=replaceBlock(source,b.start,b.end,'Sửa tiếng Việt 📝\n',100000);assert.equal(r.text.slice(0,b.start),source.slice(0,b.start));assert.equal(r.text.slice(r.end),source.slice(b.end));const undone=replaceBlock(r.text,b.start,r.end,source.slice(b.start,b.end),100000);assert.equal(undone.text,source);}});
test('offset fallback cannot corrupt input',()=>assert.deepEqual(mappedBlocks('abc',[{raw:'different'}]).map(b=>[b.start,b.end]),[[0,3]]));
test('editing rejects invalid offsets and enforces UTF-8 size',()=>{assert.throws(()=>replaceBlock('a',-1,0,'x',100));assert.throws(()=>replaceBlock('a',0,2,'x',100));assert.throws(()=>replaceBlock('a',0,1,'ế',2));assert.equal(replaceBlock('a',0,1,'ế',3).text,'ế');});
test('all 12 themes supply valid complete palettes',()=>{assert.equal(Object.keys(themes).length,12);for(const t of Object.values(themes))for(const key of ['bg','text','heading','muted','accent','line','quote','code','syntax1','syntax2','panel','surface','selected'])assert.match(t.palette[key],/^#[0-9a-f]{6}$/i);});

test('inline ranges keep blank block separators unchanged',()=>{const text='# Heading\n\nParagraph\n';const b=mappedBlocks(text,markdown.lexer(text))[0],end=editableBlockEnd(text,b.start,b.end);assert.equal(text.slice(b.start,end),'# Heading\n');assert.equal(replaceBlock(text,b.start,end,'# Sửa\n',1000).text,'# Sửa\n\nParagraph\n');});

test('rename accepts full filenames, preserves directory and normalizes Unicode',async()=>{
 const {renamedDocumentPath}=await import('../src/workspace.js');
 assert.equal(renamedDocumentPath('Phần 1/Chương 2.MD','  Tên mới.txt  '),'Phần 1/Tên mới.txt');
 assert.equal(renamedDocumentPath('a.markdown','e\u0301.md'),'é.md');
 for(const name of ['a.txt','a.markdown','a.css','a.foo','a'])assert.equal(renamedDocumentPath('Dir/a.md',name),'Dir/'+name);
 for(const name of ['', ' ', '.', '..','../escape','a/b','a\\b','a:b','a\nb','a?b','a.','x'.repeat(181)])assert.throws(()=>renamedDocumentPath('Dir/a.md',name));
});
