package vn.markread.local;

/** Transient visual preference only; no document, appearance, grant or session state. */
public final class MotionPolicy {
    private MotionPolicy() {}
    public static boolean reduced(float animatorScale) { return animatorScale == 0f; }
    public static String script(boolean reduced) {
        String value = Boolean.toString(reduced);
        return "document.documentElement.setAttribute('data-native-reduced-motion','" + value
            + "');window.dispatchEvent(new CustomEvent('markread-motion-preference',{detail:" + value + "}));";
    }
}
