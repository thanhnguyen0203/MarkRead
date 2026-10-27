/** Pure workspace operations shared by UI and regression tests. */
const collator=new Intl.Collator('vi',{numeric:true,sensitivity:'base'});
export function fileTree(paths,descending=false){
  const root={name:'',path:'',children:new Map()};
  for(const path of paths){let parent=root;const parts=path.split('/');parts.forEach((name,i)=>{const key=parts.slice(0,i+1).join('/');if(!parent.children.has(name))parent.children.set(name,{name,path:key,directory:i<parts.length-1,children:new Map()});parent=parent.children.get(name);});}
  const sort=node=>[...node.children.values()].sort((a,b)=>Number(b.directory)-Number(a.directory)||(collator.compare(a.name,b.name)||a.name.localeCompare(b.name))*(descending?-1:1)).map(n=>({...n,children:sort(n)}));
  return sort(root);
}
export function orderedPaths(tree){return tree.flatMap(n=>n.directory?orderedPaths(n.children):[n.path]);}
export function adjacentPath(paths,current,delta){const at=paths.indexOf(current);return at<0?null:paths[at+delta]??null;}
export function renamedDocumentPath(path,filename){
  const name=String(filename).trim().normalize('NFC');
  if(!name||name==='.'||name==='..'||/[\\/:*?"<>|\x00-\x1f\x7f]/.test(name)||name.endsWith('.')||name.length>180)throw new Error('Tên tệp không hợp lệ. Dùng tối đa 180 ký tự và không chứa \\ / : * ? " < > |.');
  return path.slice(0,path.lastIndexOf('/')+1)+name;
}
export function mappedBlocks(text,tokens){
  // No guessed offsets: if a future lexer changes its normalization, edit as one block.
  if(tokens.map(t=>t.raw).join('')!==text)return [{start:0,end:text.length,tokens}];
  let at=0;return tokens.map(token=>{const start=at;at+=token.raw.length;return {start,end:at,tokens:[token]};});
}
export function replaceBlock(text,start,end,value,maxBytes){
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>text.length)throw new Error('Vị trí khối không còn hợp lệ.');
  const next=text.slice(0,start)+value+text.slice(end);
  if(new TextEncoder().encode(next).byteLength>maxBytes)throw new Error('Bản sửa đã vượt giới hạn 5 MiB.');
  return {text:next,end:start+value.length};
}

export function editableBlockEnd(text,start,end){
  // Keep the blank separator between adjacent blocks outside the editable range.
  const suffix=/\n(?:[ \t]*\n)+$/.exec(text.slice(start,end));
  return suffix?start+suffix.index+1:(!text.slice(start,end).endsWith('\n')&&text[end]==='\n'?end+1:end);
}
