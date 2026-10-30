// Offline vector-to-PNG export using the existing QA Playwright/Chromium runtime.
// Set NODE_PATH and MARKREAD_CHROMIUM to the already installed QA tools.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const art = path.join(root, 'design/launcher/markread');
const out = path.join(root, 'docs/release/assets/p4a');
const spec = JSON.parse(fs.readFileSync(path.join(art, 'concepts.json'), 'utf8'));
const raw = (id, variant = 'color') => fs.readFileSync(path.join(art, `${id}-${variant}.svg`), 'utf8');
function icon(id, size, mask = 'squircle', mono = false, old = false) {
  let svg = old ? fs.readFileSync(path.join(art, 'previous/icon.svg'), 'utf8') : raw(id, mono ? 'monochrome' : 'color');
  svg = svg.replace('viewBox="0 0 108 108"', 'viewBox="18 18 72 72"').replace('width="108" height="108"', 'width="100%" height="100%"');
  return `<span class="icon ${mask}${mono ? ' mono' : ''}" style="width:${size}px;height:${size}px">${svg}</span>`;
}
const css = `*{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,sans-serif;color:#202326;background:#eee;}
main{width:1248px;padding:48px;background:#F1F2EF}header{display:flex;align-items:end;justify-content:space-between;margin-bottom:32px}h1{font-size:36px;letter-spacing:-1.2px;line-height:1.1;margin:8px 0}h2{font-size:22px;line-height:1.2;margin:0 0 4px}p{margin:0;color:#526057}.eyebrow{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#526057}.chip{border:1px solid #b7c3bb;padding:6px 12px;border-radius:99px;font-size:12px}
.concepts{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.card{background:#fff;padding:24px;border-radius:22px;}.hero{height:208px;display:flex;align-items:center;justify-content:center;background:#e9eeea;border-radius:14px;margin:20px 0}.icon{display:inline-flex;overflow:hidden;flex:none;vertical-align:middle;background:#202326}.icon svg{display:block}.circle{border-radius:50%}.squircle{border-radius:28%}.rounded{border-radius:18%}.square{border-radius:0}.mono{background:#D8EADB}.mono path{fill:#254A38}.dark .mono{background:#344C40}.dark .mono path{fill:#C7EAD5}.small{display:flex;align-items:center;gap:16px;min-height:70px}.sizes{font-size:12px;color:#526057;margin-top:6px}.maskrow{display:flex;align-items:center;gap:18px;margin:16px 0}.label{font-size:12px;color:#526057;margin-top:16px}.light,.dark{padding:24px;border-radius:18px;flex:1}.light{background:#F8F9F6}.dark{background:#15191C;color:#E8ECE9}.dark p,.dark .label{color:#ACB6B0}.panels{display:flex;gap:20px;margin-top:24px}.compare{display:flex;gap:32px;align-items:center}.compare>div{text-align:center}.fine{margin-top:24px;font-size:12px;color:#526057}.footer{margin-top:24px;display:flex;justify-content:space-between;border-top:1px solid #cbd2cc;padding-top:18px}.selection{border:2px solid #557B66}.metric{display:flex;gap:20px;margin-top:24px;padding:20px;background:#fff;border-radius:16px}.metric p{font-size:12px}.metric strong{display:block;font-size:18px;margin-top:4px}`;
function page(content) { return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MarkRead launcher study</title><style>${css}</style>${content}</html>`; }
function header(title, subtitle) { return `<header><div><div class="eyebrow">MarkRead / Quiet Ink</div><h1>${title}</h1><p>${subtitle}</p></div><span class="chip">P4A · Original vector artwork</span></header>`; }
function gallery() {
  return page(`<main>${header('A quiet mark for every page.', 'Three launcher concepts · same palette, canvas and optical scale')}
  <section class="concepts">${spec.concepts.map(c => `<article class="card ${c.id === spec.selected ? 'selection' : ''}"><div class="eyebrow">Concept ${c.id}${c.id === spec.selected ? ' / selected' : ''}</div><h2>${c.name}</h2><div class="hero">${icon(c.id,160)}</div><div class="label">Adaptive mask studies</div><div class="maskrow">${['circle','squircle','rounded'].map(m => icon(c.id,64,m)).join('')}</div><div class="label">Single-color silhouette / system tint simulation</div><div class="maskrow">${icon(c.id,64,'circle',true)}${icon(c.id,48,'squircle',true)}</div><div class="label">Actual CSS sizes, no enlargement</div><div class="small">${[24,32,48,64].map(s => icon(c.id,s)).join('')}</div><div class="sizes">24 / 32 / 48 / 64 px</div></article>`).join('')}</section>
  <div class="footer"><span>Graphite #202326 · Sage #91C7B0</span><span>Preview masks only · Android controls the actual launcher shape</span></div></main>`);
}
function selected() {
  const id=spec.selected;
  return page(`<main>${header('Open Book. Distinct at a glance.', 'Two leaves, a clear spine and one reading line on each page.')}
  <div class="panels"><section class="light"><h2>Light launcher</h2><div class="maskrow">${['circle','squircle','rounded','square'].map(m=>icon(id,104,m)).join('')}</div><div class="label">Themed icon simulation</div><div class="maskrow">${icon(id,80,'circle',true)}${icon(id,80,'squircle',true)}</div></section>
  <section class="dark"><h2>Dark launcher</h2><div class="maskrow">${['circle','squircle','rounded','square'].map(m=>icon(id,104,m)).join('')}</div><div class="label">Themed icon simulation</div><div class="maskrow">${icon(id,80,'circle',true)}${icon(id,80,'squircle',true)}</div></section></div>
  <div class="panels"><section class="light"><h2>Previous / new</h2><div class="compare"><div>${icon(id,120,'circle',false,true)}<p>Previous</p></div><div>${icon(id,120,'circle')}<p>Open Book</p></div></div></section><section class="light"><h2>Small-size review</h2><div class="small">${[24,32,48,64,96].map(s=>icon(id,s)).join('')}</div><p>24 / 32 / 48 / 64 / 96 px</p><div class="small">${[24,32,48,64,96].map(s=>icon(id,s,'circle',true)).join('')}</div></section></div>
  <div class="metric"><div><p>Canvas</p><strong>108 × 108 dp</strong></div><div><p>Critical silhouette</p><strong>50 × ~49 dp</strong></div><div><p>Safe zone</p><strong>Ø66 dp</strong></div><div><p>Palette</p><strong>Graphite / Sage</strong></div></div><p class="fine">Browser vector previews are design evidence. Actual Home / App Drawer / themed-icon screenshots are reported separately.</p></main>`);
}
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({headless:true,executablePath:process.env.MARKREAD_CHROMIUM});
  let network=0;
  try{
    const p=await b.newPage({viewport:{width:1248,height:1100},deviceScaleFactor:1});
    await p.route('**/*',r=>{network++;r.abort();});
    for(const [name,content] of [['concepts',gallery()],['selected',selected()]]){
      fs.writeFileSync(path.join(out,name+'.html'),content);
      await p.setContent(content);await p.locator('main').screenshot({path:path.join(out,name+'.png')});
    }
    // Full-bleed flat square legacy icon; separate circular legacy resource.
    for(const [density,size] of [['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]]){
      for(const [name,mask] of [['ic_launcher','square'],['ic_launcher_round','circle']]){
        await p.setViewportSize({width:size,height:size});
        await p.setContent(page(`<style>body{background:transparent}.icon{display:block}</style>${icon(spec.selected,size,mask)}`));
        const dir=path.join(root,'app/src/main/res','mipmap-'+density);fs.mkdirSync(dir,{recursive:true});
        await p.screenshot({path:path.join(dir,name+'.png'),omitBackground:true});
      }
    }
    const geometry=await p.evaluate(concepts=>concepts.map(c=>{
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1080;
      const ctx=canvas.getContext('2d');ctx.scale(10,10);
      for(const d of c.paths)ctx.fill(new Path2D(d),'evenodd');
      const pixels=ctx.getImageData(0,0,1080,1080).data;
      let left=1080,right=0,top=1080,bottom=0,maxRadius=0,painted=0;
      for(let y=0;y<1080;y++)for(let x=0;x<1080;x++)if(pixels[(y*1080+x)*4+3]>127){
        painted++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
        maxRadius=Math.max(maxRadius,Math.hypot((x+.5)/10-54,(y+.5)/10-54));
      }
      return {id:c.id,bounds:[left/10,top/10,(right+1)/10,(bottom+1)/10],width:(right-left+1)/10,height:(bottom-top+1)/10,maxRadius,painted};
    }),spec.concepts);
    if(geometry.some(c=>c.maxRadius>33))throw Error('Concept escapes central 66dp safe circle: '+JSON.stringify(geometry));
    const selectedGeometry=geometry.find(c=>c.id===spec.selected);
    if(selectedGeometry.width<48||selectedGeometry.height<48)throw Error('Selected logo below 48dp');
    if(network)throw Error('Unexpected network request during rendering');
    fs.writeFileSync(path.join(out,'geometry.json'),JSON.stringify({canvas:108,safeRadius:33,networkRequests:network,concepts:geometry},null,2)+'\n');
    console.log('Rendered 2 preview sheets + 10 density PNGs; network requests: '+network);
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
