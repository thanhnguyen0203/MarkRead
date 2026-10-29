package vn.markread.local;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;

/** JVM policy tests, not Android view/lifecycle instrumentation. Fixture comes from web/src/tokens.js. */
public final class NativeUiPolicyTest {
    private static int checks;
    private static void check(boolean value,String name){if(!value)throw new AssertionError(name);checks++;System.out.println("PASS "+name);}
    private static int color(String value){return (int)(0xff000000L|Long.parseLong(value.substring(1),16));}
    private static double luminance(int color){
        double sum=0;double[] weights={.2126,.7152,.0722};
        for(int i=0;i<3;i++){double c=((color>>(16-i*8))&255)/255.0;sum+=weights[i]*(c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4));}return sum;
    }
    private static double contrast(int a,int b){double x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
    public static void main(String[] args)throws Exception{
        List<String> rows=Files.readAllLines(Paths.get(args[0]),StandardCharsets.UTF_8);
        HashSet<String> ids=new HashSet<>();
        for(String row:rows){
            String[] f=row.split("\t");String id=f[0];ids.add(id);NativeUiPolicy.Theme theme=NativeUiPolicy.theme(id);
            check(theme.light==Boolean.parseBoolean(f[1])&&theme.background==color(f[2])&&theme.surface==color(f[3])&&theme.text==color(f[4])&&theme.accent==color(f[5]),id+": native matches resolved web palette");
            check(contrast(theme.text,theme.background)>=4.5,id+": readable fallback body");
            check(contrast(theme.text,theme.surface)>=4.5,id+": readable native dialog");
            check(contrast(theme.accent,theme.surface)>=4.5,id+": readable button label");
        }
        check(rows.size()==12&&ids.size()==12&&ids.equals(new HashSet<>(Arrays.asList(NativeUiPolicy.themeIds()))),"all 12 themes, no missing or extra native ids");
        check(NativeUiPolicy.theme(null)==NativeUiPolicy.theme("dark")&&NativeUiPolicy.theme("invalid")==NativeUiPolicy.theme("dark"),"invalid saved theme uses established dark fallback");
        check(NativeUiPolicy.backAction("\"handled\"")==NativeUiPolicy.BackAction.HANDLED,"UI layer consumed Back");
        check(NativeUiPolicy.backAction("\"dirty\"")==NativeUiPolicy.BackAction.DIRTY,"dirty result requires confirmation");
        check(NativeUiPolicy.backAction("\"exit\"")==NativeUiPolicy.BackAction.EXIT,"only explicit clean exit can finish");
        for(String value:new String[]{null,"null","undefined","false","true","exit","\"EXIT\"","{}","\"\"","[\"exit\"]"})check(NativeUiPolicy.backAction(value)==NativeUiPolicy.BackAction.UNAVAILABLE,"unavailable Back cannot discard: "+value);
        String missing=NativeUiPolicy.errorMessage(new FileNotFoundException("content://private/missing"));
        check(missing.contains("bộ chọn tài liệu")&&!missing.contains("content://"),"missing file offers picker recovery without raw provider URI");
        check(NativeUiPolicy.errorMessage(new SecurityException("private")).contains("chọn lại thư mục"),"revoked permission offers regrant");
        check(NativeUiPolicy.errorMessage(new IOException("Không ghi được tệp.")).equals("Không ghi được tệp."),"specific write error retained");
        check(NativeUiPolicy.errorMessage(new IOException("  ")).equals("Không thực hiện được thao tác."),"blank provider error stays intelligible");
        check(NativeUiPolicy.errorMessage(new RuntimeException("secret")).contains("chọn lại")&&!NativeUiPolicy.errorMessage(new RuntimeException("secret")).contains("secret"),"unexpected exception offers safe recovery");
        NativeUiPolicy.PageState state=new NativeUiPolicy.PageState();long first=state.begin();
        check(state.current(first)&&!state.needsProbe(first)&&!state.foreground(),"onCreate has current page but no foreground watchdog");
        state.resume();check(state.needsProbe(first)&&state.foreground(),"resume can verify an unready page");
        long ticket=state.nextProbe();check(state.acceptsProbe(first,ticket),"probe callback belongs to current foreground page");
        state.pause();check(!state.acceptsProbe(first,ticket)&&!state.foreground()&&state.current(first),"pause invalidates probe without disposing live WebView");
        state.resume();check(!state.acceptsProbe(first,ticket)&&state.needsProbe(first),"resume never accepts paused probe");
        ticket=state.nextProbe();state.cancelProbe();check(!state.acceptsProbe(first,ticket)&&state.needsProbe(first),"cancel watchdog invalidates a queued callback");
        ticket=state.nextProbe();state.markReady(first);check(!state.needsProbe(first)&&!state.acceptsProbe(first,ticket)&&state.current(first),"ready page stops startup checks without recreation");
        state.pause();state.resume();check(!state.needsProbe(first)&&state.current(first),"home/return preserves the already-ready page");
        long second=state.begin();state.markReady(first);check(!state.current(first)&&state.needsProbe(second),"late ready callback cannot affect explicitly recreated page");
        ticket=state.nextProbe();state.invalidate();check(!state.current(second)&&!state.acceptsProbe(second,ticket),"renderer disposal invalidates all old callbacks");
        long third=state.begin();check(state.needsProbe(third),"manual recovery starts a new page generation");
        state.destroy();state.resume();check(!state.current(third)&&!state.needsProbe(third)&&!state.foreground(),"destroyed Activity cannot resume or show recovery");
        boolean rejected=false;try{state.begin();}catch(IllegalStateException expected){rejected=true;}check(rejected,"destroyed Activity cannot recreate WebView");
        check(NativeUiPolicy.STARTUP_TIMEOUT_MS>20000&&NativeUiPolicy.PROBE_TIMEOUT_MS>0&&NativeUiPolicy.PROBE_TIMEOUT_MS<5000&&NativeUiPolicy.BACK_TIMEOUT_MS>0&&NativeUiPolicy.BACK_TIMEOUT_MS<5000,"bounded startup/probe/Back delays");
        Files.write(Paths.get(args[1]),NativeUiPolicy.READY_SCRIPT.getBytes(StandardCharsets.UTF_8));
        System.out.println("Native UI policy: "+checks+" checks passed");
    }
}
