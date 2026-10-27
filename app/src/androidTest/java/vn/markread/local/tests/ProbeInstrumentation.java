package vn.markread.local.tests;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.webkit.WebView;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Disposable-emulator integration probe. Never shipped in the production APK. */
public final class ProbeInstrumentation extends Instrumentation {
 private Activity activity;private WebView web;private int checks=0;private final List<Uri> created=new ArrayList<>();
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 private void ok(boolean b,String name)throws Exception{if(!b)throw new AssertionError(name);checks++;Bundle x=new Bundle();x.putString("test",name);sendStatus(0,x);}
 private String js(String source)throws Exception{CountDownLatch done=new CountDownLatch(1);AtomicReference<String> value=new AtomicReference<>();runOnMainSync(()->web.evaluateJavascript(source,s->{value.set(s);done.countDown();}));if(!done.await(120,TimeUnit.SECONDS))throw new Exception("JavaScript callback timed out");return value.get();}
 private void waitJS(String expr,String name)throws Exception{long end=System.currentTimeMillis()+180000;while(System.currentTimeMillis()<end){if("true".equals(js("Boolean("+expr+")"))){ok(true,name);return;}Thread.sleep(300);}throw new Exception("Timeout: "+name+" last="+js(expr));}
 private Uri makeFile(String name,String text)throws Exception{
  ContentValues v=new ContentValues();v.put(MediaStore.Downloads.DISPLAY_NAME,name);v.put(MediaStore.Downloads.MIME_TYPE,name.endsWith(".css")?"text/css":"text/markdown");v.put(MediaStore.Downloads.RELATIVE_PATH,"Download/MarkReadTest");v.put(MediaStore.Downloads.IS_PENDING,1);
  Uri uri=getTargetContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,v);if(uri==null)throw new Exception("Cannot create fixture");created.add(uri);
  try(OutputStream out=getTargetContext().getContentResolver().openOutputStream(uri)){out.write(text.getBytes(StandardCharsets.UTF_8));}
  v.clear();v.put(MediaStore.Downloads.IS_PENDING,0);getTargetContext().getContentResolver().update(uri,v,null,null);return uri;
 }
 private String read(Uri uri)throws Exception{try(InputStream in=getTargetContext().getContentResolver().openInputStream(uri)){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);return new String(out.toByteArray(),StandardCharsets.UTF_8);}}
 @Override public void onStart(){Bundle result=new Bundle();try{
  PackageInfo p=getTargetContext().getPackageManager().getPackageInfo("vn.markread.local",android.content.pm.PackageManager.GET_PERMISSIONS);
  ok(p.requestedPermissions==null||p.requestedPermissions.length==0,"production manifest has zero requested permissions");
  ok((p.applicationInfo.flags&ApplicationInfo.FLAG_DEBUGGABLE)==0,"production APK is not debuggable");
  ok((p.applicationInfo.flags&ApplicationInfo.FLAG_ALLOW_BACKUP)==0,"Android backup disabled");
  Intent launch=new Intent().setClassName("vn.markread.local","vn.markread.local.MainActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
  activity=startActivitySync(launch);waitForIdleSync();java.lang.reflect.Field field=activity.getClass().getDeclaredField("web");field.setAccessible(true);web=(WebView)field.get(activity);ok(web!=null,"WebView created");
  runOnMainSync(()->{if(web.getSettings().getAllowFileAccess()||web.getSettings().getAllowContentAccess()||!web.getSettings().getBlockNetworkLoads())throw new AssertionError("WebView boundary");});ok(true,"file/content and network access disabled in WebView");
  waitJS("typeof window.markReadBack==='function'","JavaScript application booted");
  waitJS("document.getElementById('reader').contentDocument.querySelectorAll('.katex').length===3","KaTeX renders inside Android WebView");
  waitJS("document.getElementById('reader').contentDocument.querySelectorAll('.diagram svg').length===1","Mermaid renders inside Android WebView");
  ok("false".equals(js("Boolean(window.Native || window.Android)")),"no JavaScriptInterface exported");
  js("document.getElementById('settings').click();document.querySelector('#themes [data-theme=sepia]').click()");waitJS("document.body.dataset.theme==='sepia'","theme switch works");js("document.querySelector('#themes [data-theme=dark]').click();document.querySelector('#settingsDialog .close-dialog').click()");
  ok("12".equals(js("document.querySelectorAll('#themes button').length")),"12 theme options available");
  ok("0".equals(js("document.querySelectorAll('footer,.sidebar-bottom,#zoomIn,#zoomOut').length")),"old sidebar strip and footer removed");
  ok("1".equals(js("document.querySelectorAll('#settings svg').length")),"small gear icon replaces Aa");
  js("document.getElementById('settings').click();document.querySelector('[data-section=typography]').click();document.getElementById('font').click();document.querySelector('[data-font=merriweather]').click()");
  waitJS("!document.getElementById('section-typography').hidden && document.getElementById('section-appearance').hidden","settings show one section at a time");
  waitJS("document.getElementById('reader').contentDocument.body && document.getElementById('reader').contentDocument.fonts.check('18px Merriweather') && getComputedStyle(document.getElementById('reader').contentDocument.body).fontFamily.includes('Merriweather')","bundled Merriweather loads on Android");
  js("document.querySelector('[data-section=appearance]').click();document.querySelector('#themes [data-theme=tokyo-light]').click()");waitJS("document.body.dataset.theme==='tokyo-light'","Tokyo Night Light works");
  js("document.querySelector('#themes [data-theme=blue-gray]').click();document.querySelector('#settingsDialog .close-dialog').click()");
  ok("0".equals(js("document.querySelectorAll('#themes .swatch').length")),"theme tiles have no miniature swatches");
  ok("3".equals(js("document.querySelectorAll('#settingsDialog input[role=switch]').length")),"all three boolean settings use accessible switches");
  ok("true".equals(js("Math.abs(document.getElementById('filename').getBoundingClientRect().top-document.getElementById('settings').getBoundingClientRect().top)<14")),"title and toolbar share one row on Android");
  ok("false".equals(js("document.body.textContent.includes('Chỉ sửa trong bộ nhớ · tải xuống để lưu')")),"source memory caption removed");
  js("document.getElementById('settings').click();document.querySelector('[data-section=general]').click()");
  ok("true".equals(js("document.getElementById('settingsDialog').getBoundingClientRect().height<520")),"short settings section wraps its content on Android");
  js("document.querySelector('#settingsDialog .close-dialog').click()");
  ok("0".equals(js("document.querySelectorAll('#modeToggle,#focus,.brand button,select').length")),"removed overflow and focus mode; font picker is themed");
  js("window.__sourceBeforeSearch=document.getElementById('editor').value;document.getElementById('editor').value='# Search\\n\\nXác suất XÁC SUẤT xác suất. Item-12 Item-34';document.getElementById('editor').dispatchEvent(new Event('input'));document.getElementById('findToggle').click();document.getElementById('findInput').value='xác suất';document.getElementById('findInput').dispatchEvent(new Event('input'))");
  waitJS("document.getElementById('findCount').textContent==='1/3'","regex worker starts within offline Android WebView");
  js("document.getElementById('findCase').click()");waitJS("document.getElementById('findCount').textContent==='1/1'","Android case-sensitive search");
  js("document.getElementById('findCase').click();document.getElementById('replaceInput').value='kiến thức'");waitJS("document.getElementById('findCount').textContent==='1/3'","Android insensitive search restored");
  js("document.getElementById('replaceOne').click()");waitJS("document.getElementById('findCount').textContent==='1/2'","Android replace-one updates source");
  js("document.getElementById('replaceAll').click()");waitJS("document.getElementById('editor').value.includes('kiến thức kiến thức kiến thức')","Android replace-all preserves Vietnamese text");
  js("document.getElementById('findRegex').click();document.getElementById('findInput').value='Item-(\\\\d+)';document.getElementById('findInput').dispatchEvent(new Event('input'));document.getElementById('replaceInput').value='Số $1'");
  waitJS("document.getElementById('findCount').textContent==='1/2'","Android regex capture search");js("document.getElementById('replaceAll').click()");waitJS("document.getElementById('editor').value.includes('Số 12 Số 34')","Android regex capture replacement");
  js("document.getElementById('findInput').value='[';document.getElementById('findInput').dispatchEvent(new Event('input'))");waitJS("document.getElementById('findError').textContent.includes('regex') && document.getElementById('replaceAll').disabled","Android invalid regex does not modify source");
  js("document.getElementById('findClose').click();document.getElementById('editor').value=window.__sourceBeforeSearch;document.getElementById('editor').dispatchEvent(new Event('input'))");
  final String sample="# Native smoke\n\nTiếng Việt: xác suất, phương sai.\n\n$x^2+1$\n\n![Remote](https://example.invalid/track)\n";
  final Uri input=makeFile("NativeSmoke.md",sample);
  final boolean[] readWrite={false};
  ActivityMonitor open=new ActivityMonitor(){@Override public ActivityResult onStartActivity(Intent i){if(Intent.ACTION_OPEN_DOCUMENT.equals(i.getAction())){readWrite[0]=(i.getFlags()&Intent.FLAG_GRANT_WRITE_URI_PERMISSION)!=0&&i.getBooleanExtra(Intent.EXTRA_LOCAL_ONLY,false);return new ActivityResult(Activity.RESULT_OK,new Intent().setData(input).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));}return null;}};
  addMonitor(open);js("document.getElementById('openFiles').click()");
  waitJS("document.getElementById('reader').contentDocument.querySelector('h1')?.textContent==='Native smoke'","native picker result, scope index, chunk read and Markdown render");removeMonitor(open);ok(readWrite[0],"picker requests local-only scoped read/write access");
  ok("1".equals(js("document.getElementById('files').querySelectorAll('.file-row').length")),"only selected Markdown indexed");
  ok("1".equals(js("document.getElementById('reader').contentDocument.querySelectorAll('.blocked-image').length")),"remote image blocked on Android");
  js("document.getElementById('editMode').click();document.getElementById('editor').value='# Saved from Android\\n\\nBản sửa tiếng Việt.';document.getElementById('editor').dispatchEvent(new Event('input'))");
  final Uri output=makeFile("NativeExport.md","");
  ActivityMonitor save=new ActivityMonitor(){@Override public ActivityResult onStartActivity(Intent i){if(Intent.ACTION_CREATE_DOCUMENT.equals(i.getAction()))return new ActivityResult(Activity.RESULT_OK,new Intent().setData(output).addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION));return null;}};
  addMonitor(save);js("document.getElementById('download').click()");waitJS("document.getElementById('toast').textContent.includes('Đã lưu bản Markdown')","native export completes");removeMonitor(save);
  ok(read(output).equals("# Saved from Android\n\nBản sửa tiếng Việt."),"native export bytes match UTF-8 source exactly");
  js("document.getElementById('readMode').click();document.getElementById('settings').click();document.querySelector('[data-section=editing]').click();document.getElementById('unifiedEnabled').click();document.querySelector('#settingsDialog .close-dialog').click()");
  waitJS("document.getElementById('reader').contentDocument.querySelectorAll('.md-block').length>0","unified mode renders editable blocks");
  ok("true".equals(js("getComputedStyle(document.getElementById('editMode')).display==='none'")),"unified mode hides separate source tab");
  js("document.getElementById('reader').contentDocument.querySelector('h1').click()");waitJS("document.getElementById('reader').contentDocument.querySelector('.block-source')","tap heading opens its source block");
  js("var t=document.getElementById('reader').contentDocument.querySelector('.block-source');t.value='# Đổi rồi hủy\\n';t.dispatchEvent(new Event('input'));document.getElementById('reader').contentDocument.querySelector('.inline-tools button').click()");
  waitJS("document.getElementById('reader').contentDocument.querySelector('h1')?.textContent==='Saved from Android'","cancel restores original block");
  js("document.getElementById('reader').contentDocument.querySelector('h1').click();var t=document.getElementById('reader').contentDocument.querySelector('.block-source');t.value='# Hợp nhất tiếng Việt\\n';t.dispatchEvent(new Event('input'));document.getElementById('reader').contentDocument.querySelectorAll('.inline-tools button')[1].click()");
  waitJS("document.getElementById('reader').contentDocument.querySelector('h1')?.textContent==='Hợp nhất tiếng Việt'","committed block returns to rendered view");
  ok("true".equals(js("document.getElementById('editor').value==='# Hợp nhất tiếng Việt\\n\\nBản sửa tiếng Việt.'")),"unified edit preserves surrounding source");
  js("document.getElementById('settings').click();document.getElementById('unifiedEnabled').click();document.querySelector('#settingsDialog .close-dialog').click()");
  waitJS("getComputedStyle(document.getElementById('editMode')).display!=='none'","disabling unified restores separate modes");
  final String malicious="# An toàn\n\n<script>document.body.innerHTML='PWNED'</script>\n\n<img src=\"https://example.invalid/x\" onerror=\"alert(1)\">\n<iframe src=\"https://example.invalid\"></iframe>\n\nVẫn đọc được.";
  js("document.getElementById('editor').value="+JSONObject.quote(malicious)+";document.getElementById('editor').dispatchEvent(new Event('input'));document.getElementById('readMode').click()");waitJS("document.getElementById('reader').contentDocument.querySelector('h1')?.textContent==='An toàn'","malicious input still renders safe text");
  ok("0".equals(js("document.getElementById('reader').contentDocument.querySelectorAll('script,iframe,form,[onerror],[onload]').length")),"scripts, iframe and event handlers removed on Android");
  ok("true".equals(js("document.getElementById('reader').sandbox.value==='allow-same-origin'")),"reader sandbox does not allow scripts");
  js("document.getElementById('editor').value="+JSONObject.quote(sample)+";document.getElementById('editor').dispatchEvent(new Event('input'))");
  waitJS("document.getElementById('dirty').textContent===''","returning to original clears current dirty marker");
  ActivityMonitor empty=new ActivityMonitor(){@Override public ActivityResult onStartActivity(Intent i){if(Intent.ACTION_OPEN_DOCUMENT.equals(i.getAction()))return new ActivityResult(Activity.RESULT_OK,new Intent());return null;}};
  addMonitor(empty);js("document.getElementById('openFiles').click()");waitJS("document.getElementById('files').querySelectorAll('.file-row').length===0 && document.getElementById('filename').textContent==='Chào mừng.md'","empty newly selected scope removes previously loaded files");removeMonitor(empty);
  js("document.getElementById('forget').click()");waitJS("document.getElementById('files').querySelectorAll('.file-row').length===0","forget clears current file scope");
  final Uri css=makeFile("ExternalStyle.css","h1 { color: #123456; }");
  ActivityMonitor cssPicker=new ActivityMonitor(){@Override public ActivityResult onStartActivity(Intent i){if(Intent.ACTION_OPEN_DOCUMENT.equals(i.getAction())){try{ok(i.getBooleanExtra(Intent.EXTRA_LOCAL_ONLY,false)&&!i.getBooleanExtra(Intent.EXTRA_ALLOW_MULTIPLE,false),"CSS has an independent local single-file picker");}catch(Exception e){throw new RuntimeException(e);}return new ActivityResult(Activity.RESULT_OK,new Intent().setData(css).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));}return null;}};
  addMonitor(cssPicker);js("document.getElementById('settings').click();document.querySelector('[data-section=css]').click();document.getElementById('importCSS').click()");
  waitJS("document.getElementById('customCSS').value.includes('#123456')","Android CSS import reads a real file outside current scope");removeMonitor(cssPicker);
  ok("0".equals(js("document.querySelectorAll('.file-row').length")),"CSS import does not replace or expand document scope");
  js("document.getElementById('applyCSS').click();document.querySelector('#settingsDialog .close-dialog').click()");waitJS("getComputedStyle(document.getElementById('reader').contentDocument.querySelector('h1')).color==='rgb(18, 52, 86)'","Android applies independently imported CSS");
  // Real provider rename needs a picker-issued write grant; do not mint a URI
  // and treat shell fixture creation as authorization. Covered separately by
  // UI simulation; verify a real SAF-granted folder on a device before claiming it.
  result.putString("stream","Android WebView integration: "+checks+" checks passed\n");result.putInt("passed",checks);finish(Activity.RESULT_OK,result);
 }catch(Throwable e){Throwable cause=e instanceof java.lang.reflect.InvocationTargetException?e.getCause():e;result.putString("stream","FAIL after "+checks+" checks: "+cause.toString()+"\n");finish(Activity.RESULT_CANCELED,result);}finally{
  for(Uri uri:created)try{getTargetContext().getContentResolver().delete(uri,null,null);}catch(Exception ignored){}
 }}
}
