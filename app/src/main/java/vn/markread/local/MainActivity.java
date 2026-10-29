package vn.markread.local;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.UriPermission;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Base64;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.view.ContextThemeWrapper;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
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
import android.webkit.WebResourceError;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import org.json.JSONObject;
import org.json.JSONArray;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private SharedPreferences appearance;
    private WebMessagePort nativePort;
    private String nonce=UUID.randomUUID().toString();
    private String sessionToken=UUID.randomUUID().toString();
    private boolean destroyed=false,pickerBusy=false,restored=false;
    private boolean resumeRecent=false,expiryPending=false;
    private long backgroundAt=0;
    private int pickerRequest=-1;
    private WebMessagePort pickerPort;
    private ByteArrayOutputStream exportData;
    private String exportToken,exportName;
    private int exportExpected;
    private byte[] pendingSave;
    private String pendingSaveName;
    private int themeBackground=Color.rgb(32,35,38);
    private NativeUiPolicy.Theme nativeTheme=NativeUiPolicy.theme("dark");
    private final NativeUiPolicy.PageState pageState=new NativeUiPolicy.PageState();
    private final Set<AlertDialog> nativeDialogs=new HashSet<>();
    private long pageToken,backSerial;
    private boolean backPending;
    private Runnable startupCheck,probeTimeout,backTimeout;
    private View nativeFallback;
    private int webAccessibility=View.IMPORTANT_FOR_ACCESSIBILITY_AUTO;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        prefs=getSharedPreferences("scope",MODE_PRIVATE);
        appearance=getSharedPreferences("appearance",MODE_PRIVATE);
        resumeRecent=SessionPolicy.recent(System.currentTimeMillis(),prefs.getLong("leftAt",0));
        documents=new DocumentStore(getContentResolver());
        root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(32,35,38));setContentView(root);
        try{setThemeColors(new JSONObject(appearance.getString("settings","{}")).optString("theme","dark"));}catch(Exception ignored){}
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
            if(Build.VERSION.SDK_INT>=30){Insets x=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.ime()|WindowInsets.Type.displayCutout());v.setPadding(x.left,x.top,x.right,x.bottom);}
            else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });root.requestApplyInsets();
    }
    private void unsupportedWebView(){showFallback("Cập nhật Android System WebView","MarkRead cần Android System WebView phiên bản 100 trở lên.\n\nHãy cập nhật Android System WebView trên thiết bị rồi mở lại app. Không cần cấp quyền truy cập toàn bộ bộ nhớ.",false,false);}
    private void createWebView(){
        // Initial load or an explicit recovery button only. Keep an already-restored document scope.
        if(destroyed)return;hideFallback();disposeWebView(web);pageToken=pageState.begin();
        try{createWebView(pageToken);}catch(RuntimeException|LinkageError error){disposeWebView(web);showFallback("Không mở được MarkRead","Không khởi tạo được bộ hiển thị WebView trên thiết bị. Bạn có thể thử khởi động lại giao diện hoặc cập nhật Android System WebView.",true,false);}
    }
    @SuppressWarnings("deprecation") private void createWebView(final long token){
        final String pageNonce=UUID.randomUUID().toString();nonce=pageNonce;
        // Capture one immutable settings snapshot for this page, before it can paint.
        String savedAppearance=appearance.getString("settings",null),encodedAppearance="";
        try{if(savedAppearance!=null&&savedAppearance.length()<=110000)encodedAppearance=Base64.encodeToString(new JSONObject(savedAppearance).toString().getBytes(StandardCharsets.UTF_8),Base64.NO_WRAP);}catch(Exception ignored){}
        final String initialAppearance=encodedAppearance;
        final String initialBackground=String.format(java.util.Locale.ROOT,"#%06x",themeBackground&0xffffff);
        final String initialReducedMotion=Boolean.toString(readReducedMotion());
        web=new WebView(this);web.setBackgroundColor(themeBackground);web.setDefaultFocusHighlightEnabled(false);
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
                        String html=new String(out.toByteArray(),StandardCharsets.UTF_8).replace("__NATIVE_NONCE__",pageNonce).replace("__NATIVE_APPEARANCE__",initialAppearance).replace("__STARTUP_BACKGROUND__",initialBackground).replace("__NATIVE_REDUCED_MOTION__",initialReducedMotion);
                        Map<String,String> headers=new HashMap<>();headers.put("Cache-Control","no-store");headers.put("X-Content-Type-Options","nosniff");headers.put("Referrer-Policy","no-referrer");
                        return new WebResourceResponse("text/html","UTF-8",200,"OK",headers,new ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8)));
                    }catch(Exception e){if(request.isForMainFrame())main.post(()->{if(v==web&&pageState.current(token))showFallback("Không tải được giao diện","Không đọc được giao diện ngoại tuyến đã đóng gói. Bạn có thể thử khởi động lại giao diện.",true,false);});return blocked();}
                }
                return blocked();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){
                String url=request.getUrl().toString();return !(Policy.trustedPage(url)||(!request.isForMainFrame()&&("about:blank".equals(url)||"about:srcdoc".equals(url))));
            }
            @Override public void onPageFinished(WebView v,String url){if(v!=web||!pageState.current(token)||!Policy.trustedPage(url))return;try{installPort();scheduleStartupCheck(v,token);}catch(RuntimeException error){showFallback("Kênh Android chưa sẵn sàng","Không thiết lập được kết nối nội bộ giữa Android và giao diện. Không có dữ liệu nào được gửi ra mạng.",true,false);}}
            @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError error){if(v==web&&pageState.current(token)&&request.isForMainFrame())showFallback("Không tải được giao diện","Bộ hiển thị không tải được giao diện ngoại tuyến. Bạn có thể thử khởi động lại giao diện.",true,false);}
            @Override public void onReceivedHttpError(WebView v,WebResourceRequest request,WebResourceResponse response){if(v==web&&pageState.current(token)&&request.isForMainFrame()&&response.getStatusCode()>=400)showFallback("Không tải được giao diện","Tài nguyên giao diện nội bộ không sẵn sàng. Bạn có thể thử khởi động lại giao diện.",true,false);}
            @Override public boolean onRenderProcessGone(WebView v,RenderProcessGoneDetail detail){
                boolean current=v==web;disposeWebView(v);
                if(current&&!destroyed)showFallback("Bộ hiển thị đã dừng","Android đã kết thúc bộ hiển thị. Bản sửa chưa xuất trong bộ nhớ có thể đã mất. Bạn có thể mở lại giao diện; tệp gốc không bị ghi đè.",true,false);return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onJsConfirm(WebView v,String url,String message,JsResult result){if(v!=web||!pageState.current(token)||!Policy.trustedPage(url)){result.cancel();return true;}showNativeDialog(dialogBuilder().setTitle("MarkRead").setMessage(message).setPositiveButton("Xác nhận",(d,w)->result.confirm()).setNegativeButton("Hủy",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()));return true;}
            @Override public boolean onJsAlert(WebView v,String url,String message,JsResult result){if(v!=web||!pageState.current(token)||!Policy.trustedPage(url)){result.cancel();return true;}showNativeDialog(dialogBuilder().setTitle("MarkRead").setMessage(message).setPositiveButton("Đóng",(d,w)->result.confirm()).setOnCancelListener(d->result.confirm()));return true;}
            @Override public void onPermissionRequest(PermissionRequest request){request.deny();}
            @Override public void onGeolocationPermissionsShowPrompt(String origin,GeolocationPermissions.Callback callback){callback.invoke(origin,false,false);}
            @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){callback.onReceiveValue(null);return true;}
        });
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));web.loadUrl(Policy.ENTRY_URL);
        scheduleStartupCheck(web,token);
    }
    private static WebResourceResponse blocked(){return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",null,new ByteArrayInputStream(new byte[0]));}
    private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private AlertDialog.Builder dialogBuilder(){return new AlertDialog.Builder(new ContextThemeWrapper(this,nativeTheme.light?android.R.style.Theme_Material_Light_Dialog_Alert:android.R.style.Theme_Material_Dialog_Alert));}
    private void styleDialog(AlertDialog dialog){
        if(dialog.getWindow()!=null)dialog.getWindow().setBackgroundDrawable(new ColorDrawable(nativeTheme.surface));
        TextView message=dialog.findViewById(android.R.id.message);if(message!=null)message.setTextColor(nativeTheme.text);
        int titleId=getResources().getIdentifier("alertTitle","id","android");TextView title=titleId==0?null:dialog.findViewById(titleId);if(title!=null)title.setTextColor(nativeTheme.text);
        for(int id:new int[]{AlertDialog.BUTTON_POSITIVE,AlertDialog.BUTTON_NEGATIVE,AlertDialog.BUTTON_NEUTRAL}){Button button=dialog.getButton(id);if(button!=null){button.setTextColor(nativeTheme.accent);button.setMinHeight(dp(48));}}
    }
    private void showNativeDialog(AlertDialog.Builder builder){
        if(destroyed||isFinishing())return;
        AlertDialog dialog=builder.create();nativeDialogs.add(dialog);dialog.setOnDismissListener(d->nativeDialogs.remove(dialog));dialog.show();styleDialog(dialog);
    }
    private void closeNativeDialogs(){for(AlertDialog dialog:new ArrayList<>(nativeDialogs))dialog.cancel();nativeDialogs.clear();}
    private TextView fallbackText(LinearLayout layout,String text,int size){
        TextView view=new TextView(this);view.setText(text);view.setTextColor(nativeTheme.text);view.setTextSize(TypedValue.COMPLEX_UNIT_SP,size);view.setPadding(0,0,0,dp(16));layout.addView(view,new LinearLayout.LayoutParams(-1,-2));return view;
    }
    private void fallbackButton(LinearLayout layout,String label,Runnable action){
        Button button=new Button(new ContextThemeWrapper(this,nativeTheme.light?android.R.style.Theme_Material_Light_NoActionBar:android.R.style.Theme_Material_NoActionBar));
        button.setText(label);button.setAllCaps(false);button.setTextColor(nativeTheme.accent);button.setTextSize(TypedValue.COMPLEX_UNIT_SP,16);button.setMinHeight(dp(48));button.setMinimumHeight(dp(48));
        button.setSingleLine(false);button.setBackgroundTintList(ColorStateList.valueOf(nativeTheme.surface));button.setOnClickListener(v->action.run());
        LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2);params.topMargin=dp(8);layout.addView(button,params);
    }
    private void showFallback(String title,String message,boolean retry,boolean canWait){
        if(destroyed||isFinishing())return;cancelStartupCheck();cancelBack();closeNativeDialogs();hideFallback();
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);scroll.setBackgroundColor(nativeTheme.background);scroll.setFocusableInTouchMode(true);if(Build.VERSION.SDK_INT>=28)scroll.setAccessibilityPaneTitle(title);
        LinearLayout content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);content.setPadding(dp(24),dp(24),dp(24),dp(24));scroll.addView(content,new ScrollView.LayoutParams(-1,-2));
        TextView heading=fallbackText(content,title,22);if(Build.VERSION.SDK_INT>=28)heading.setAccessibilityHeading(true);fallbackText(content,message,16);
        if(canWait&&web!=null)fallbackButton(content,"Tiếp tục chờ",()->{hideFallback();scheduleStartupCheck(web,pageToken);});
        if(retry){fallbackText(content,"Khởi động lại giao diện sẽ bỏ các bản sửa chưa xuất trong bộ nhớ. Tệp gốc không bị ghi đè.",16);fallbackButton(content,"Khởi động lại giao diện",()->{if(!pickerBusy)createWebView();else showNativeDialog(dialogBuilder().setTitle("Bộ chọn tài liệu đang mở").setMessage("Hãy hoàn tất hoặc hủy bộ chọn tài liệu trước khi khởi động lại giao diện.").setPositiveButton("Đóng",null));});}
        fallbackButton(content,"Đóng MarkRead",this::finish);
        nativeFallback=scroll;if(web!=null){webAccessibility=web.getImportantForAccessibility();web.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);}
        root.addView(scroll,new FrameLayout.LayoutParams(-1,-1));scroll.requestFocus();
    }
    private void hideFallback(){if(nativeFallback!=null){root.removeView(nativeFallback);nativeFallback=null;if(web!=null)web.setImportantForAccessibility(webAccessibility);}}
    private void styleFallback(View view){
        if(view instanceof Button){Button button=(Button)view;button.setTextColor(nativeTheme.accent);button.setBackgroundTintList(ColorStateList.valueOf(nativeTheme.surface));}
        else if(view instanceof TextView)((TextView)view).setTextColor(nativeTheme.text);
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++)styleFallback(group.getChildAt(i));}
    }
    private void cancelStartupCheck(){if(startupCheck!=null)main.removeCallbacks(startupCheck);if(probeTimeout!=null)main.removeCallbacks(probeTimeout);startupCheck=null;probeTimeout=null;pageState.cancelProbe();}
    private void scheduleStartupCheck(WebView view,long token){
        // One bounded sample of the existing startup contract, never a periodic document poll/reload.
        cancelStartupCheck();if(view==null||nativeFallback!=null||!pageState.needsProbe(token))return;
        startupCheck=()->{
            startupCheck=null;if(view!=web||!pageState.needsProbe(token)||nativeFallback!=null)return;
            final long ticket=pageState.nextProbe();
            probeTimeout=()->{probeTimeout=null;if(view==web&&pageState.acceptsProbe(token,ticket))startupUnavailable();};
            main.postDelayed(probeTimeout,NativeUiPolicy.PROBE_TIMEOUT_MS);
            try{view.evaluateJavascript(NativeUiPolicy.READY_SCRIPT,value->{
                if(view!=web||!pageState.acceptsProbe(token,ticket))return;
                if(probeTimeout!=null)main.removeCallbacks(probeTimeout);probeTimeout=null;
                if("true".equals(value)){pageState.markReady(token);}else startupUnavailable();
            });}catch(RuntimeException error){startupUnavailable();}
        };main.postDelayed(startupCheck,NativeUiPolicy.STARTUP_TIMEOUT_MS);
    }
    private void startupUnavailable(){showFallback("Giao diện chưa sẵn sàng","Giao diện hoặc kênh Android chưa phản hồi. Trên thiết bị chậm, bạn có thể tiếp tục chờ. MarkRead không tự tải lại để tránh bỏ bản sửa trong bộ nhớ.",true,true);}
    private void cancelBack(){if(backTimeout!=null)main.removeCallbacks(backTimeout);backTimeout=null;backPending=false;backSerial++;}
    private void disposeWebView(WebView view){
        if(view==null)return;
        if(view==web){cancelStartupCheck();cancelBack();closeNativeDialogs();closePort();web=null;pageState.invalidate();}
        root.removeView(view);view.destroy();
    }
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
        notifyExpiry();
    }
    private void reply(WebMessagePort port,int id,Object result,Exception error){
        main.post(()->{if(destroyed)return;try{JSONObject answer=new JSONObject().put("id",id);if(error==null)answer.put("result",result==null?JSONObject.NULL:result);else answer.put("error",errorMessage(error));port.postMessage(new WebMessage(answer.toString()));}catch(Exception ignored){} });
    }
    private static String errorMessage(Exception e){return NativeUiPolicy.errorMessage(e);}
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
                case "loadPreferences":
                    String savedAppearance=appearance.getString("settings",null);
                    try{result=savedAppearance==null?JSONObject.NULL:new JSONObject(savedAppearance);}catch(Exception invalid){appearance.edit().remove("settings").apply();result=JSONObject.NULL;}
                    break;
                case "savePreferences":
                    JSONObject settings=a.getJSONObject("settings");String savedSettings=settings.toString();
                    if(savedSettings.length()>110000)throw new IOException("Cài đặt vượt giới hạn dung lượng.");
                    if(!appearance.edit().putString("settings",savedSettings).commit())throw new IOException("Không lưu được cài đặt.");
                    result=Boolean.TRUE;break;
                case "rememberDocument":
                    if(!sessionToken.equals(a.optString("sessionToken"))){result=Boolean.FALSE;break;}
                    String fileId=a.optString("fileId","");String activeUri=fileId.isEmpty()?"":documents.find(fileId).uri.toString();
                    if(!prefs.edit().putString("activeUri",activeUri).commit())throw new IOException("Không lưu được phiên đọc.");
                    result=Boolean.TRUE;break;
                case "restore":
                    if(!restored){restoreScope();restored=true;}
                    result=scopeSummary();break;
                case "index":result=documents.page(a.getString("generation"),a.getInt("offset"),a.getInt("limit"));break;
                case "read":DocumentStore.Chunk c=documents.read(a.getString("fileId"),a.getLong("offset"),a.getInt("length"));result=new JSONObject().put("data",Base64.encodeToString(c.bytes,Base64.NO_WRAP)).put("eof",c.eof);break;
                case "rename":
                    DocumentStore.Entry before=documents.find(a.getString("fileId"));boolean wasActive=before.uri.toString().equals(prefs.getString("activeUri",""));
                    result=documents.rename(before.id,a.getString("name"));
                    if(wasActive)prefs.edit().putString("activeUri",documents.find(before.id).uri.toString()).apply();
                    if(!documents.isFolder())saveFileScope();break;
                case "forget":sessionToken=UUID.randomUUID().toString();documents.clear();releaseAllExcept(null);prefs.edit().remove("tree").remove("files").remove("activeUri").apply();result=Boolean.TRUE;break;
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
    private Set<Uri> readGrants(){Set<Uri> result=new HashSet<>();for(UriPermission p:getContentResolver().getPersistedUriPermissions())if(p.isReadPermission())result.add(p.getUri());return result;}
    private boolean hasReadGrant(Uri uri){return readGrants().contains(uri);}
    private void releaseAllExcept(List<Uri> keep){for(UriPermission p:getContentResolver().getPersistedUriPermissions()){if(keep!=null&&keep.contains(p.getUri()))continue;try{int flags=(p.isReadPermission()?Intent.FLAG_GRANT_READ_URI_PERMISSION:0)|(p.isWritePermission()?Intent.FLAG_GRANT_WRITE_URI_PERMISSION:0);getContentResolver().releasePersistableUriPermission(p.getUri(),flags);}catch(Exception ignored){}}}
    private void saveFileScope(){
        Set<Uri> grants=readGrants();JSONArray saved=new JSONArray();for(Uri uri:documents.selectedUris())if(grants.contains(uri))saved.put(uri.toString());
        prefs.edit().remove("tree").putString("files",saved.toString()).apply();
    }
    private JSONObject scopeSummary()throws Exception{return documents.current().put("activePath",documents.pathForUri(prefs.getString("activeUri",""))).put("sessionToken",sessionToken);}
    private void restoreScope()throws Exception{
        if(!resumeRecent)expireSession();
        String saved=prefs.getString("tree",null);
        if(saved!=null){
            Uri tree=Uri.parse(saved);
            if(Policy.treeProvider(saved)&&hasReadGrant(tree))documents.commit(documents.scanTree(tree));
            else{documents.clear();prefs.edit().remove("tree").remove("activeUri").apply();releaseAllExcept(null);throw new SecurityException("Saved tree permission unavailable");}
        }else if(resumeRecent){
            Set<Uri> grants=readGrants();JSONArray savedFiles=new JSONArray(prefs.getString("files","[]"));DocumentStore.Snapshot next=new DocumentStore.Snapshot();
            for(int i=0;i<Math.min(savedFiles.length(),Policy.MAX_FILES);i++){
                Uri uri=Uri.parse(savedFiles.getString(i));if(!Policy.localDocument(uri.toString())||!grants.contains(uri))continue;
                try{List<Uri> one=new ArrayList<>();one.add(uri);next.entries.putAll(documents.scanFiles(one).entries);}catch(Exception ignored){/* Other selected files can still be restored. */}
            }
            documents.commit(next);saveFileScope();releaseAllExcept(documents.selectedUris());
        }
    }
    private void expireSession(){
        sessionToken=UUID.randomUUID().toString();
        prefs.edit().remove("activeUri").remove("files").apply();
        if(prefs.getString("tree",null)==null){documents.clear();releaseAllExcept(null);}
    }
    private void notifyExpiry(){
        if(!expiryPending||nativePort==null||destroyed)return;
        try{nativePort.postMessage(new WebMessage(new JSONObject().put("event","sessionExpired").toString()));expiryPending=false;}catch(Exception ignored){}
    }
    private void launchPicker(WebMessagePort port,int id,boolean folder){
        if(pickerBusy){reply(port,id,null,new IOException("Hãy hoàn tất bộ chọn tệp đang mở."));return;}
        Intent intent=new Intent(folder?Intent.ACTION_OPEN_DOCUMENT_TREE:Intent.ACTION_OPEN_DOCUMENT);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);intent.putExtra(Intent.EXTRA_LOCAL_ONLY,true);
        if(folder)intent.addFlags(Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        else {intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true);}
        pickerBusy=true;pickerRequest=id;pickerPort=port;
        try{startActivityForResult(intent,folder?PICK_TREE:PICK_FILES);}catch(ActivityNotFoundException e){pickerBusy=false;pickerRequest=-1;pickerPort=null;reply(port,id,null,new IOException("Thiết bị không có bộ chọn tài liệu phù hợp."));}
    }
    private void saveDocument(WebMessagePort port,int id,String name,byte[] data){
        // An export queued by a disposed page must not open a new picker over its replacement.
        if(destroyed||port!=nativePort)return;if(pickerBusy){reply(port,id,null,new IOException("Hãy hoàn tất bộ chọn tệp đang mở."));return;}
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
        io.execute(()->{Uri newGrant=null;int newGrantFlags=0;List<Uri> acquired=new ArrayList<>();try{
            DocumentStore.Snapshot next;
            if(request==PICK_TREE){
                if(tree==null||!Policy.treeProvider(tree.toString()))throw new IOException("Hãy chọn thư mục trong Bộ nhớ trong hoặc thẻ nhớ.");
                if((flags&Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)!=0){newGrantFlags=flags&(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);getContentResolver().takePersistableUriPermission(tree,newGrantFlags);newGrant=tree;}
                next=documents.scanTree(tree);
                documents.commit(next);List<Uri> keep=new ArrayList<>();if(newGrant!=null)keep.add(newGrant);releaseAllExcept(keep);prefs.edit().remove("files").remove("activeUri").apply();if(newGrant!=null)prefs.edit().putString("tree",tree.toString()).apply();else prefs.edit().remove("tree").apply();
            }else{
                next=documents.scanFiles(uris);
                Set<Uri> grants=readGrants();
                if((flags&Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)!=0)for(DocumentStore.Entry entry:next.entries.values()){
                    boolean hadGrant=grants.contains(entry.uri);
                    try{getContentResolver().takePersistableUriPermission(entry.uri,flags&(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION));if(!hadGrant)acquired.add(entry.uri);}catch(SecurityException ignored){/* Provider may offer only temporary access. */}
                }
                documents.commit(next);releaseAllExcept(documents.selectedUris());prefs.edit().remove("activeUri").apply();saveFileScope();
            }
            sessionToken=UUID.randomUUID().toString();restored=true;reply(port,id,next.json().put("sessionToken",sessionToken),null);
        }catch(Exception e){if(newGrant!=null&&!newGrant.toString().equals(prefs.getString("tree",null)))try{getContentResolver().releasePersistableUriPermission(newGrant,newGrantFlags);}catch(Exception ignored){}for(Uri uri:acquired)try{getContentResolver().releasePersistableUriPermission(uri,flags&(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION));}catch(Exception ignored){}reply(port,id,null,e);} });
    }
    @SuppressWarnings("deprecation") private void setThemeColors(String theme){
        nativeTheme=NativeUiPolicy.theme(theme);int color=nativeTheme.background;
        themeBackground=color;root.setBackgroundColor(color);if(web!=null)web.setBackgroundColor(color);
        getWindow().setBackgroundDrawable(new ColorDrawable(color));getWindow().setStatusBarColor(color);getWindow().setNavigationBarColor(color);
        applyBarAppearance();root.post(()->{if(!destroyed)applyBarAppearance();});
        for(AlertDialog dialog:nativeDialogs)styleDialog(dialog);
        if(nativeFallback!=null){nativeFallback.setBackgroundColor(color);styleFallback(nativeFallback);}
    }
    @SuppressWarnings("deprecation") private void applyBarAppearance(){
        if(Build.VERSION.SDK_INT>=30){WindowInsetsController controller=getWindow().getInsetsController();if(controller!=null){int mask=WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;controller.setSystemBarsAppearance(nativeTheme.light?mask:0,mask);}}
        else{int flags=View.SYSTEM_UI_FLAG_LAYOUT_STABLE;if(nativeTheme.light)flags|=View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;getWindow().getDecorView().setSystemUiVisibility(flags);}
    }
    private void confirmUnavailableBack(){showNativeDialog(dialogBuilder().setTitle("Giao diện chưa phản hồi").setMessage("Không kiểm tra được bản sửa chưa lưu. Đóng MarkRead có thể làm mất các bản sửa trong bộ nhớ.").setPositiveButton("Ở lại",(d,w)->{}).setNegativeButton("Đóng MarkRead",(d,w)->finish()));}
    @Override public void onBackPressed(){
        if(backPending||!nativeDialogs.isEmpty())return;
        if(nativeFallback!=null||!trusted()){confirmUnavailableBack();return;}
        final WebView view=web;final long token=pageToken;final long serial=++backSerial;backPending=true;
        backTimeout=()->{if(backPending&&serial==backSerial&&view==web&&pageState.current(token)){cancelBack();confirmUnavailableBack();}};
        main.postDelayed(backTimeout,NativeUiPolicy.BACK_TIMEOUT_MS);
        try{view.evaluateJavascript("typeof window.markReadBack==='function'?window.markReadBack():null",value->{
            if(destroyed||!pageState.foreground()||view!=web||!pageState.current(token)||!backPending||serial!=backSerial)return;
            cancelBack();
            switch(NativeUiPolicy.backAction(value)){
                case HANDLED:return;
                case EXIT:finish();return;
                case DIRTY:showNativeDialog(dialogBuilder().setTitle("Bản sửa chưa lưu").setMessage("Bạn có bản sửa trong bộ nhớ. Thoát app sẽ mất các bản sửa chưa lưu.").setPositiveButton("Ở lại",(d,w)->{}).setNeutralButton("Lưu bài đang mở",(d,w)->{if(view==web&&pageState.current(token)&&trusted())view.evaluateJavascript("window.markReadSave&&window.markReadSave()",null);}).setNegativeButton("Thoát, bỏ sửa",(d,w)->finish()));return;
                default:confirmUnavailableBack();
            }
        });}catch(RuntimeException error){cancelBack();confirmUnavailableBack();}
    }
    @Override protected void onPause(){pageState.pause();cancelStartupCheck();cancelBack();super.onPause();if(web!=null)web.onPause();}
    @Override protected void onStop(){
        super.onStop();
        if(!pickerBusy&&!isChangingConfigurations()){
            backgroundAt=SystemClock.elapsedRealtime();prefs.edit().putLong("leftAt",System.currentTimeMillis()).apply();
        }
    }
    @Override protected void onStart(){
        super.onStart();
        if(backgroundAt>0){
            resumeRecent=SessionPolicy.recent(SystemClock.elapsedRealtime(),backgroundAt);backgroundAt=0;
            if(!resumeRecent)io.execute(()->{expireSession();main.post(()->{expiryPending=true;notifyExpiry();});});
        }
    }
    private boolean readReducedMotion(){
        try{return MotionPolicy.reduced(Settings.Global.getFloat(getContentResolver(),Settings.Global.ANIMATOR_DURATION_SCALE,1f));}
        catch(RuntimeException error){return false;}
    }
    private void syncReducedMotion(){
        if(trusted())try{web.evaluateJavascript(MotionPolicy.script(readReducedMotion()),null);}catch(RuntimeException ignored){}
    }
    @Override protected void onResume(){super.onResume();pageState.resume();if(web!=null)web.onResume();syncReducedMotion();scheduleStartupCheck(web,pageToken);}
    @Override protected void onDestroy(){destroyed=true;pageState.destroy();cancelStartupCheck();cancelBack();closeNativeDialogs();closePort();io.shutdown();clearExport();pendingSave=null;pendingSaveName=null;hideFallback();disposeWebView(web);super.onDestroy();}
}
