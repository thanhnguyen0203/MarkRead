package vn.markread.local;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

/** Pure JVM/host-script checks, not a test of Android Settings or WebView on a device. */
public final class MotionPolicyTest {
    private static int checks;
    private static void check(boolean value, String message) { if(!value)throw new AssertionError(message);checks++;System.out.println("PASS "+message); }
    public static void main(String[] args) throws Exception {
        check(MotionPolicy.reduced(0f), "zero animator scale requests reduced motion");
        check(MotionPolicy.reduced(-0f), "negative floating zero is still disabled");
        for(float scale:new float[]{1f,.5f,10f,-1f,Float.NaN,Float.POSITIVE_INFINITY,Float.NEGATIVE_INFINITY,Float.MIN_VALUE})
            check(!MotionPolicy.reduced(scale), "nonzero/invalid scale does not invent a persisted preference: "+scale);
        String yes=MotionPolicy.script(true),no=MotionPolicy.script(false);
        check(yes.contains("'data-native-reduced-motion','true'")&&yes.contains("{detail:true}"), "true host script contains only literal boolean metadata/event");
        check(no.contains("'data-native-reduced-motion','false'")&&no.contains("{detail:false}"), "false host script never overrides the web media query directly");
        check(!yes.contains("localStorage")&&!yes.contains("nativeCall")&&!yes.contains("markReadBack"), "motion script does not touch appearance, ports or Back");
        if(args.length>0)Files.write(Paths.get(args[0]),("{\"true\":\""+yes+"\",\"false\":\""+no+"\"}").getBytes(StandardCharsets.UTF_8));
        System.out.println("Motion policy: "+checks+" checks passed");
    }
}
