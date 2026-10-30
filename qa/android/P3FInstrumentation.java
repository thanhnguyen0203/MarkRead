package vn.markread.local.tests;

import android.app.Activity;
import android.app.Application;
import android.app.Instrumentation;
import android.app.UiAutomation;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Rect;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityNodeInfo;
import android.webkit.WebView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Opt-in fixture-only QA driver. Separate test APK; no app/bridge/debug settings changed. */
public final class P3FInstrumentation extends Instrumentation {
    private Activity activity;
    private WebView web;
    private String session;
    private UiAutomation automation;
    private android.content.ClipData clipboardBefore;
    private boolean clipboardSeeded;
    @Override public void onCreate(Bundle args) {
        super.onCreate(args);
        session=args.getString("session", "");
        if(!session.matches("p3fqa_[a-z0-9]+"))throw new IllegalArgumentException("QA session required");
        start();
    }
    private WebView find(View v) {
        if(v instanceof WebView)return (WebView)v;
        if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++){
            WebView w=find(((ViewGroup)v).getChildAt(i));if(w!=null)return w;
        }
        return null;
    }
    private void refresh() {if(activity!=null)web=find(activity.getWindow().getDecorView());}
    private String js(String source)throws Exception {
        CountDownLatch latch=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();
        runOnMainSync(()->{refresh();if(web==null){result.set("null");latch.countDown();return;}
            web.evaluateJavascript(source,s->{result.set(s);latch.countDown();});});
        if(!latch.await(30,TimeUnit.SECONDS))throw new Exception("JS timeout");return result.get();
    }
    private JSONObject node(AccessibilityNodeInfo n,int depth)throws Exception {
        JSONObject x=new JSONObject();Rect bounds=new Rect();n.getBoundsInScreen(bounds);
        x.put("text",String.valueOf(n.getText())).put("description",String.valueOf(n.getContentDescription()))
         .put("class",String.valueOf(n.getClassName())).put("id",String.valueOf(n.getViewIdResourceName()))
         .put("bounds",new JSONArray(new int[]{bounds.left,bounds.top,bounds.right,bounds.bottom}))
         .put("clickable",n.isClickable()).put("focused",n.isFocused()).put("a11yFocused",n.isAccessibilityFocused()).put("enabled",n.isEnabled());
        JSONArray children=new JSONArray();if(depth<24)for(int i=0;i<n.getChildCount();i++){
            AccessibilityNodeInfo c=n.getChild(i);if(c!=null){children.put(node(c,depth+1));c.recycle();}
        }return x.put("children",children);
    }
    private boolean action(AccessibilityNodeInfo n,String label,int action) {
        if(label.equals(String.valueOf(n.getText()))||label.equals(String.valueOf(n.getContentDescription())))return n.performAction(action);
        for(int i=0;i<n.getChildCount();i++){AccessibilityNodeInfo c=n.getChild(i);if(c!=null){boolean found=action(c,label,action);c.recycle();if(found)return true;}}return false;
    }
    @Override public void onStart() {
        Bundle finalResult=new Bundle();Application app=(Application)getTargetContext().getApplicationContext();
        Application.ActivityLifecycleCallbacks lifecycle=new Application.ActivityLifecycleCallbacks(){
            public void onActivityResumed(Activity a){if(a.getClass().getName().equals("vn.markread.local.MainActivity")){activity=a;refresh();}}
            public void onActivityCreated(Activity a,Bundle b){}public void onActivityStarted(Activity a){}public void onActivityPaused(Activity a){}
            public void onActivityStopped(Activity a){}public void onActivitySaveInstanceState(Activity a,Bundle b){}public void onActivityDestroyed(Activity a){}
        };
        File command=new File(getTargetContext().getCacheDir(),session+".command.json"),response=new File(getTargetContext().getCacheDir(),session+".response.json");
        try {
            app.registerActivityLifecycleCallbacks(lifecycle);
            automation=getUiAutomation(UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES);
            activity=startActivitySync(new Intent().setClassName("vn.markread.local","vn.markread.local.MainActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            runOnMainSync(this::refresh);
            Bundle ready=new Bundle();ready.putString("status","P3F fixture driver ready");sendStatus(0,ready);
            long deadline=SystemClock.elapsedRealtime()+3600000;int previous=-1;
            while(SystemClock.elapsedRealtime()<deadline){
                if(!command.exists()){SystemClock.sleep(100);continue;}
                JSONObject c;try{c=new JSONObject(new String(Files.readAllBytes(command.toPath()),StandardCharsets.UTF_8));}catch(Exception partial){SystemClock.sleep(100);continue;}
                int id=c.getInt("id");if(id==previous){SystemClock.sleep(100);continue;}previous=id;
                JSONObject reply=new JSONObject().put("id",id);
                try {
                    String op=c.getString("op");
                    if(op.equals("finish")){reply.put("value",true);Files.write(response.toPath(),reply.toString().getBytes(StandardCharsets.UTF_8));break;}
                    if(op.equals("js"))reply.put("value",new org.json.JSONTokener(js(c.getString("source"))).nextValue());
                    else if(op.equals("tree")){AccessibilityNodeInfo n=automation.getRootInActiveWindow();reply.put("value",n==null?JSONObject.NULL:node(n,0));if(n!=null)n.recycle();}
                    else if(op.equals("action")){AccessibilityNodeInfo n=automation.getRootInActiveWindow();reply.put("value",n!=null&&action(n,c.getString("label"),c.getInt("action")));if(n!=null)n.recycle();}
                    else if(op.equals("seedClipboard")){
                        // Never export or log the previous clip. Seed before any Paste attempt.
                        runOnMainSync(()->{android.content.ClipboardManager clips=(android.content.ClipboardManager)getTargetContext().getSystemService(android.content.Context.CLIPBOARD_SERVICE);
                            if(!clipboardSeeded){clipboardBefore=clips.getPrimaryClip();clipboardSeeded=true;}
                            clips.setPrimaryClip(android.content.ClipData.newPlainText("MarkRead QA","P3FR2 fixture clipboard sentinel"));});reply.put("value",true);
                    }
                    else if(op.equals("screenshot")){File target=new File(getTargetContext().getCacheDir(),session+".png");Bitmap image=automation.takeScreenshot();try(FileOutputStream f=new FileOutputStream(target)){image.compress(Bitmap.CompressFormat.PNG,100,f);}image.recycle();reply.put("value",true);}
                    else if(op.equals("recreate")){runOnMainSync(()->activity.recreate());reply.put("value",true);}
                    else if(op.equals("revokeFixtureGrant")){
                        // Exact dedicated QA tree only. Never revoke another persisted grant.
                        android.net.Uri uri=android.net.Uri.parse(c.getString("uri"));
                        if(!uri.toString().equals("content://com.android.externalstorage.documents/tree/primary%3ADocuments%2FMarkReadP3FR_20261028"))throw new IllegalArgumentException("Dedicated P3FR fixture grant required");
                        getTargetContext().getContentResolver().releasePersistableUriPermission(uri,Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                        boolean absent=true;for(android.content.UriPermission grant:getTargetContext().getContentResolver().getPersistedUriPermissions())if(grant.getUri().equals(uri))absent=false;
                        reply.put("value",absent);
                    }
                    else throw new IllegalArgumentException("Unknown QA operation");
                }catch(Throwable error){reply.put("error",error.getClass().getSimpleName()+": "+error.getMessage());}
                Files.write(response.toPath(),reply.toString().getBytes(StandardCharsets.UTF_8));
            }
            finalResult.putString("result","P3F fixture driver finished");finish(Activity.RESULT_OK,finalResult);
        }catch(Throwable error){finalResult.putString("error",error.toString());finish(Activity.RESULT_CANCELED,finalResult);}
        finally{if(clipboardSeeded)runOnMainSync(()->{android.content.ClipboardManager clips=(android.content.ClipboardManager)getTargetContext().getSystemService(android.content.Context.CLIPBOARD_SERVICE);
                if(clipboardBefore!=null)clips.setPrimaryClip(clipboardBefore);else if(android.os.Build.VERSION.SDK_INT>=28)clips.clearPrimaryClip();else clips.setPrimaryClip(android.content.ClipData.newPlainText("",""));});
            app.unregisterActivityLifecycleCallbacks(lifecycle);}
    }
}
