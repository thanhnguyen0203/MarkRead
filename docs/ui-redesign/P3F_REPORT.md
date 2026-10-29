# P3F — Final QA & Android Validation

Ngày: **28/10/2026**. Kết luận: **NOT READY để chuyển P4**. Đã thực hiện QA trên **Android Emulator API35 thật** và desktop Chromium; chưa kiểm thử thiết bị vật lý. Không sửa production code, engine, bridge, dependency, version hoặc signing.

## Kết quả chính

- Giữ **2.061/2.061** kiểm tra kế thừa, chạy trước/sau; thêm **36/36** kiểm tra math/custom CSS. Tổng automated **2.097/2.097**, 0 thất bại. Palette **2.220/2.220**, APK **18/18** tính riêng.
- Android runtime có **74 bản ghi**: **66 PASS quan sát/assertion**, **1 FAIL của lượt kích hoạt TalkBack bằng input tự động**, **7 NOT TESTED đã bị thay thế** do lỗi/precondition của harness. Đây không phải tuyên bố 66 tính năng đã nghiệm thu đầy đủ. Các ca chưa đủ môi trường và lỗi đã biết nằm trong [matrix](P3F_TEST_MATRIX.md).
- SAF thật: chọn tree bằng DocumentsUI, đọc thư mục con, xuất bản sao UTF-8 đúng SHA-256, không ghi đè gốc, rename Unicode/đuôi `.txt`, mở lại bản xuất, trước/sau, folder rỗng và lỗi fixture bị thiếu đã được kiểm tra.
- Undo/Redo của nhập text có positive controls đạt trên Source hiển thị. **Replace vẫn không hoàn tác được bằng Undo trên WebView124**, khớp Chromium. Không sửa undo architecture.
- Math thường đủ contrast cả12 theme trên browser và Android. **Màu lỗi inline KaTeX `#cc0000` không đạt4.5 ở9 theme**, thấp nhất2.12. Không đổi toàn bộ màu math hoặc công thức để che vấn đề.
- Gboard có nhận touch trên keyboard thật; chưa xác nhận được layout composing Telex/VNI. TalkBack đã bind nhưng lượt input tự động không xác nhận được luồng sử dụng. **Không đánh dấu IME Việt/TalkBack nghiệm thu PASS.**

Các quyết định release và việc phải làm tiếp: [RELEASE_READINESS](P3F_RELEASE_READINESS.md), [KNOWN_ISSUES](P3F_KNOWN_ISSUES.md).

## Đầu vào, skill và source audit

Đối chiếu Design System Quiet Ink — [MASTER](../../design-system/markread/MASTER.md), [COMPONENTS](../../design-system/markread/COMPONENTS.md), [MOTION](../../design-system/markread/MOTION.md), [ACCESSIBILITY](../../design-system/markread/ACCESSIBILITY.md) — và tài liệu P0–P3E, đặc biệt [checklist](REGRESSION_CHECKLIST.md), [Build Gate](ANDROID_BUILD_GATE.md), [P3C](P3C_REPORT.md), [P3D](P3D_REPORT.md), [P3E](P3E_REPORT.md). Không ghi đè các tài liệu đó. Dùng [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md), Quick Reference và local search `color contrast readability` để phân biệt contrast, màu lỗi, màu tùy biến, focus và bằng chứng runtime.

HEAD đầu vào `d5a7e5b`, có P3C/P3D/P3E chưa commit. Lưu snapshot126 file, Git status và APK P3E trong `build/ui-p3f/before`; không reset/stage/commit. **126 file đầu vào khớp hash sau P3F**; diff Gradle `.kts` và dependency/lockfile rỗng. [SCOPE.json](../../test-results/ui-p3f/SCOPE.json) ghi delta P3E→P3F; Git diff so HEAD vẫn bao gồm các giai đoạn trước.

Kiểm tra source/generated/APK, zero requested permissions, CSP từ chối network, reader sandbox,23 Lucide SVG offline và font embedded. Hash xác nhận Java/bridge/editor/renderer/search/persistence/SAF/themes/custom CSS không đổi. Không thêm Internet/storage permission, telemetry, JavaScriptInterface hoặc bật WebView remote debugging. Runtime còn xác nhận không có `window.Native/window.Android` interface và bridge ứng dụng đã ready.

## Thiết bị, phương pháp và phạm vi

Emulator `emulator-5554`: Android15/API35, `sdk_gphone64_x86_64`, WebView `com.google.android.webview` **124.0.6367.219**,1080×2400 px, density420dpi, DPR2.625. Cài APK bằng **`adb install -r`**, không clear data, uninstall, force-stop, hạ WebView hoặc cố tình gây crash. Đây là cài cập nhật trên dữ liệu sẵn có, **không phải fresh-install QA**.

Gboard **14.2.09.629370537-preload-x86_64** và TalkBack có sẵn. Không có thiết bị vật lý/API gần26 được thử. API/version lấy từ hệ thống đang chạy, không suy từ tên AVD. ADB được gọi ngoài sandbox sau khi xác minh quyền thực thi phù hợp.

Test driver riêng ở `qa/android/`, build bằng JDK/SDK/debug key hiện có thành **test APK riêng**, không nằm trong production APK. Driver dùng Instrumentation/evaluateJavascript để đọc state và smoke control trong WebView; SAF picker, save, long-press, Back/orientation/Home và thao tác Gboard dùng Android UI thật. **JavaScript field assignment/execCommand không được gọi là nhập liệu IME thật.** Driver không thêm bridge/API ứng dụng, permission hoặc network socket. Các command QA nằm trong cache riêng của phiên ADB debug.

Fixture là Markdown tiếng Việt/Unicode, nested lists, code/table/math, local PNG, CSS,250 chương dài khoảng81KB; folder riêng có prefix `MarkReadP3F_`, không chứa dữ liệu cá nhân. Không đọc/sửa tài liệu thật. Chỉ xóa đúng `04_Missing.md` do QA tạo để kiểm tra lỗi file thiếu. Các sửa source tạm đã được lưu thành evidence/bản xuất khi cần, sau đó trả fixture về byte gốc trước recreation/đóng driver. Không ép đóng một phiên người dùng có draft.

IME subtype/enabled list, accessibility và orientation settings do QA thay đổi đã được khôi phục. App appearance được kiểm thử và để Dark/Sans/unified off; scope cuối là fixture với bản xuất sạch. Test APK và fixture vẫn ở emulator; không tự gỡ ứng dụng hoặc xóa dữ liệu để dọn môi trường.

## Reader, editor, lifecycle và SAF

Đã đọc source qua SAF và so SHA với fixture LF, kiểm tra mapping `data-start/end`, math/code/table, local image blob và Merriweather offline; custom CSS có hiệu lực và source giữ nguyên. Image smoke xác nhận được local blob trong DOM; không coi đó là phép đo decode mọi định dạng ảnh trên Android. Browser reader suite kế thừa kiểm thêm kích thước/tỉ lệ ảnh, tài liệu173.410 byte, source spans, inline/split, custom CSS và scroll.

Đã kiểm12 theme không thay source;250 heading/code blocks trong long fixture và cuộn tới cuối; selection/draft qua các overlay; Home/return và orientation giữ source. Clean Activity recreation khôi phục tài liệu đã có grant và source đúng byte. Khởi động lại COLD sau khi driver kết thúc và không còn draft có screenshot. Chưa kiểm process death khi có draft, do draft RAM không có hợp đồng tự persist; không cố tình gây mất nội dung.

SAF save dùng ACTION_CREATE_DOCUMENT qua picker thật với tên mới `P3F_saved.md` trong folder QA; SHA bản xuất khớp editor, gốc không bị ghi đè. Rename dùng long-press700ms trên UI, đổi sang tên tiếng Việt/Unicode và `.txt`; source RAM không đổi, file native giữ SHA gốc. Reindex root rồi mở lại bản xuất qua SAF và prev/next đúng source. Folder Empty qua picker hiển thị0 tài liệu. File fixture đã bị xóa báo lỗi và giữ tài liệu/source đang mở.

Chưa xác minh read-only provider, revoke grant thật, SD card/cloud provider hoặc lưu thất bại do hết dung lượng. Policy/JVM và host simulations có kiểm tra giới hạn quyền/lỗi ghi, nhưng không thay các ca provider Android này.

Android Back được kiểm theo lớp Gboard handwriting/popup/IME rồi Search và Settings. Các expectation quá sớm/max2 lần nhấn trong harness ban đầu không đúng với các lớp IME đang hiện, được ghi là superseded; ca cuối đóng đúng UI và giữ source. Không đổi Back state machine để làm test xanh.

## Search/Replace và Undo

Runtime đạt plain/case-insensitive tiếng Việt, case-sensitive, Previous/Next, Replace một/all, regex capture, invalid regex/disabled, dirty state và source không bị thay khi lỗi. Bản xuất sau Replace khớp UTF-8 và mở lại được. Không quan sát sai replacement content hoặc ghi đè gốc ngoài ý muốn trong các ca đã chạy.

Probe cuối dùng **Source hiển thị**, typing Undo/Redo làm positive controls:

```text
Trước Replace: # History\n\none one\nnative
Sau Replace:   # History\n\ntwo one\nnative
Sau Undo:      # History\n\ntwo one\nnative
Sau Redo:      # History\n\ntwo one\nnative
Kỳ vọng Undo nếu có replacement transaction: trở lại dòng trước Replace.
```

[undo-webview.json](../../test-results/ui-p3f/android/undo-webview.json) đối chiếu [Chromium P3D](../../test-results/ui-p3d/HISTORY.json). Đây là **High — thiếu undo transaction cho Replace**, cùng cơ chế gán textarea.value trên hai engine; chưa có bằng chứng lỗi riêng Android hoặc thuật toán replacement làm sai source. File gốc vẫn còn, nhưng người dùng có nguy cơ không phục hồi được thao tác Replace ngoài ý muốn cùng các draft trước đó. Không tự viết lại undo/redo; kế hoạch riêng trong KNOWN_ISSUES.

Probe sơ bộ bị ảnh hưởng bởi unified mode có textarea Source ẩn và một xung đột biến `const` trong snippet QA. Không dùng chúng làm bằng chứng IME/history;7 bản ghi bị thay thế được giữ với trạng thái NOT TESTED và giải thích. Helper sau sửa yêu cầu fixture tree và Source thực sự hiển thị. Production code không bị chỉnh để né lỗi harness.

## IME, TalkBack và LaTeX

IME: đã chạm các phím Gboard thật, ghi beforeinput/input. Chuỗi Telex thử `tieengs vieetj ` ra Latin thô, không có composition events trong attempt đó; trang settings còn thể hiện English đang được bật. Do chưa xác nhận được layout tiếng Việt composing, **không kết luận MarkRead làm hỏng Telex**, cũng không đánh dấu Telex/VNI đạt. Keyboard Latin/touch có bằng chứng nhưng sửa dấu, VNI, composition Việt, copy/paste/selection bằng IME và full docked-keyboard insets còn cần vòng manual.

TalkBack: dumpsys xác nhận service bind và touch exploration enabled. Lượt injected touch/double-tap Settings không đạt, UiAutomation không lấy root đáng tin cậy trong các bước sau. Ghi nhận **1 FAIL của attempt**, chưa xác định lỗi app hay cơ chế input của driver. Chưa nghe/đánh giá lời đọc, swipe order, native text-selection hoặc toàn bộ workflows; nghiệm thu TalkBack **NOT TESTED**.

Math: ordinary text contrast browser/Android cùng **7.65–13.39**, đủ≥4.5. Lỗi unknown command dùng `#cc0000`: Dark2.68, Blue-gray2.24, Nord2.12;9 theme tối không đạt,3 theme sáng đạt. Đây là màu inline do KaTeX trả về, cùng màu với công thức người dùng chủ động `\color{#cc0000}{x}`; không có semantic error class riêng để CSS phân biệt an toàn. Không thêm selector theo chuỗi màu để đổi cả màu công thức người dùng, không sửa renderer/config ngoài phạm vi.36 test mới kiểm normal contrast, custom CSS precedence và giữ explicit formula color; **9 phép đo lỗi contrast FAIL được báo riêng**, không bị biến thành36 test PASS. Chi tiết [LATEX_BROWSER](../../test-results/ui-p3f/LATEX_BROWSER.json) và [Android](../../test-results/ui-p3f/android/latex-webview.json).

## Performance và stability

Android `am start -W`: process trước launch vắng mặt, **LaunchState COLD**, Activity TotalTime **1.574 ms (khoảng 1,57 giây)**, WaitTime 1.584 ms. Đây không phải thời gian full Markdown paint/font/image-ready, không có cold/warm statistical benchmark.

`dumpsys gfxinfo framestats` trong6 lần Settings mở/đóng: **78 native View frames,16 janky (20.51%), p50 27ms, p90 53ms**. Ghi nhận cần profile tiếp; không quy nguyên nhân cho CSS hoặc extrapolate FPS WebView. Có instrumentation và tải host chia sẻ; counters native Views không bao phủ đầy đủ Chromium compositor. Không tối ưu engine theo số đo đơn lẻ, không tuyên bố60FPS.

Summary logcat **chỉ process MarkRead sau cold restart cuối** không có FATAL EXCEPTION/ANR marker; không coi đó là chứng minh toàn phiên không có crash/ANR. Không thay native fallback/lifecycle, không cố tình downgrade/crash để thử recovery.

## Build, kiểm thử cuối và file tạo

Gradle8.9 + AGP8.7.3 + JDK17, `Build-AndroidDebug.ps1 -Offline -RerunTasks`: **BUILD SUCCESSFUL47s,31 tasks**. APK debug **7.606.382 byte**, SHA-256:

`a982db7123aab3e8cb75ecce8878d103fac9056c4d21c36cf0590f3a48a24b9d`

Đường dẫn thực tế `app/build/outputs/apk/debug/app-debug.apk`. Rebuild P3F **khớp byte APK P3E**, APK cài trên emulator cũng khớp SHA này. Renderer13.310.551 byte, SHA `76b22a691fc11028dcde15396d7e5755d83d3d189a7a7bf472952674d4b8fd79`, web/dist và Android asset khớp byte. Chỉ xác nhận tái tạo trên cùng toolchain/máy, không tuyên bố cross-machine reproducible build. Không tạo APK release/đổi signing/version.

Automated: Node132 + browser1.769 + JVM171 + APK25 = **2.097**;36 mới tách khỏi2.061 cũ. Syntax **52 JS/build/test files**, parse CSS qua pipeline Node tests và resource verification. Existing policy/renderer/editor/search/accessibility/icon/responsive/custom-CSS/reduced suites giữ nguyên. [RESULTS](../../test-results/ui-p3f/RESULTS.json), [SUITES](../../test-results/ui-p3f/SUITES.json), [ARTIFACTS](../../test-results/ui-p3f/ARTIFACTS.json), [DEBUG_APK](../../test-results/ui-p3f/DEBUG_APK.json).

File mới:4 tài liệu P3F, `web/tests/qa-math-ui.cjs`, `qa/android/P3FInstrumentation.java`, `P3FTestManifest.xml`, `build_p3f_probe.py`, `runtime_p3f.py`, `p3f_scenarios.py`, `README.md` và `.gitignore` cho pycache, cùng evidence `test-results/ui-p3f/`. Không sửa file ứng dụng hoặc tài liệu cũ. Legacy `ProbeInstrumentation`/`run_emulator_tests.py` chưa được chạy vì assumptions cũ và có uninstall; helper mới là opt-in fixture QA, không tự thay Gradle runner cũ. Driver từ chối bắt đầu khi MarkRead đang chạy; CLI finish từ chối khi fixture hiện tại còn dirty.

Ảnh/log native chọn lọc trong [android evidence](../../test-results/ui-p3f/ANDROID_ENVIRONMENT.json): [SAF fixture](../../test-results/ui-p3f/android/01-system-picker-fixture.png), [reader](../../test-results/ui-p3f/android/03-reader-fixture.png), [long](../../test-results/ui-p3f/android/04-long-reader.png), [rename](../../test-results/ui-p3f/android/10-rename-extension.png), [empty](../../test-results/ui-p3f/android/31-empty-state.png), [saved reopen](../../test-results/ui-p3f/android/32-saved-reopened.png), [cold restart](../../test-results/ui-p3f/android/33-cold-restart.png), [math dark](../../test-results/ui-p3f/android/math-dark.png). Đây là screenshot emulator thật; các log browser ở thư mục before/after là loại bằng chứng khác.

## Rollback và dừng

Production không đổi nên không cần rollback app. Có thể bỏ các file QA/test/docs P3F mới; giữ evidence lịch sử nếu muốn. APK P3E backup trong `build/ui-p3f/before` cùng hash bản hiện tại. Không `git reset --hard` vì sẽ mất P3C–P3E chưa commit. Không xóa app data, revoke scope ngoài fixture hoặc gỡ app để rollback QA.

P3F hoàn tất **đánh giá**, không đồng nghĩa release gate đạt. Cần giải quyết/duyệt High Undo, kiểm thử IME Việt và TalkBack manual, review màu lỗi KaTeX, các provider SAF chưa thử và hiệu năng trên môi trường kiểm soát trước P4. **Dừng tại P3F.**
