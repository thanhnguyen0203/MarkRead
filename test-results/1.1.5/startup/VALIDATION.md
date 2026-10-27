# Startup rendering fix — 27 October 2026

Fixes the default dark shell, restored appearance, welcome page and restored-document sequence observed in `issue3.mp4`.

Android captures a bounded appearance JSON snapshot before loading the WebView, embeds it as UTF-8 Base64 in a meta element and supplies the saved background as a fixed palette color. No script text is interpolated. The window, root and WebView use the same saved theme background. The renderer keeps its shell hidden until session restoration finishes and the first reader document and fonts are ready; it renders that initial document once. A loading message appears after 800 ms of slow startup without delaying completion. Preference or scope errors still reveal a usable shell and error toast. Older hosts retain the message-port preference fallback.

Executed checks:

- Unit suite: **79 passed** (`node --test web/tests/*.test.mjs`).
- Startup UI: **53 passed** (`node web/tests/startup-ui.cjs`). Seven scenarios: embedded preferences with stale localStorage, older host, malformed embedded snapshot, first install, expired session, restore failure and preference failure. Observes visible animation frames, saved font readiness and initial reader load count. Checks the CSP hash after native placeholder substitutions.
- Session UI: **17 passed** (`node web/tests/session-ui.cjs`). Covers restoration, exact ten-minute expiry, persistent settings and forgetting a scope.
- Reading UI: **46 passed** (`node web/tests/reading-ui.cjs`). Includes unified editing, reading progress, toolbar scrolling, reduced motion and desktop split view.
- Simulated native UI: **27 passed** (`node web/tests/native-ui.cjs`). Covers scoped reads, navigation, rename, CSS import, editing and export.
- APK validation: **25 passed** (`python tests/validate_apk.py`). Includes version, permissions, packaged renderer bytes and script CSP hash.
- Release APK rebuilt successfully with the existing local signing key (`python build_apk.py`); Java compilation, DEX conversion, APK signature verification and alignment passed.
- `git diff --check`: passed.

Total: **247 passed**. Browser suites ran in headless Google Chrome on Windows with simulated Android MessagePort hosts. No Android emulator or physical-device startup test was executed. Android's OS-managed splash/launch transition before the Activity starts remains platform-controlled; these checks establish the renderer's first visible state and the APK's build integrity, not device launch timing.

Artifact: `dist/MarkRead-Android-1.1.5.apk`, versionName 1.1.5 / versionCode 115. SHA-256: `5a0ee4e950df4ca30963b0669337b7ab731f7b65c493be35cde9f3fad6eefa90`. This is the startup-fix rebuild; prior 1.1.5 release evidence in the parent directory describes the earlier artifact. The signature and APK validation reports copied into this directory describe this rebuild.
