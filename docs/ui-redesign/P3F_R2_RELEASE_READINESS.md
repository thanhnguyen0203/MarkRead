# P3F-R2 — Final Release Gate

29/10/2026. **READY FOR P4** theo tiêu chí người dùng đã điều chỉnh và phạm vi kiểm thử API35/WebView124. Không còn lỗi Blocker/High đã biết trong các luồng nghiệm thu; không tự triển khai P4.

## Tiêu chí được người dùng điều chỉnh

TalkBack: **NOT TESTED — accepted limitation** theo quyết định của người dùng. Không đánh dấu PASS và không dùng riêng khoảng trống TalkBack để chặn P4. Giữ nguyên semantic HTML, ARIA, focus, keyboard và các cải thiện accessibility hiện có. Không tiếp tục test speech/traversal chuyên sâu.

## Hai thay đổi ứng dụng có bằng chứng

1. **LaTeX error contrast:** màu mặc định `#cc0000` của KaTeX không đủ tương phản ở dark, black, tokyo-night, blue-gray, nord, dracula, rose-pine, forest, gruvbox. Công thức hợp lệ vốn đủ contrast. Nối tùy chọn hiển thị `errorColor` hiện có với `resolvedThemes[settings.theme].tokens['mr-error']`. Không thay KaTeX, cú pháp/logic Markdown, DOM mapping hay công thức. Dùng màu hex đúng định dạng [KaTeX options](https://katex.org/docs/options); thử CSS variable đã bị loại vì MathML không xử lý nhất quán. Không dùng selector blanket override màu của tác giả.
2. **Literal Search/Replace:** Gboard thực tế nhập `tieengs` vào Search thành `Tiếng` do ô text chưa tắt auto-capitalize. Thêm `autocapitalize="off"` chỉ cho `findInput` và `replaceInput`. Editor giữ kiểu nhập tự nhiên; ID, ARIA, events, worker, native bridge và caret logic không đổi. Native Gboard đã xác nhận query `tiếng` và replacement `việt` giữ đúng chữ thường trên APK cuối.

Không thêm dependency, analytics, network access, Java app API, version/applicationId hoặc signing configuration. DEX production được đối chiếu byte với APK P3F-R; helper QA là APK test riêng.

## Kết quả đã xác minh

- Baseline trước sửa:2201/2201, palette2220/2220.
- Sau cả sửa màu và input flags: **2297/2297 automated PASS** =2201 kế thừa +96 mới; palette **2220/2220 PASS**, debug APK **18/18 PASS**. Node132 + browser1969 + JVM171 + baseline APK25; runtime không cộng vào tổng2297.
- LaTeX:12 theme Chromium và12 theme WebView124 đã đạt valid glyphs, lỗi unsupported inline/display và lỗi cú pháp. Màu tác giả giữ nguyên; custom CSS `!important` vẫn ưu tiên như trước. Tỷ lệ lỗi renderer trên WebView ở lần xác minh đầu: Dark7.83, Light6.60, Sepia6.38, Black9.89, Tokyo-night8.48, Tokyo-light6.92, Blue-gray9.18, Nord9.36, Dracula8.74, Rosé Pine8.76, Forest9.42, Gruvbox9.18. Đã lặp đủ12 theme trên APK cuối có input flags, với guard xác nhận native UI không bị popup/fallback che; ảnh cũ bị che không được nhận làm bằng chứng trực quan.
- 12 assertion diagnostic vốn xác nhận collision màu lỗi cũ được đổi có chủ đích sang xác nhận tách biệt generated error color và authored red. Không bỏ test hoặc giảm số lượng.96 mới đo DOM/glyph thực, source/MathML, parse errors và custom CSS; không chỉ kiểm palette.
- Gradle8.9/AGP8.7.3/JDK17: `scripts/Build-AndroidDebug.ps1 -Offline -RerunTasks` thành công31 tasks,1m39 trên bản có input flags.
- APK cuối: [app-debug.apk](../../app/build/outputs/apk/debug/app-debug.apk), bản giữ riêng [MarkRead-P3FR2-debug.apk](../../build/ui-p3fr2/MarkRead-P3FR2-debug.apk),7607250 bytes, SHA256 `79a6d98d83855bee3f3e621c696c0bc6580f9d8252300adbc87cda4f6f575b15`. Renderer13313023 bytes, SHA256 `9be329e41e942ed481f375d1e2e84738cebedb8a696ea6b9d16fee1dc109df68`.

## Runtime và phương pháp

Dùng riêng `MarkRead_P3FR_Validation`/emulator5556, API35/WebView124; không cài đè, dừng hoặc đọc nội dung phiên5554 của người dùng. QA có mạng tắt, Gboard Vietnamese QWERTY đã cài sẵn. Ký tự do phím chạm Gboard thực nhập; selection/Copy/Paste/Undo/Delete dùng phím Android thật, không JS keydown simulation. JS chỉ thiết lập fixture, gọi UI, ghi giá trị/caret và quan sát sự kiện trusted. Clipboard được seed bằng sentinel trước Paste, bản cũ giữ opaque trong RAM helper và trả lại khi kết thúc; không export clipboard cũ.

Các attempt setup được giữ riêng: UIAutomation selection action không khả dụng; phím inject trước khi WebView có focus Android không đi vào input; ADB keycombination để Ctrl trong trạng thái meta của Gboard khiến Backspace trở thành `deleteWordBackward`. Đã xác minh nhả Ctrl làm `deleteContentBackward` đúng. Đây là protocol của harness, không sửa editor để loại Ctrl. Ca capitalization là lỗi UX thực và được sửa ở input metadata. Không gộp các attempt này thành PASS.

## Runtime cuối — cùng APK SHA79a6…5b15

- **PASS — Gboard/editor:28 assertions**, gồm27 functional và1 fixture cleanup. Gboard Telex nhập câu có dấu; sửa dấu và thay từ giữa câu; caret/selection bằng phím Android; Backspace/Delete; Copy/Paste Unicode; Enter nhiều dòng; Undo/Redo sau typing, Delete, Backspace và Paste; chuyển Source/Search/Replace đúng literal case; nhập lại ở Source; Home/resume giữ dirty/caret; Back đóng IME rồi Source→Read; native dirty-exit warning và “Ở lại” giữ source. Không nhận JS assignment hoặc keydown giả làm bằng chứng Gboard. [IME_CORE](../../test-results/ui-p3fr2/IME_CORE.json).
- **PASS — Undo/Replace:23/23 native** trên WebView124, bổ sung68 browser checks kế thừa (single/all/nhiều block/captures/Unicode/mode/fail-closed/composition guards). [UNDO_WEBVIEW](../../test-results/ui-p3fr2/UNDO_WEBVIEW.json).
- **PASS — SAF:18/18 assertions** trên DocumentsUI/local provider, thư mục UUID fixture riêng. Read/nested, Replace All, export hash khớp, original bytes giữ nguyên, Undo sau export, rename Unicode và `.md→.txt`, persisted tree sau clean Activity recreation, saved copy reopen, deleted/moved file không thay content/filename của tài liệu đang đọc. [SAF](../../test-results/ui-p3fr2/SAF.json).
- **PASS — LaTeX12/12 themes**: browser trước/sau393×852 và native screenshots top/bottom320×640; computed glyph/operator/error contrast, không suy từ palette. [Browser measurements](../../test-results/ui-p3fr2/LATEX_RELEASE.json), [WebView](../../test-results/ui-p3fr2/LATEX_WEBVIEW.json), [ảnh trước/sau](../../test-results/ui-p3fr2/math/), [ảnh Android](../../test-results/ui-p3fr2/android/).
- **PASS — build/packaging/data boundaries**: Gradle assembleDebug, signature/alignment/CRC/CSP,23 Lucide SVG, offline fonts,12 theme/custom CSS, Markdown DOM, accessibility/focus/reduced-motion regression. AppId/version115/1.1.5, permissions, signing certificate, dependency files và DEX production giữ nguyên. SHA APK thực cài khớp host. [APK checks](../../test-results/ui-p3fr2/APK_CHECK.json), [environment](../../test-results/ui-p3fr2/ANDROID_ENVIRONMENT.json), [artifacts](../../test-results/ui-p3fr2/ARTIFACTS.json).
- **ACCEPTED LIMITATION — TalkBack:** `NOT TESTED — accepted limitation`. Không tiếp tục test chuyên sâu, không đổi thành PASS, không chặn P4.
- **NOT TESTED:** VNI riêng trên keyboard hiện tại; physical device/API26/WebView100; provider chỉ đọc/cloud/SD/low-storage; mọi biến thể IME/composition; process-death recovery của draft; FPS. Telex core đã thử thật, VNI chưa thử không phải app FAIL. Draft vẫn là dữ liệu trong phiên theo thiết kế; không thêm cơ chế lưu ngầm.
- **FAIL ứng dụng còn mở:** không có Blocker/High trong phạm vi đã chạy. **Low UX:** provider mất/move file có thể trả thông báo tiếng Anh dài/technical; app vẫn báo lỗi và giữ nguyên working content/filename, không crash hoặc ghi đè. [Provider errors](../../test-results/ui-p3fr2/PROVIDER_ERRORS.json).

Một lần System UI của AVD hiện popup không phản hồi và che fallback MarkRead. Root cause chưa xác định; không quy thành app ANR. Chọn Wait/Continue waiting, loại ảnh bị che, rồi chạy lại12 theme có visibility guard cùng toàn bộ core/SAF/Undo trên UI hiển thị thật; không lặp lại trong chuỗi nghiệm thu đó. Không có FATAL EXCEPTION/ANR của `vn.markread.local` trong log lọc đã thu. Đây vẫn là giới hạn môi trường/performance cần profile thiết bị thật, không chứng nhận60FPS. [Log](../../test-results/ui-p3fr2/LOGCAT.txt).

Các attempt thất bại của harness được giữ ở ignored `build/ui-p3fr2/runtime`: Ctrl+Backspace do modifier injection, native selection action không khả dụng, nhãn nút Stay uppercase, giả định toast tiếng Việt không đúng với exception provider, cùng ảnh bị System UI che. Kết quả nghiệm thu lấy từ case hoàn chỉnh trên APK cuối; không nói mọi attempt đều PASS. Clipboard/tùy chọn QA tạm đã trả lại, fixture sạch và AVD5556 đã đóng;5554 của người dùng vẫn chạy.

## Phạm vi nghiệm thu và các giới hạn

PASS LaTeX áp dụng cho màu mặc định và màu lỗi do renderer quyết định trên12 theme. Công thức chủ động `\color{...}` và CSS người dùng vẫn có thể chọn màu thấp contrast; không ép đổi ý định tác giả hoặc hạ custom CSS precedence.

VNI chỉ kiểm nếu môi trường hỗ trợ; chưa có bằng chứng VNI không phải lỗi MarkRead. Physical device, API26/WebView100, provider chỉ đọc/cloud/SD/low-storage, mọi biến thể composition và FPS không được nhận PASS từ các tests hiện tại. Không khẳng định60FPS. READY FOR P4, nếu đạt, chỉ là gate chuyển giai đoạn đã nêu, không phải chứng nhận mọi thiết bị/provider.

## File và rollback

App: `web/src/app.js` (một option trình bày), `web/src/shell.html` (hai input flags), generated `app/src/main/assets/index.html`/web dist. Tests: cập nhật diagnostic trong `math-remediation-ui.cjs`, thêm `math-release-ui.cjs`; giữ regression source/editor/search hiện có. QA: mở rộng phase guard và clipboard an toàn trong helper riêng, scripts math/core/SAF. Không đóng gói chúng vào APK app.

Rollback riêng R2 bằng snapshot `build/ui-p3fr2/before/workspace`: khôi phục3 file app kể trên và diagnostic assertion, bỏ test/helper R2 mới nếu cần rồi build lại. Không reset HEAD hoặc làm mất P3C–P3F-R chưa commit; không uninstall/clear data để rollback. Bản trước R2 có lỗi contrast/auto-capitalize đã biết.

Không triển khai P4 trong lượt này.

Verification cuối: 55 JS source/build/test files syntax PASS, HTML/dist/APK asset parity PASS. [Scope](../../test-results/ui-p3fr2/SCOPE.json).
