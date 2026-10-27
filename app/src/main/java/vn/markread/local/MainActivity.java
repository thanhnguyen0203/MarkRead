package vn.markread.local;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.UriPermission;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JsResult;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebMessage;
import android.webkit.WebMessagePort;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Offline application shell. The renderer receives a scoped message port, never a JavaScript interface. */
public final class MainActivity extends Activity {
    private static final int PICK_TREE=41,PICK_FILES=42,SAVE_DOCUMENT=43,PICK_CSS=44;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private WebView web;
    private FrameLayout root;
    private DocumentStore documents;
    private SharedPreferences prefs;
    private WebMessagePort nativePort;
    private String nonce=UUID.randomUUID().toString();
    private boolean destroyed=false,pickerBusy=false,restored=false;
    private int pickerRequest=-1;
    private WebMessagePort pickerPort;
    private ByteArrayOutputStream exportData;
    private String exportToken,exportName;
    private int exportExpected;
    private byte[] pendingSave;
    private String pendingSaveName;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        prefs=getSharedPreferences("scope",MODE_PRIVATE);
        documents=new DocumentStore(getContentResolver());
        root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(32,35,38));setContentView(root);
        configureInsets();
        try {
            PackageInfo provider=WebView.getCurrentWebViewPackage();
            if(provider!=null && Integer.parseInt(provider.versionName.split("\\.")[0])<100){unsupportedWebView();return;}
        } catch(Exception ignored) { }
        createWebView();
    }
    private void configureInsets(){
        if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
        root.setOnApplyWindowInsetsListener((v,insets)->{
            if(Build.VERSION.SDK_INT>=30){Insets x=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.ime());v.setPadding(x.left,x.top,x.right,x.bottom);}
            else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });root.requestApplyInsets();
    }
    private void unsupportedWebView(){TextView t=new TextView(this);t.setTextColor(Color.WHITE);t.setTextSize(18);t.setPadding(32,48,32,32);t.setText("MarkRead cần Android System WebView phiên bản 100 trở lên.\n\nHãy cập nhật Android System WebView trên thiết bị rồi mở lại app. Không cần cấp quyền truy cập toàn bộ bộ nhớ.");root.addView(t);}
    @SuppressWarnings("deprecation") private void createWebView(){
        nonce=UUID.randomUUID().toString();
        web=new WebView(this);web.setBackgroundColor(Color.rgb(32,35,38));
        web.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
        WebView.setWebContentsDebuggingEnabled(false);
        WebSettings s=web.getSettings();
        s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setAllowFileAccessFromFileURLs(false);s.setAllowUniversalAccessFromFileURLs(false);
        s.setBlockNetworkLoads(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setDatabaseEnabled(false);s.setGeolocationEnabled(false);s.setSaveFormData(false);s.setSupportMultipleWindows(false);s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setMediaPlaybackRequiresUserGesture(true);s.setSupportZoom(false);s.setTextZoom(100);
        CookieManager.getInstance().setAcceptCookie(false);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){
                if("GET".equals(request.getMethod())&&Policy.trustedPage(request.getUrl().toString())) {
                    try(InputStream in=getAssets().open("index.html")){
                        ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1)out.write(b,0,n);
                        String html=new String(out.toByteArray(),StandardCharsets.UTF_8).replace("__NATIVE_NONCE__",nonce);
                        Map<String,String> headers=new HashMap<>();headers.put("Cache-Control","no-store");headers.put("X-Content-Type-Options","nosniff");headers.put("Referrer-Policy","no-referrer");
                        return new WebResourceResponse("text/html","UTF-8",200,"OK",headers,new ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8)));
                    }catch(Exception e){return blocked();}
                }
                return blocked();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){
                String url=request.getUrl().toString();return !(Policy.trustedPage(url)||(!request.isForMainFrame()&&("about:blank".equals(url)||"about:srcdoc".equals(url))));
            }
            @Override public void onPageFinished(WebView v,String url){if(Policy.trustedPage(url))installPort();}
            @Override public boolean onRenderProcessGone(WebView v,RenderProcessGoneDetail detail){
                closePort();root.removeView(v);v.destroy();
                if(!destroyed)new AlertDialog.Builder(MainActivity.this).setTitle("Bộ hiển thị đã dừng").setMessage("Có thể thiếu bộ nhớ. Bản sửa chưa lưu có thể đã mất. Mở lại MarkRead?").setPositiveButton("Mở lại",(d,w)->{restored=false;createWebView();}).setNegativeButton("Đóng",(d,w)->finish()).setCancelable(false).show();return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onJsConfirm(WebView v,String url,String message,JsResult result){if(!Policy.trustedPage(url)){result.cancel();return true;}new AlertDialog.Builder(MainActivity.this).setTitle("MarkRead").setMessage(message).setPositiveButton("Xác nhận",(d,w)->result.confirm()).setNegativeButton("Hủy",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}
            @Override public boolean onJsAlert(WebView v,String url,String message,JsResult result){if(!Policy.trustedPage(url)){result.cancel();return true;}new AlertDialog.Builder(MainActivity.this).setTitle("MarkRead").setMessage(message).setPositiveButton("Đóng",(d,w)->result.confirm()).setOnCancelListener(d->result.confirm()).show();return true;}
            @Override public void onPermissionRequest(PermissionRequest request){request.deny();}
            @Override public void onGeolocationPermissionsShowPrompt(String origin,GeolocationPermissions.Callback callback){callback.invoke(origin,false,false);}
            @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){callback.onReceiveValue(null);return true;}
        });
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));web.loadUrl(Policy.ENTRY_URL);
    }
    private static WebResourceResponse blocked(){return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",null,new ByteArrayInputStream(new byte[0]));}
    private void closePort(){if(nativePort!=null){try{nativePort.close();}catch(Exception ignored){}nativePort=null;}}
    private boolean trusted(){return !destroyed&&web!=null&&Policy.trustedPage(web.getUrl());}
    private void installPort(){
        if(!trusted())return;closePort();final WebMessagePort[] channel=web.createWebMessageChannel();nativePort=channel[0];
        channel[0].setWebMessageCallback(new WebMessagePort.WebMessageCallback(){@Override public void onMessage(WebMessagePort port,WebMessage message){
            if(!trusted()||port!=nativePort)return;
            String value=message.getData();if(value==null||value.length()>120000)return;
            try{JSONObject command=new JSONObject(value);final int id=command.getInt("id");if(id<1)return;String op=command.getString("op");JSONObject args=command.optJSONObject("args");handleCommand(port,id,op,args==null?new JSONObject():args);}
            catch(Exception ignored) { }
        }},main);
        web.postWebMessage(new WebMessage("markread-native-init:"+nonce,new WebMessagePort[]{channel[1]}),Uri.parse(Policy.ORIGIN));
    }
    private void reply(WebMessagePort port,int id,Object result,Exception error){
        main.post(()->{if(destroyed)return;try{JSONObject answer=new JSONObject().put("id",id);if(error==null)answer.put("result",result==null?JSONObject.NULL:result);else answer.put("error",errorMessage(error));port.postMessage(new WebMessage(answer.toString()));}catch(Exception ignored){} });
    }
    private static String errorMessage(Exception e){if(e instanceof SecurityException)return "Quyền truy cập không còn hiệu lực. Hãy chọn lại thư mục.";if(e instanceof IOException||e instanceof IllegalArgumentException)return e.getMessage()==null?"Không thực hiện được thao tác.":e.getMessage();return "Không thực hiện được thao tác. Hãy thử chọn lại tệp hoặc thư mục.";}
    private void handleCommand(WebMessagePort port,int id,String op,JSONObject a)throws Exception{
        switch(op){
            case "chooseFolder":launchPicker(port,id,true);return;
            case "chooseFiles":launchPicker(port,id,false);return;
            case "chooseCss":chooseCss(port,id);return;
            case "theme":setThemeColors(a.optString("theme","dark"));reply(port,id,Boolean.TRUE,null);return;
            default:break;
        }
        io.execute(()->{try{
            Object result;
            switch(op){
                case "restore":
                    if(!restored){restored=true;String saved=prefs.getString("tree",null);if(saved!=null){Uri tree=Uri.parse(saved);if(Policy.treeProvider(saved)&&hasReadGrant(tree)){documents.commit(documents.scanTree(tree));}else prefs.edit().remove("tree").apply();}}
                    result=documents.current();break;
                case "index":result=documents.page(a.getString("generation"),a.getInt("offset"),a.getInt("limit"));break;
                case "read":DocumentStore.Chunk c=documents.read(a.getString("fileId"),a.getLong("offset"),a.getInt("length"));result=new JSONObject().put("data",Base64.encodeToString(c.bytes,Base64.NO_WRAP)).put("eof",c.eof);break;
                case "rename":result=documents.rename(a.getString("fileId"),a.getString("name"));break;
                case "forget":documents.clear();releaseAllExcept(null);prefs.edit().remove("tree").apply();result=Boolean.TRUE;break;
                case "beginExport":
                    int size=a.getInt("size");if(size<0||size>Policy.MAX_DOC)throw new IOException("Bản xuất vượt giới hạn 5 MiB.");
                    if(pickerBusy)throw new IOException("Hãy hoàn tất bộ chọn tệp đang mở.");
                    exportData=new ByteArrayOutputStream(Math.min(size,65536));exportExpected=size;exportName=Policy.exportName(a.optString("name"));exportToken=UUID.randomUUID().toString();result=new JSONObject().put("token",exportToken);break;
                case "appendExport":
                    checkExport(a);byte[] b=Base64.decode(a.getString("data"),Base64.DEFAULT);if(b.length>Policy.CHUNK||exportData.size()+b.length>exportExpected)throw new IOException("Dữ liệu xuất không hợp lệ.");exportData.write(b);result=Boolean.TRUE;break;
                case "finishExport":
                    checkExport(a);if(exportData.size()!=exportExpected)throw new IOException("Bản xuất chưa đủ dữ liệu.");
                    byte[] data=exportData.toByteArray();String name=exportName;clearExport();main.post(()->saveDocument(port,id,name,data));return;
                default:throw new IllegalArgumentException("Lệnh không được hỗ trợ.");
            }
            reply(port,id,result,null);
        }catch(Exception e){reply(port,id,null,e);} });
    }
    private void checkExport(JSONObject a)throws Exception{if(exportData==null||exportToken==null||!exportToken.equals(a.optString("token")))throw new IOException("Phiên xuất tệp không hợp lệ.");}
    private void clearExport(){if(exportData!=null)exportData.reset();exportData=null;exportToken=null;exportName=null;exportExpected=0;}
    private boolean hasReadGrant(Uri uri){for(UriPermission p:getContentResolver().getPersistedUriPermissions())if(p.isReadPermission()&&p.getUri().equals(uri))return true;return false;}
    private void releaseAllExcept(Uri keep){for(UriPermission p:getContentResolver().getPersistedUriPermissions()){if(keep!=null&&keep.equals(p.getUri()))continue;try{int flags=(p.isReadPermission()?Intent.FLAG_GRANT_READ_URI_PERMISSION:0)|(p.isWritePermission()?Intent.FLAG_GRANT_WRITE_URI_PERMISSION:0);getContentResolver().releasePersistableUriPermission(p.getUri(),flags);}catch(Exception ignored){}}}
    private void launchPicker(WebMessagePort port,int id,boolean folder){
        if(pickerBusy){reply(port,id,null,new IOException("Hãy hoàn tất bộ chọn tệp đang mở."));return;}
        Intent intent=new Intent(folder?Intent.ACTION_OPEN_DOCUMENT_TREE:Intent.ACTION_OPEN_DOCUMENT);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);intent.putExtra(Intent.EXTRA_LOCAL_ONLY,true);
        if(folder)intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION|Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        else {intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true);}
        pickerBusy=true;pickerRequest=id;pickerPort=port;
        try{startActivityForResult(intent,folder?PICK_TREE:PICK_FILES);}catch(ActivityNotFoundException e){pickerBusy=false;pickerRequest=-1;pickerPort=null;reply(port,id,null,new IOException("Thiết bị không có bộ chọn tài liệu phù hợp."));}
    }
    private void saveDocument(WebMessagePort port,int id,String name,byte[] data){
        if(destroyed)return;if(pickerBusy){reply(port,id,null,new IOException("Hãy hoàn tất bộ chọn tệp đang mở."));return;}
        pendingSave=data;pendingSaveName=name;pickerBusy=true;pickerRequest=id;pickerPort=port;
        Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(name.toLowerCase(java.util.Locale.ROOT).matches(".*\\.(md|markdown)$")?"text/markdown":"text/plain").putExtra(Intent.EXTRA_TITLE,name).putExtra(Intent.EXTRA_LOCAL_ONLY,true);
        try{startActivityForResult(i,SAVE_DOCUMENT);}catch(ActivityNotFoundException e){pendingSave=null;pendingSaveName=null;pickerBusy=false;pickerRequest=-1;pickerPort=null;reply(port,id,null,new IOException("Thiết bị không có hộp lưu tài liệu phù hợp."));}
    }
    private void chooseCss(WebMessagePort port,int id){
        if(pickerBusy){reply(port,id,null,new IOException("Hãy hoàn tất bộ chọn tệp đang mở."));return;}
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);intent.putExtra(Intent.EXTRA_LOCAL_ONLY,true);
        pickerBusy=true;pickerRequest=id;pickerPort=port;
        try{startActivityForResult(intent,PICK_CSS);}catch(ActivityNotFoundException e){pickerBusy=false;pickerRequest=-1;pickerPort=null;reply(port,id,null,new IOException("Thiết bị không có bộ chọn tài liệu phù hợp."));}
    }
    private void replyCancelled(WebMessagePort port,int id){try{reply(port,id,new JSONObject().put("cancelled",true),null);}catch(Exception ignored){}}
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);if(request!=PICK_TREE&&request!=PICK_FILES&&request!=SAVE_DOCUMENT&&request!=PICK_CSS)return;
        final WebMessagePort port=pickerPort;final int id=pickerRequest;pickerBusy=false;pickerPort=null;pickerRequest=-1;
        if(port==null||id<0)return;
        if(result!=RESULT_OK||data==null){pendingSave=null;pendingSaveName=null;replyCancelled(port,id);return;}
        if(request==PICK_CSS){
            final Uri cssUri=data.getData();
            io.execute(()->{try{reply(port,id,documents.importCss(cssUri),null);}catch(Exception e){reply(port,id,null,e);}});return;
        }
        if(request==SAVE_DOCUMENT){
            final Uri uri=data.getData();final byte[] bytes=pendingSave;pendingSave=null;pendingSaveName=null;
            io.execute(()->{try{if(uri==null||bytes==null||!Policy.localDocument(uri.toString()))throw new IOException("Chỉ lưu vào bộ nhớ cục bộ của thiết bị.");try(OutputStream out=getContentResolver().openOutputStream(uri,"wt")){if(out==null)throw new IOException("Không mở được nơi lưu.");out.write(bytes);out.flush();}reply(port,id,new JSONObject().put("saved",true),null);}catch(Exception e){reply(port,id,null,e);} });return;
        }
        final Uri tree=data.getData();final int flags=data.getFlags();final List<Uri> uris=new ArrayList<>();
        if(request==PICK_FILES){ClipData clip=data.getClipData();if(clip!=null){for(int n=0;n<clip.getItemCount();n++)uris.add(clip.getItemAt(n).getUri());}else if(tree!=null)uris.add(tree);}
        io.execute(()->{Uri newGrant=null;int newGrantFlags=0;try{
            DocumentStore.Snapshot next;
            if(request==PICK_TREE){
                if(tree==null||!Policy.treeProvider(tree.toString()))throw new IOException("Hãy chọn thư mục trong Bộ nhớ trong hoặc thẻ nhớ.");
                if((flags&Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)!=0){newGrantFlags=flags&(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);getContentResolver().takePersistableUriPermission(tree,newGrantFlags);newGrant=tree;}
                next=documents.scanTree(tree);
                documents.commit(next);releaseAllExcept(newGrant);if(newGrant!=null)prefs.edit().putString("tree",tree.toString()).apply();else prefs.edit().remove("tree").apply();
            }else{next=documents.scanFiles(uris);documents.commit(next);releaseAllExcept(null);prefs.edit().remove("tree").apply();}
            restored=true;reply(port,id,next.json(),null);
        }catch(Exception e){if(newGrant!=null&&!newGrant.toString().equals(prefs.getString("tree",null)))try{getContentResolver().releasePersistableUriPermission(newGrant,newGrantFlags);}catch(Exception ignored){}reply(port,id,null,e);} });
    }
    @SuppressWarnings("deprecation") private void setThemeColors(String theme){
        boolean light="light".equals(theme)||"sepia".equals(theme)||"tokyo-light".equals(theme);
        String hex;
        switch(theme){
            case "light":hex="#ffffff";break;case "sepia":hex="#f5efdf";break;case "black":hex="#080909";break;
            case "tokyo-night":hex="#1a1b26";break;case "tokyo-light":hex="#e1e2e7";break;case "blue-gray":hex="#263238";break;
            case "nord":hex="#2e3440";break;case "dracula":hex="#282a36";break;case "rose-pine":hex="#191724";break;
            case "forest":hex="#1e2924";break;case "gruvbox":hex="#282828";break;default:hex="#202326";
        }
        int color=Color.parseColor(hex);
        root.setBackgroundColor(color);getWindow().setStatusBarColor(color);getWindow().setNavigationBarColor(color);
        int flags=View.SYSTEM_UI_FLAG_LAYOUT_STABLE;if(light)flags|=View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;getWindow().getDecorView().setSystemUiVisibility(flags);
    }
    @Override public void onBackPressed(){
        if(!trusted()){finish();return;}
        web.evaluateJavascript("window.markReadBack?window.markReadBack():'exit'",value->{if(destroyed)return;if("\"dirty\"".equals(value))new AlertDialog.Builder(this).setTitle("Bản sửa chưa lưu").setMessage("Bạn có bản sửa trong bộ nhớ. Thoát app sẽ mất các bản sửa chưa lưu.").setPositiveButton("Ở lại",(d,w)->{}).setNeutralButton("Lưu bài đang mở",(d,w)->web.evaluateJavascript("window.markReadSave&&window.markReadSave()",null)).setNegativeButton("Thoát, bỏ sửa",(d,w)->finish()).show();else if("\"exit\"".equals(value))finish();});
    }
    @Override protected void onPause(){super.onPause();if(web!=null)web.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){destroyed=true;closePort();io.shutdownNow();clearExport();pendingSave=null;if(web!=null){root.removeView(web);web.destroy();web=null;}super.onDestroy();}
}
