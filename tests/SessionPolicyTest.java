package vn.markread.local;

public final class SessionPolicyTest {
    private static int checks=0;
    private static void check(boolean value){if(!value)throw new AssertionError("Session boundary "+checks);checks++;}
    public static void main(String[] args){
        long left=1000000;
        check(SessionPolicy.recent(left,left));
        check(SessionPolicy.recent(left+599999,left));
        check(!SessionPolicy.recent(left+600000,left));
        check(!SessionPolicy.recent(left+600001,left));
        check(!SessionPolicy.recent(left+86400000,left));
        check(!SessionPolicy.recent(left,0));
        check(!SessionPolicy.recent(left-1,left));
        System.out.println("Session policy: "+checks+" checks passed");
    }
}
