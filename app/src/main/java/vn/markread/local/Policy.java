package vn.markread.local;

import java.net.URI;
import java.util.Locale;
import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;

/** Pure policy functions, shared by the Android boundary and JVM tests. */
public final class Policy {
    public static final String ORIGIN = "https://appassets.androidplatform.net";
    public static final String ENTRY_URL = ORIGIN + "/app/index.html";
    public static final long MAX_DOC = 5L * 1024 * 1024;
    public static final long MAX_IMAGE = 10L * 1024 * 1024;
    public static final int MAX_FILES = 5000;
    public static final int CHUNK = 65536;
    private static final Set<String> LOCAL_AUTHORITIES = new HashSet<>(Arrays.asList(
        "com.android.externalstorage.documents", "com.android.providers.downloads.documents", "com.android.providers.media.documents", "media", "downloads"));
    private Policy() {}
    public static boolean trustedPage(String url) { return ENTRY_URL.equals(url); }
    public static boolean localDocument(String value) {
        try { URI u = new URI(value); return "content".equals(u.getScheme()) && LOCAL_AUTHORITIES.contains(u.getAuthority()) && u.getUserInfo() == null && u.getPort() == -1; }
        catch (Exception e) { return false; }
    }
    public static boolean treeProvider(String value) {
        try { URI u = new URI(value); return localDocument(value) && "com.android.externalstorage.documents".equals(u.getAuthority()); }
        catch (Exception e) { return false; }
    }
    public static boolean safeName(String name) {
        if (name == null || name.length() == 0 || name.length() > 512 || name.equals(".") || name.equals("..")) return false;
        for (int i=0;i<name.length();i++) { char c=name.charAt(i); if(c=='/' || c=='\\' || c<32 || c==127) return false; }
        return true;
    }
    public static long maxBytes(String name) {
        if (!safeName(name)) return -1;
        String n=name.toLowerCase(Locale.ROOT);
        if(n.endsWith(".md") || n.endsWith(".markdown") || n.endsWith(".txt"))return MAX_DOC;
        if(n.endsWith(".css"))return 100000;
        if(n.matches(".*\\.(png|jpe?g|gif|webp|avif|bmp)$"))return MAX_IMAGE;
        return -1;
    }
    public static String exportName(String value) {
        String n=value==null?"Tai_lieu.md":value.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_");
        if(n.length()>180)n=n.substring(0,180);
        if(n.length()==0)n="Tai_lieu.md";
        return n;
    }
    public static String renameName(String value) {
        if(!safeName(value)||value.length()>180||!value.equals(value.trim())||value.endsWith(".")||value.matches(".*[:*?\"<>|].*"))
            throw new IllegalArgumentException("Tên tệp không hợp lệ.");
        return java.text.Normalizer.normalize(value,java.text.Normalizer.Form.NFC);
    }
    public static void checkRead(long offset, int length, long max) {
        if(offset<0 || offset>max || length<1 || length>CHUNK || max<0)throw new IllegalArgumentException("Yêu cầu đọc không hợp lệ.");
    }
}
