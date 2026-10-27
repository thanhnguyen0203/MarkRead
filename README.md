# MarkRead Android 1.1.3

Offline Android Markdown reader and block editor. Package `vn.markread.local`, versionCode 113, min SDK 26, target/compile SDK 35. No runtime `uses-permission` declarations, no JavaScriptInterface, no analytics, no remote font loading.

See `HUONG_DAN_CAI_DAT.md` for Vietnamese installation, feature details, privacy scope and limits. See `CHANGELOG.md` and the validation report for this release.

## Architecture

A bundled WebView renderer is served from a synthetic HTTPS origin intercepted entirely in the app. A bounded WebMessagePort carries paginated metadata and chunked file data. The reader iframe cannot run scripts. Native reads accept only opaque IDs minted from explicit local SAF picker results, never arbitrary paths. Folder scanning recurses inside the granted tree. Long-press rename uses opaque IDs from that scope, DocumentsContract.renameDocument, validated basenames, sibling collision checks and the provider-returned URI. Read/write tree grants are limited to the flags actually returned by the system picker; old read-only grants remain usable for reading and can be refreshed by reopening the folder. Exports use ACTION_CREATE_DOCUMENT to save a user-selected copy; edits remain in memory until exported.

Unified editing maps top-level Markdown tokens to exact source spans, inserts trusted edit metadata after sanitization and preserves block separators. It falls back to a whole-document block if lexer offsets do not match. No contenteditable HTML is written back as Markdown. File order is directory-first, numeric Vietnamese name order per level, optionally descending; previous/next follows the same depth-first sequence regardless of filtering/collapse.

## Android Studio

Use JDK 17 and Android SDK 35. Included wrapper: Gradle 8.9 / Android Gradle Plugin 8.7.3. The renderer asset is already built. Restore your separately held signing backup under `private/` to sign compatible updates; never commit or distribute that directory. Then run `./gradlew assembleRelease`.

## Linux SDK build

The source includes `toolchain/fetch_tools.py` (downloads SDK build tools, API 35 platform and ECJ compiler). Java 17, Python 3 and required Linux shared libraries are needed.

```bash
python3 toolchain/fetch_tools.py
python3 build_apk.py
python3 tests/validate_apk.py
```

Without `private/`, the Python build generates a new personal signing key; that key cannot update an APK signed with the original key. Public source archives deliberately exclude signing material.

## Renderer changes

```bash
cd web
npm ci
npm run build
npm test
```

The build embeds all libraries, KaTeX assets and Merriweather WOFF2 fonts. No font conversion or network fetch is needed during this build. Copy `web/dist/MarkRead.html` to `app/src/main/assets/index.html`; the Python APK builder does so automatically when node_modules exists. Android Studio uses the prebuilt asset as checked in.

## Validation

- `web/tests/*.test.mjs`: parser utilities, scoped native transport, tree order/navigation and source-span replacements.
- `web/tests/ui.cjs`: end-to-end UI with Playwright. Install Playwright and Chromium, set `MARKREAD_CHROMIUM` to the executable, and run `node web/tests/ui.cjs` from a writable checkout. Fixtures/screenshots are written to sibling `qa/`.
- `web/tests/revision-ui.cjs`: verifies one-row toolbar across six viewport sizes, menu, themed font selection, touch states, compact settings, source search/replacement, regex timeout/recovery, extension changes and independent CSS import.
- `web/tests/reading-ui.cjs`: verifies unboxed file extensions, rename focus without an outer ring, consecutive unified edits without iframe reloads or focus loss, stable tapped positions, source offsets, cancellation, progressive toolbar visibility, reduced motion, export, math, diagrams and reference links.
- `web/tests/native-ui.cjs`: exercises the actual Android UI code path in Chromium with a simulated MessagePort host; this does not execute Android services.
- `tests/PolicyTest.java`: pure JVM boundary checks; compile with JDK javac or ECJ, then run `vn.markread.local.PolicyTest`.
- `tests/validate_apk.py`: checks compiled APK version, permissions, CSP, bundled font/license and renderer bytes.
- `app/src/androidTest`: disposable-emulator native WebView integration and local picker/export probe, excluded from release APK.
- `build_test_apk.py`: builds instrumentation APK. Emulator SDK/image setup is required separately to use `run_emulator_tests.py`. If available at sibling `markread-work/MarkRead-Android-1.0.0.apk`, that prior APK is installed before testing the upgrade.

Production outputs go under `dist/`; no test fixtures or test APKs are included in the production APK. Test reports describe actual executed environments and do not claim universal device coverage.

Original code: MIT. Bundled packages and Merriweather retain their own notices under app assets and `web/fonts/OFL.txt`.


## Search and CSS import in 1.1.2

Search matches UTF-16 source offsets. Replacement edits only the current source snapshot and preserves per-document drafts. A bundled Blob worker evaluates JavaScript Unicode/multiline regexes with a 2.5-second deadline, bounded matches and UTF-8 output size. It has no network access; the parent allows `worker-src blob:` solely for this bundled worker, while the reader retains `worker-src none` and no scripts. Results from stale source/query/scope versions are ignored.

Font choices are accessible themed listbox buttons. The read/source mode group is in editing settings; version 1.1.3 also offers a vertical overflow menu when unified editing is disabled. Hover feedback is gated by fine-pointer/hover media queries; Android tap highlight is transparent and keyboard focus remains visible.

The independent CSS picker uses ACTION_OPEN_DOCUMENT and a bounded local-only read without replacing the document snapshot or releasing its persisted tree grant. Rename accepts full validated basenames and retains the entry's original bounded read capability even if its extension changes. TXT is scanned as a text document; other renamed extensions remain readable within the current session but are not automatically scanned after restart.

## UI revision and packaging in 1.1.3

Unified block editing now uses a frameless, auto-sized source field with the article font and colors. Tap outside or press Ctrl/Cmd+Enter to finish; Escape cancels the active block edit. The top-right vertical overflow menu switches Read/Source when unified editing is disabled. All twelve theme choices preview their actual background/text colors, with one continuous selection border.

The follow-up reading revision removes borders from file-extension labels and the outer focus ring from the rename field. Tapping another block commits the current edit and opens the tapped block in the same reader document, preserving its screen position and reusing the focused textarea. Unchanged blocks retain their rendered content; edited source spans and dependent rendering are refreshed in place. A tap on a non-editable area still finishes editing.

The document toolbar progressively slides and fades away after scrolling down past the initial reading distance, then returns on upward scrolling. Programmatic positioning does not trigger hiding. Reduced-motion preferences keep the toolbar stable.

On Windows, the Python builder accepts `aapt2.exe`/`zipalign.exe` and API 35 platform folder variants. The renderer builder resolves its directory from a file URL on either Windows or Linux. With Java 17 on PATH and the SDK tools available under `toolchain/`, run `python build_apk.py`, then `python tests/validate_apk.py`. The output is `dist/MarkRead-Android-1.1.3.apk`.

This checkout has no original private signing key. The local build creates and reuses `private/markread-release.p12` and its password file. Keep that directory private and backed up for future updates. The public `APK_SIGNATURE.txt` is certificate information only. An APK signed with this new key cannot replace an installed copy signed with the old key.

Current release evidence is in `test-results/1.1.3/`; see `READING_UPDATE_RESULTS.md` for the latest verification summary. The reading revision passed 266 checks across unit, browser UI, simulated native UI and APK validation. The 69 Java Policy checks from the initial build were not rerun or included in that total. Initial artifact/build metadata is preserved in `test-results/1.1.3/history/`, and the initial 1.1.3 report is archived in `test-results/history/`. Android device and emulator testing has not been performed for this revision. VersionName and versionCode remain 1.1.3 and 113.
