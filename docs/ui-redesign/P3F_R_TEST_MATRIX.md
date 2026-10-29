# P3F-R — Test matrix

28/10/2026. PASS chỉ trong đúng phương pháp/platform mô tả. NT = NOT TESTED, không phải PASS hoặc FAIL của ứng dụng. [Evidence](../../test-results/ui-p3fr/).

## Automated

- Baseline trước: Node132 + browser1769 + JVM171 + baseline APK25 =2097/2097; palette2220/2220.
- Sau:2097 kế thừa;68 checks native transaction/Undo browser mới;36 math glyph/error diagnostics mới. Tổng2201. Math diagnostic assertion về lỗi đã biết không phải contrast acceptance.
- Palette2220/2220,12 theme. Debug APK18/18 tách khỏi2201; JVM/policy và baseline APK không phải emulator acceptance.
- CSS/renderer build, Java compile/D8/resources, generated HTML parity, CSP/no-permission, offline assets/Lucide23, custom CSS, source mapping/Markdown DOM, reduced motion, responsive/editor/reader, native fallback simulations: các suite kế thừa.
- Lệnh: `node --test web/tests/*.test.mjs`; browser harness `python build/ui-p3fr/run-browser.py after 0` và `after 1`; search-dialogs/modal-native-states/polish/qa-math; `node web/tests/replace-history-ui.cjs`; `node web/tests/math-remediation-ui.cjs`; palette checker; `python build/ui-p3fr/verify-native-after.py after`; `python build/ui-p3fr/verify-debug-apk.py`. Browser dùng Chrome cài sẵn qua MARKREAD_CHROMIUM; harness/snapshot ở build ignored, tests nguồn nằm web/tests.

## R1 — Undo/Replace

1. Trước: `# A\n\none one`, Replace `one→two`, Undo. Chromium/APK cũ FAIL expected; actual vẫn `two one` (lỗi tái hiện).
2. Sau: Replace một, all nhiều block, regex `Item-(\d+)→Số $1`, tiếng Việt case-insensitive, emoji surrogate. **PASS Chromium và WebView124** exact source/Undo/Redo. Android23/23 observations sau; không cộng vào2201.
3. Zero-length regex, literal dollar, delete result, selection sẵn, hai Replace liên tiếp, native typing sau Replace, dirty trở về original: **PASS Chromium**. Android riêng các ca này NT.
4. Reader/split native transaction/mode stable: **PASS WebView124**; routing shortcut qua synthetic KeyboardEvent, không nhận là hardware keyboard test.
5. Unified, modal interruption, native API unsupported, active composition và composition khởi đầu khi worker pending: **PASS Chromium**; Android composition pending case NT, không lấy synthetic event làm Gboard evidence.
6. Undo nhầm file sau switch: PASS Chromium; typing history trước Search giữ baseline limitation. Full native cross-field history không được nghiệm thu như tính năng mới.

## R2 — Math

12 theme × inline/display glyphs/operators + style diagnostic =36 assertions. Ordinary glyphs PASS; unknown-command contrast FAIL ở dark/black/tokyo-night/blue-gray/nord/dracula/rose-pine/forest/gruvbox. Light/sepia/tokyo-light PASS. Measurements và24 ảnh trước/sau cùng393×852 ở evidence/math; không có CSS patch. Custom CSS và explicit color:36 inherited checks PASS. Android P3F đã có measurements; phép đo chi tiết mới là Chromium, không gọi là Android remeasurement.

## R3 — Gboard thực tế

Thiết bị QA Android15, Gboard Vietnamese QWERTY; chạm phím màn hình qua Android input touchscreen tap, không gửi chuỗi text. Thu trusted beforeinput/input và caret/source/dirty.

- `tieengs vieetj ` → `Tiếng việt `: **PASS runtime**.
- Enter + `ddungs` → `Đúng` (auto-capitalization), caret ở cuối: **PASS sau review capitalization**; raw lowercase expected INCONCLUSIVE được giữ nguyên.
- Backspace `Đúng→Đún`: **PASS runtime**.
- Home/quay app: nội dung, caret và dirty giữ nguyên: **PASS runtime**.
- APK cuối: chạm Gboard `ddungs→Đúng`, trusted input/dirty/caret đúng: **PASS**; Back đóng IME vẫn giữ Source/draft, Back tiếp chuyển Read giữ source/dirty: **PASS**. [Evidence](../../test-results/ui-p3fr/IME_FINAL_APK.json), [Back](../../test-results/ui-p3fr/BACK_FINAL_APK.json).
- Chuỗi layout này dùng committed insert/delete, không phát composition events; composition lifecycle của các layout khác: **NT**.
- VNI, sửa từ giữa câu, xóa riêng dấu, Delete tiến, native drag selection, copy/paste, Undo/Redo Gboard, chuyển Search/unified khi đang composition, keyboard flicker/frame timing: **NT**.

Checklist manual trước nghiệm thu: xác nhận Telex/VNI ngoài app trước; gõ `Tôi đang đọc tiếng Việt.`; đặt caret giữa `đọc`, sửa dấu rồi Backspace/Delete; chọn `tiếng Việt` bằng tay, Copy/Paste/thay thế; nhập3 dòng; Undo/Redo và Replace đang composition; chuyển Source/Search/unified; Back đóng IME, mở lại; Home/quay lại. Expected exact text, không nhân đôi/mất dấu, caret đúng, dirty đúng, không nhấp nháy. Ghi input method/version, expected/actual, video và native event log; không suy kết quả từ synthetic tests. VNI chỉ NT nếu layout thực sự không hỗ trợ sau kiểm tra settings.

## R4 — TalkBack

Cập nhật29/10/2026 theo người dùng: **NOT TESTED — accepted limitation**, không phải release blocker và không tiếp tục kiểm chuyên sâu. Các attempt native focus/service/double-tap trong P3F-R được giữ ở [evidence lịch sử](../../test-results/ui-p3fr/TALKBACK_ATTEMPTS.json), không nâng thành PASS speech/gesture. Semantic HTML, ARIA, focus và keyboard vẫn được giữ và regression hiện có vẫn chạy. [Gate P3F-R2](P3F_R2_RELEASE_READINESS.md) thay yêu cầu TalkBack nghiệm thu bắt buộc của gate cũ.

## R5/R6 — SAF, lifecycle và runtime gaps

Thư mục Documents/MarkReadP3FR_20261028 được chọn bằng DocumentsUI thật, dialog ALLOW đúng scope; index gồm01_Undo.md vàSub/02_Nested.md, nội dung đọc qua NativeFile/SAF. **PASS** tree/subdirectory/read. Export đúng SHA256 so với expected source, original bytes giữ nguyên, Undo về sạch, rename Unicode/phần mở rộng và reopen nested: **5/5 observations PASS** trong [SAF_RUNTIME](../../test-results/ui-p3fr/SAF_RUNTIME.json).

Trên APK cuối, helper thu hồi đúng persisted URI fixture (whitelist cứng); restart **PASS**: toast tiếng Việt đúng NativeUiPolicy,0 file, Welcome/không dirty. [Revoke](../../test-results/ui-p3fr/SAF_REVOKE.json), [restart](../../test-results/ui-p3fr/SAF_REVOKE_RESTART.json). Đây là mất persisted grant có kiểm soát bằng ContentResolver trong instrumentation, không giả làm provider cloud/SD rút quyền. Cold scope grant tồn tại qua update/restart nhưng auto-resume active file chưa nghiệm thu: wait quá sớm và snapshot dùng nhầm setting ID được giữ là setup failures. Deleted/moved-file runtime P3F là lịch sử, chưa chạy lại trên APK cuối.

Provenance: IME4 cases/save/rename chạy trên APK trung gian SHA945c822…5576b; final SHAa2ecb98…283d3 có23 Undo, Telex smoke, Back, TalkBack attempts, revoke/restart và installed hash match. Không gộp các ca trung gian thành mọi ca đều đã chạy trên APK cuối. Native startup fallback xuất hiện dưới host load; Continue waiting khôi phục WebView/nguồn fixture sạch; chưa nghiệm thu dirty recovery ở fallback. Cần profile cold startup riêng.

Read-only/unsupported operations/cloud/SD/low-storage: **NT**. Không có provider tương ứng không phải FAIL. Android physical, WebView100/API26, max font/display size, composing recovery sau process death, performance/FPS: **NT**. Giữ các runtime P3F có nhãn lịch sử; không nhận chúng thành revalidation trên APK cuối.

## Build và provenance

`scripts/Build-AndroidDebug.ps1 -Offline -RerunTasks`: Gradle8.9/AGP8.7.3/JDK17, assembleDebug PASS. Debug APK signature v2/alignment/manifest/permissions/asset packaging kiểm riêng18 checks. [Artifacts](../../test-results/ui-p3fr/ARTIFACTS.json). Emulator5554 có phiên người dùng được giữ nguyên; APK chỉ cài trên5556 fixture QA. Không uninstall/clear data hoặc thay signing để bypass lỗi.

Lượt revision-ui gặp navigation timeout12s dưới tải đồng thời; giữ [raw timeout](../../test-results/ui-p3fr/REVISION_TIMEOUT.log), chạy lại riêng **62/62 PASS**, không tăng timeout. Đây là retry minh bạch, không phải mọi attempt đều xanh.54 source/build/test JS files syntax PASS; generated HTML/asset parity PASS. Cache mailbox QA chỉ dùng một consumer. Các probe sai expected language/ID/screenshot name được phân biệt với app defect.

## P3F-R2 — Kết quả hiện hành29/10/2026

Các sections P3F-R phía trên là lịch sử. Gate mới **READY FOR P4**:2297 automated=2201 kế thừa+96 mới; palette2220 và APK18 tách riêng.12 diagnostic assertions về collision lỗi cũ được cập nhật để khẳng định error color tách khỏi authored red, không bỏ case. Native cùng final APK79a6…5b15: core28/28 (Gboard thật + phím Android), SAF18/18 (DocumentsUI/local provider, lifecycle, missing/moved), Undo23/23 và12/12 math themes có native visibility guard. Semantic/ARIA/focus/reduced-motion regression giữ nguyên. [RESULTS](../../test-results/ui-p3fr2/RESULTS.json), [gate chi tiết](P3F_R2_RELEASE_READINESS.md).

TalkBack **NOT TESTED — accepted limitation**; không bổ sung speech/gesture coverage. VNI và thiết bị/provider khác vẫn NOT TESTED. Low provider-toast technical không bị che bằng fake localized PASS; data/content/filename safety được kiểm riêng. Các failed setup/occluded screenshots nằm ở ignored raw output, không tính là visual acceptance. Không có Blocker/High ứng dụng đã biết trong gate đã điều chỉnh; không tự chuyển P4.
