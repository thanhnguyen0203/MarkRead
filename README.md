# MarkRead Android 1.1.2

Offline Android Markdown reader and block editor. Package `vn.markread.local`, versionCode 112, min SDK 26, target/compile SDK 35. No runtime `uses-permission` declarations, no JavaScriptInterface, no analytics, no remote font loading.

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
- `web/tests/native-ui.cjs`: exercises the actual Android UI code path in Chromium with a simulated MessagePort host; this does not execute Android services.
- `tests/PolicyTest.java`: pure JVM boundary checks; compile with JDK javac or ECJ, then run `vn.markread.local.PolicyTest`.
- `tests/validate_apk.py`: checks compiled APK version, permissions, CSP, bundled font/license and renderer bytes.
- `app/src/androidTest`: disposable-emulator native WebView integration and local picker/export probe, excluded from release APK.
- `build_test_apk.py`: builds instrumentation APK. Emulator SDK/image setup is required separately to use `run_emulator_tests.py`. If available at sibling `markread-work/MarkRead-Android-1.0.0.apk`, that prior APK is installed before testing the upgrade.

Production outputs go under `dist/`; no test fixtures or test APKs are included in the production APK. Test reports describe actual executed environments and do not claim universal device coverage.

Original code: MIT. Bundled packages and Merriweather retain their own notices under app assets and `web/fonts/OFL.txt`.


## Search and CSS import in 1.1.2

Search matches UTF-16 source offsets. Replacement edits only the current source snapshot and preserves per-document drafts. A bundled Blob worker evaluates JavaScript Unicode/multiline regexes with a 2.5-second deadline, bounded matches and UTF-8 output size. It has no network access; the parent allows `worker-src blob:` solely for this bundled worker, while the reader retains `worker-src none` and no scripts. Results from stale source/query/scope versions are ignored.

Font choices are accessible themed listbox buttons. The read/source mode group is in editing settings. Hover feedback is gated by fine-pointer/hover media queries; Android tap highlight is transparent and keyboard focus remains visible.

The independent CSS picker uses ACTION_OPEN_DOCUMENT and a bounded local-only read without replacing the document snapshot or releasing its persisted tree grant. Rename accepts full validated basenames and retains the entry's original bounded read capability even if its extension changes. TXT is scanned as a text document; other renamed extensions remain readable within the current session but are not automatically scanned after restart.
