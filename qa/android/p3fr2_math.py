"""Rendered Android WebView math measurements. Fixture only, not desktop simulation."""
from qa.android.p3fr2_core import *
def run():
 ready();command('seedClipboard')
 fixture=json.loads((ROOT/'build/ui-p3fr2/after/math-release/measurements.json').read_text(encoding='utf-8'))['fixture']
 colors=json.loads((ROOT/'build/ui-p3fr2/theme-colors.json').read_text())
 load(fixture,'P3FR2_Math.md');mode('read');rows=[]
 for theme,color in colors.items():
  click('settings');js('document.querySelector("[data-section=appearance]").click()');js('document.querySelector("#themes [data-theme='+theme+']").click()');js('document.querySelector("#settingsDialog .close-dialog").click()')
  rgb='rgb('+', '.join(str(int(color['error'][i:i+2],16)) for i in (1,3,5))+')'
  wait('(()=>{const d=document.getElementById("reader").contentDocument,n=d?.querySelector(".katex-error");return n&&getComputedStyle(d.documentElement).getPropertyValue("--mr-bg").trim()==='+json.dumps(color['bg'])+'&&getComputedStyle(n).color==='+json.dumps(rgb)+'&&d.fonts.status==="loaded"})()',60)
  data=js('''(()=>{const b=document.getElementById('reader').contentDocument.body,k=[...b.querySelectorAll('.katex')],errors=[...b.querySelectorAll('.katex-error')],bg=getComputedStyle(b).backgroundColor,lum=c=>c.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),m=n=>{let color=getComputedStyle(n).color;return {color,contrast:(Math.max(lum(color),lum(bg))+.05)/(Math.min(lum(color),lum(bg))+.05)}},glyph=n=>[...n.querySelectorAll('.katex-html span')].filter(x=>!x.children.length&&x.textContent.trim()).map(m),c=n=>m(n.querySelector('[style*=color]'));return {background:bg,normal:[...glyph(k[0]),...glyph(k[1])],unsupported:[c(k[2]),c(k[3])],parseErrors:errors.map(m),authors:[c(k[4]),c(k[5])],source:document.getElementById('editor').value}})()''')
  row=dict(theme=theme,**data);row['pass']=bool(row['normal']) and len(row['parseErrors'])==2 and all(x['contrast']>=4.5 for x in row['normal']+row['unsupported']+row['parseErrors']) and all(x['color']=='rgb(204, 0, 0)' for x in row['authors']) and row['source']==fixture;rows.append(row)
  (OUT/'math-webview.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print('PASS' if row['pass'] else 'FAIL',theme,flush=True)
  visible();js('document.getElementById("reader").contentWindow.scrollTo(0,0)');screenshot('math-'+theme+'-top');js('(()=>{const w=document.getElementById("reader").contentWindow;w.scrollTo(0,w.document.body.scrollHeight)})()');screenshot('math-'+theme+'-bottom')
  if not row['pass']:raise AssertionError(theme)
 click('settings');js('document.querySelector("[data-section=appearance]").click()');js('document.querySelector("#themes [data-theme=dark]").click()');js('document.querySelector("#settingsDialog .close-dialog").click()')
 print('Android WebView12 themes PASS',flush=True)
if __name__=='__main__':run()
