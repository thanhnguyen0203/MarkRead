/** Runs in an isolated worker: a pathological regex cannot block the reader UI. */
export function searchDocument({text,query,caseSensitive=false,regex=false,replacement='',action='scan',index=0,maxBytes=5*1024*1024}){
  if(!query)return {matches:[],limited:false};
  if(query.length>2000)throw new Error('Nội dung tìm kiếm vượt 2.000 ký tự.');
  let pattern;
  try{pattern=new RegExp(regex?query:query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gmu'+(caseSensitive?'':'i'));}
  catch{throw new Error('Biểu thức regex không hợp lệ.');}
  const found=[];let match,limited=false;
  while((match=pattern.exec(text))!==null){
    if(found.length===20000){limited=true;break;}
    found.push(match);
    if(match[0].length===0){const cp=text.codePointAt(pattern.lastIndex);pattern.lastIndex+=cp>0xffff?2:1;}
  }
  const matches=found.map(m=>({start:m.index,end:m.index+m[0].length}));
  if(action==='scan')return {matches,limited};
  if(action==='replaceAll'&&limited)throw new Error('Có hơn 20.000 kết quả. Hãy thu hẹp nội dung tìm trước khi thay tất cả.');
  if(action!=='replace'&&action!=='replaceAll')throw new Error('Thao tác tìm kiếm không hợp lệ.');
  const selected=action==='replaceAll'?found:found.slice(index,index+1);
  // Match JavaScript replacement syntax only in regex mode; plain text keeps $ literal.
  function expand(m){
    if(!regex)return replacement;
    function substitute(token,key){
      if(key==='$')return '$';if(key==='&')return m[0];
      if(key==='`')return text.slice(0,m.index);if(key==="'")return text.slice(m.index+m[0].length);
      if(key[0]==='<')return m.groups?(m.groups[key.slice(1,-1)]??''):token;
      const n=Number(key);
      if(n>0&&n<m.length)return m[n]??'';
      if(key.length===2&&Number(key[0])>0&&Number(key[0])<m.length)return (m[Number(key[0])]??'')+key[1];
      return token;
    }
    const chunks=[];let at=0,length=0;const tokens=/\$(\$|&|`|'|<[^>]*>|\d{1,2})/g;let token;
    const push=value=>{length+=value.length;if(length>maxBytes)throw new Error('Bản sửa đã vượt giới hạn 5 MiB.');chunks.push(value);};
    while((token=tokens.exec(replacement))){push(replacement.slice(at,token.index));push(substitute(token[0],token[1]));at=token.index+token[0].length;}
    push(replacement.slice(at));return chunks.join('');
  }
  const chunks=[];let at=0,bytes=0,nextOffset=0;
  const encoder=new TextEncoder();
  function append(value){bytes+=encoder.encode(value).length;if(bytes>maxBytes)throw new Error('Bản sửa đã vượt giới hạn 5 MiB.');chunks.push(value);}
  for(const m of selected){append(text.slice(at,m.index));const value=expand(m);append(value);at=m.index+m[0].length;nextOffset=m.index+value.length;}
  append(text.slice(at));
  return {matches,limited,text:chunks.join(''),count:selected.length,nextOffset,zeroLength:selected.length===1&&selected[0][0].length===0};
}
