import * as csstree from 'css-tree';
export const MAX_DOC = 5 * 1024 * 1024;
export const MAX_IMAGE = 10 * 1024 * 1024;
export const MAX_FILES = 5000;
export const MARKDOWN = /\.(md|markdown|txt)$/i;
export const IMAGE = /\.(png|jpe?g|gif|webp|avif|bmp)$/i;
export function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function localTarget(raw, base = '') {
  if (typeof raw !== 'string' || raw.length > 4096) return null;
  let value = raw.trim();
  if (!value || /^[a-z][a-z\d+.-]*:/i.test(value) || /^[\\/]/.test(value)) return null;
  let fragment = '';
  const h = value.indexOf('#');
  if (h >= 0) { fragment = value.slice(h + 1); value = value.slice(0, h); }
  value = value.split('?')[0];
  try { value = decodeURIComponent(value); fragment = decodeURIComponent(fragment); } catch { return null; }
  if (/[\x00-\x1f\x7f\\]/.test(value) || /^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('/')) return null;
  const stack = value ? base.split('/').slice(0, -1).filter(Boolean) : base.split('/').filter(Boolean);
  if (value) for (const part of value.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') { if (!stack.length) return null; stack.pop(); }
    else stack.push(part);
  }
  return {path:stack.join('/'),fragment};
}
export function cleanCSS(source) {
  if (source.length > 100000) throw new Error('CSS vượt quá 100.000 ký tự.');
  let ast;
  try { ast = csstree.parse(source, {positions:false, onParseError:e=>{throw e;}}); }
  catch { throw new Error('CSS sai cú pháp. Kiểm tra dấu ngoặc và dấu chấm phẩy.'); }
  csstree.walk(ast, node => {
    if (node.type === 'Raw' || node.type === 'Url') throw new Error('CSS chứa URL hoặc cú pháp không được hỗ trợ.');
    if (node.type === 'Atrule' && !['media','supports','layer','container'].includes(node.name.toLowerCase())) throw new Error('Chỉ hỗ trợ @media, @supports, @layer và @container. Không cho phép @import hay @font-face.');
    if (node.type === 'Function' && ['url','image-set','-webkit-image-set','expression','paint','src'].includes(node.name.toLowerCase())) throw new Error('CSS không được tải tài nguyên hoặc thực thi mã.');
    if (node.type === 'Declaration' && /^(behavior|-moz-binding)$/i.test(node.property)) throw new Error('Thuộc tính CSS không an toàn.');
  });
  return csstree.generate(ast);
}
export function decodeText(bytes) {
  const b = new Uint8Array(bytes);
  let encoding = 'utf-8';
  if (b[0] === 0xff && b[1] === 0xfe) encoding = 'utf-16le';
  if (b[0] === 0xfe && b[1] === 0xff) encoding = 'utf-16be';
  let text;
  try { text = new TextDecoder(encoding, {fatal:true}).decode(b); }
  catch { throw new Error('Không đọc được mã hóa. Hãy chuyển tệp sang UTF-8.'); }
  if (text.includes('\u0000')) throw new Error('Tệp chứa dữ liệu nhị phân hoặc không đúng mã hóa.');
  return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}
export function imageType(bytes) {
  const b = new Uint8Array(bytes);
  const ascii = (a,z) => String.fromCharCode(...b.slice(a,z));
  if (b.length < 12) return null;
  if (b[0]===137 && ascii(1,4)==='PNG' && b[4]===13 && b[5]===10 && b[6]===26 && b[7]===10) return 'image/png';
  if (b[0]===255 && b[1]===216 && b[2]===255) return 'image/jpeg';
  if (/^GIF8[79]a$/.test(ascii(0,6))) return 'image/gif';
  if (ascii(0,4)==='RIFF' && ascii(8,12)==='WEBP') return 'image/webp';
  if (ascii(0,2)==='BM') return 'image/bmp';
  if (ascii(4,8)==='ftyp' && /avif|avis/.test(ascii(8,32))) return 'image/avif';
  return null;
}
export function slugify(text) { return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'') || 'muc'; }
export function diagramAllowed(source) {
  if (source.length > 12000 || source.split('\n').length > 220) return false;
  if (/%%\s*\{|^\s*---|\b(click|href|image|icon|classDef|style|linkStyle)\b|https?:|data:|javascript:/im.test(source)) return false;
  return /^\s*(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|pie|gantt|mindmap|timeline|journey|gitGraph|requirementDiagram|quadrantChart)\b/.test(source);
}
