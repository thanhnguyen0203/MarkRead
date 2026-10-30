# P3F fixture QA tools

Opt-in Android instrumentation, separate from the production APK. See `docs/ui-redesign/P3F_REPORT.md` and the test matrix for actual results and limitations. This is not the Gradle `connectedAndroidTest` runner.

- Use a dedicated emulator and the generated `MarkReadP3F_*` fixture tree only. Never use personal documents.
- Build with `python qa/android/build_p3f_probe.py`, using the existing local JDK/SDK/debug key. No release key or new dependency is used.
- Installing the QA APK requires an app signed with the same debug certificate. Do not uninstall or clear app data to bypass a signature mismatch.
- `runtime_p3f.py start` starts a bounded instrumentation session. Explicitly select the fixture tree through DocumentsUI before running scenarios. The scenario entry point checks the selected root.
- Match keyboard coordinates to the screenshot/device currently in use. Instrumentation JS, `adb input text` and `execCommand` are not Vietnamese IME acceptance tests.
- Use visible Source mode for editing history probes. Keep snippets scoped to avoid global declaration conflicts. Preserve raw failures and distinguish setup/automation failures from app defects.
- Finish only after fixture observations/exports are saved and the fixture has no draft. Restore any system IME/accessibility/orientation settings changed during QA. Do not force-stop a user editing session.
- Keep QA APK, driver, cache commands and host tools out of release packaging. Production WebView debugging and bridge permissions must remain unchanged.

The historical `run_emulator_tests.py` contains uninstall behavior and obsolete UI assumptions; do not run it on an emulator/device containing user data.

## P3F-R isolated run

Set `MARKREAD_QA_PHASE=ui-p3fr` and `MARKREAD_QA_DEVICE=emulator-5556` explicitly for the separate validation emulator. Defaults stay unchanged for historical P3F scripts. P3FR also verifies the AVD name `MarkRead_P3FR_Validation`; a reused port is refused. `python -m qa.android.p3fr_undo before|after` imports only a generated `P3FR_Fixture.md`; this is WebView history evidence, not a SAF or IME test. Never run concurrent command drivers: the cache mailbox is single-consumer. Keep the target idle/fixture-clean before installing the debug APK; never use the running user emulator as the update target.

## P3F-R2 final gate

Use `MARKREAD_QA_PHASE=ui-p3fr2`, `MARKREAD_QA_DEVICE=emulator-5556` and the same dedicated AVD guard. Never run mailbox consumers concurrently. Start only with the target idle/fixture-clean and never install over a possible user draft. No TalkBack setup is required: it is NOT TESTED — accepted limitation for this gate.

`p3fr2_math` measures the existing real renderer on12 themes and checks native UI visibility before screenshots; a System UI/fallback overlay invalidates visual acceptance. `p3fr2_core begin|typing` uses real Gboard touches and Android keys. Inspect the current keyboard screenshot/geometry first. A real tap is needed to give the WebView Android focus. The chord adapter releases Ctrl explicitly; otherwise Android shell injection can leave Gboard in Ctrl+Backspace mode. Native dialog labels can be uppercase; use observed labels. JS assignment is only fixture setup/cleanup, never IME evidence.

`p3fr2_saf picker|edit_export|verify_rename|lifecycle_missing` requires a fresh UUID `MarkReadP3FR2_YYYYMMDD_hex` fixture and manual DocumentsUI selection/save of exactly that folder. Do not reuse a mutated fixture without regenerating it. Delete/move is limited to exact generated files whose content is checked. Provider error text is not guaranteed to be localized: verify that a new error is surfaced and prior content/filename remain intact.

The separate QA APK seeds clipboard with a known sentinel before Paste, keeps any available previous clip opaque in RAM and restores it on finish. Finish while fixture-clean; restore temporary keyboard/network settings and shut down only the owned QA AVD. Raw setup failures and covered screenshots stay separate from final acceptance evidence. Production APK contains none of this instrumentation.
