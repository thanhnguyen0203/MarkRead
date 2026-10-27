# Reading UI update — 2026-10-27

Version: 1.1.3 (113). This summary records checks executed during the preceding implementation turn. The documentation update did not rerun the browser suites or rebuild the APK. This file is a verification summary, not a captured process log.

## Executed checks

- `node --test web/tests/*.test.mjs`: 76 passed.
- `node web/tests/ui.cjs`: 53 passed.
- `node web/tests/revision-ui.cjs`: 62 passed.
- `node web/tests/reading-ui.cjs`: 23 passed.
- `node web/tests/native-ui.cjs`: 27 passed, with a simulated MessagePort host.
- `python tests/validate_apk.py`: 25 passed.
- Total: **266 passed**.

UI checks used Playwright with installed Google Chrome on Windows. The reading suite verifies removal of extension borders and rename focus rings, a single-tap transition between blocks with the same focused textarea, stable tapped positions, no iframe reload, exact surrounding source after length changes, switching unchanged blocks, cancellation, block splitting, viewport resizing, progressive toolbar hiding/revealing, reduced motion, export, math, diagram reuse/rerendering and reference anchors. All UI suites reported no JavaScript runtime errors; Browser UI and Revision UI additionally checked for external network requests and found none.

The 69 Java Policy checks in `POLICY_RESULTS.txt` belong to the initial build and were not rerun or counted here. Existing suite logs from the initial build are retained as historical logs; this summary records the successful reruns and the new reading suite.

## Build and artifact

`python build_apk.py` completed successfully using Java 17, Eclipse ECJ and Android SDK API 35 on Windows. APK v2/v3 signatures and ZIP alignment were verified during that build. It reused the existing local signing key. `ARTIFACT.json` and `BUILD_RESULTS.txt` record the resulting artifact; initial metadata is preserved in `history/`.

- APK: `dist/MarkRead-Android-1.1.3.apk`.
- Size: 7,131,992 bytes.
- SHA-256: `eb69d300d2d6bf343cfde43802996982f94c9df5d4a809c27c5d4aa380023eaf`.
- Renderer SHA-256: `40bac2f7d5cb8f7755044a4ca27e79fda620507121867b561c85edc1b4e748ac`.

## Limits

No Android device, emulator, actual Android keyboard, SAF provider or installation/upgrade test was run for this revision. Resizing a browser viewport models layout changes only. The simulated native suite does not execute Android services. The version remains 1.1.3/113, and the public root certificate file is unchanged.
