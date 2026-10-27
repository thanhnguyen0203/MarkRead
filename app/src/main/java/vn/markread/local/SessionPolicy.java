package vn.markread.local;

/** No document is automatically reopened at or beyond ten minutes away. */
public final class SessionPolicy {
    public static final long TIMEOUT_MS=10*60*1000L;
    private SessionPolicy(){}
    public static boolean recent(long now,long leftAt){
        return leftAt>0 && now>=leftAt && now-leftAt<TIMEOUT_MS;
    }
}
