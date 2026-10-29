package vn.markread.local;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/** Android-free UI rules; colors mirror the existing web tokens, not a new saved theme schema. */
final class NativeUiPolicy {
    static final long STARTUP_TIMEOUT_MS=22000,PROBE_TIMEOUT_MS=1500,BACK_TIMEOUT_MS=3000;
    static final String READY_SCRIPT="Boolean(typeof window.markReadBack==='function'&&typeof window.markReadSave==='function'&&document.getElementById('app')&&document.documentElement.getAttribute('data-startup')!=='pending'&&document.getElementById('app').getAttribute('aria-busy')!=='true')";
    static final class Theme {
        final boolean light;
        final int background,surface,text,accent;
        Theme(boolean light,String bg,String surface,String text,String accent){this.light=light;this.background=color(bg);this.surface=color(surface);this.text=color(text);this.accent=color(accent);}
    }
    private static final Map<String,Theme> THEMES=new LinkedHashMap<>();
    static {
        put("dark",false,"202326","1b1e20","c8d0cb","91c7b0");
        put("light",true,"ffffff","f5f6f5","38433c","2c684d");
        put("sepia",true,"f5efdf","ebe4d3","514a3b","57572e");
        put("black",false,"080909","101211","c5d1c9","9dcea9");
        put("tokyo-night",false,"1a1b26","16161e","a9b1d6","8fb1f8");
        put("tokyo-light",true,"e1e2e7","d5d6db","343b58","2d4978");
        put("blue-gray",false,"263238","202c32","d1dce0","bbdde7");
        put("nord",false,"2e3440","272d38","d9dfe9","cbe3ea");
        put("dracula",false,"282a36","21222c","f8f8f2","d9c0fc");
        put("rose-pine",false,"191724","1f1d2e","e0def4","ebbcba");
        put("forest",false,"1e2924","18231d","ccdbce","b9d5ab");
        put("gruvbox",false,"282828","1d2021","ebdbb2","e7c897");
    }
    private static void put(String id,boolean light,String bg,String surface,String text,String accent){THEMES.put(id,new Theme(light,bg,surface,text,accent));}
    private static int color(String hex){return (int)(0xff000000L|Long.parseLong(hex,16));}
    static Theme theme(String id){Theme theme=THEMES.get(id);return theme==null?THEMES.get("dark"):theme;}
    static String[] themeIds(){return THEMES.keySet().toArray(new String[0]);}

    enum BackAction { HANDLED,DIRTY,EXIT,UNAVAILABLE }
    static BackAction backAction(String value){
        if("\"handled\"".equals(value))return BackAction.HANDLED;
        if("\"dirty\"".equals(value))return BackAction.DIRTY;
        if("\"exit\"".equals(value))return BackAction.EXIT;
        return BackAction.UNAVAILABLE;
    }
    static String errorMessage(Exception error){
        if(error instanceof SecurityException)return "Quyền truy cập không còn hiệu lực. Hãy chọn lại thư mục.";
        if(error instanceof FileNotFoundException)return "Tệp hoặc thư mục không còn tồn tại hoặc không đọc được. Hãy chọn lại bằng bộ chọn tài liệu.";
        if(error instanceof IOException||error instanceof IllegalArgumentException){String message=error.getMessage();return message==null||message.trim().isEmpty()?"Không thực hiện được thao tác.":message;}
        return "Không thực hiện được thao tác. Hãy thử chọn lại tệp hoặc thư mục.";
    }

    /** A callback for an old/paused/destroyed page must never display recovery over a newer page. */
    static final class PageState {
        private long generation,probeTicket;
        private boolean foreground,ready,closed;
        long begin(){if(closed)throw new IllegalStateException("Activity destroyed");ready=false;probeTicket++;return ++generation;}
        boolean current(long token){return !closed&&token==generation;}
        boolean needsProbe(long token){return current(token)&&foreground&&!ready;}
        long nextProbe(){return ++probeTicket;}
        void cancelProbe(){probeTicket++;}
        boolean acceptsProbe(long page,long ticket){return needsProbe(page)&&ticket==probeTicket;}
        boolean foreground(){return foreground&&!closed;}
        void markReady(long token){if(current(token)){ready=true;probeTicket++;}}
        void pause(){foreground=false;probeTicket++;}
        void resume(){if(!closed)foreground=true;}
        void invalidate(){generation++;probeTicket++;ready=false;}
        void destroy(){closed=true;generation++;probeTicket++;foreground=false;}
    }
    private NativeUiPolicy(){}
}
