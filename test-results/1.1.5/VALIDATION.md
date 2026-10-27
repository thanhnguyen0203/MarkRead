# MarkRead Android 1.1.5 — 27/10/2026

Implemented automatic appearance persistence and a ten-minute reading-session expiry. The APK uses versionCode 115 and the same signing certificate as this checkout's 1.1.4 APK.

## Executed validation

- JavaScript unit tests: 79 passed, including preference migration without the old opt-in flag, bounds and invalid CSS recovery.
- Browser UI: 54 passed, including automatic settings persistence after reload.
- Revision UI: 62 passed, including mobile settings layouts, font selection, search, replacement and CSS import.
- Reading UI: 46 passed, including continuous editing, progress and exact export Blob contents after unchanged/cancelled edits.
- Simulated native UI: 27 passed, including scoped file access, rename, drafts and export transport.
- Session UI: 17 passed. Fresh browser contexts restore the selected folder and last document at 599,999 ms; at 600,000 ms they restore the folder list without opening a document. Standalone selections restore before the deadline and clear at expiry. Native preferences survive empty renderer storage; live expiry and explicit forgetting retain all settings. Session checkpoint messages carry the current native session token.
- Java Policy: 69 passed.
- Java SessionPolicy: 7 passed, including 599,999 / 600,000 / 600,001 ms, missing timestamps and backwards time.
- APK validation: 25 passed, including compiled version, zero permissions, current renderer bytes, CSP hash and offline fonts.
- APK signature verification passed. Certificate SHA-256 matches 1.1.4: `52a8a4d97bf264d0d43914f71408f6ccdaf6622951c55246157239aae13c2b54`.
- `git diff --check` passed.

Total: 386 assertions across the listed suites, plus signature comparison and diff checks.

## Environment and limits

Windows; bundled JDK 17.0.20.1, ECJ and Android API 35 build tools; Node.js 24.15.0. UI tests ran in headless Brave Chromium using bundled Playwright and intercepted local page responses. Real Android lifecycle callbacks, SAF permission persistence, device sleep and OS process termination were not executed on a phone or Android emulator. The simulated host verifies renderer behavior and transport; it is not an Android service test.

The sandbox blocked localhost network access and browser downloads to disk. UI fixtures are therefore fulfilled in process. Reading export assertions inspect the generated Blob bytes, while the native suite separately verifies the export stream. Disk downloads through the desktop browser were not validated. An initial failed asset copy encountered a transient Windows mapped-file lock; the subsequent build completed successfully.

Only metadata and granted URIs are persisted for reading sessions. Draft contents are not saved to disk and must be exported before closing the app or exceeding the session deadline. System open/save pickers are excluded from the away timer. Restoring standalone files requires a provider that supports persisted read grants.

## Artifact

- `dist/MarkRead-Android-1.1.5.apk`
- 7,131,992 bytes
- SHA-256: `7a5622167ecdd4133683f1616b3499f7812b5f8e633674514450d1b90754bde5`

Raw session and reading output is in `session-ui.txt` and `reading-ui.txt`. Screenshots are saved alongside this report and in `browser/`. APK diagnostics and checksum are also under `dist/`.
