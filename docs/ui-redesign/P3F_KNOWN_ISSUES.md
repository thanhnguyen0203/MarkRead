# P3F — Known Issues

28/10/2026. Không có production patch trong P3F. Các vấn đề dưới đây không bị che bởi2.097 automated checks xanh.

## F01 — High: Replace không có undo transaction

Tái hiện trên Source hiển thị: nhập `# History\n\none one\nnative`; positive controls typing Undo/Redo đạt; tìm `one`, Replace một thành `two`; đóng Search, Undo/Redo. Expected nếu hỗ trợ replacement history: Undo trả source trước Replace. Actual: source vẫn `two one`. Android15/WebView124 và Chromium156 cùng kết quả. [Evidence](../../test-results/ui-p3f/android/undo-webview.json).

Nguyên nhân source có thể xác minh: thao tác Replace cập nhật textarea.value qua cơ chế hiện hữu, không tạo undo transaction. Phân loại **giới hạn thiết kế/integration hiện tại**, không phải bằng chứng lỗi Android riêng. Replace/source/export đúng bytes trong các ca đã chạy; chưa phát hiện autosave hoặc ghi đè gốc. Rủi ro High: người dùng không hoàn tác được replacement không mong muốn và có thể không phục hồi draft trước đó.

Chặn chuyển P4 nếu chưa có quyết định rõ. Không tự viết lại editor/Undo. Kế hoạch riêng cần duyệt: chọn phương án transaction/native editing hoặc history model có giới hạn; trước hết test Replace một/all, regex/captures/zero-length/Unicode, selection, multiple files, composition đang diễn ra, dirty/export và native Undo/Redo trên WebView tối thiểu/hiện tại. Chỉ dùng native editing nếu có bằng chứng API phù hợp, fallback và undo grouping đúng; không chỉ đổi `value=` thành một API rồi coi đã sửa.

## F02 — Medium: màu lỗi LaTeX inline không đủ contrast

Fixture: `$\notARealCommand{x}$`, so với math bình thường và công thức chủ động `$\color{#cc0000}{x}$`. Unknown-command output từ KaTeX có inline `#cc0000`, không có `.math-error/.katex-error` riêng để phân biệt an toàn. Normal math đủ7.65–13.39; lỗi đỏ đạt2.12–3.39 ở9 theme tối, thấp hơn4.5. Light5.89/Sepia5.13/Tokyo-light4.55 đạt. [Browser](../../test-results/ui-p3f/LATEX_BROWSER.json), [Android](../../test-results/ui-p3f/android/latex-webview.json), [ảnh Dark](../../test-results/ui-p3f/android/math-dark.png).

Không phải chứng minh toàn bộ LaTeX nhạt: math bình thường kế thừa foreground đúng. Không sửa công thức, MathML hoặc override mọi inline red; làm vậy phá ý định màu của tác giả/custom CSS. Không có CSS-only patch được xác minh là phân biệt được hai nguồn màu. Cần phạm vi riêng cho error presentation/config hoặc typed marker, review trước release; giữ math DOM/custom CSS/explicit color tests.

## F03 — High validation gap: chưa nghiệm thu IME Việt

Gboard có trên API35; actual touchscreen keys tạo beforeinput/input. Attempt `tieengs vieetj ` ra Latin thô; chưa xác minh layout tiếng Việt composing đang hoạt động, nên **inconclusive**, không quy lỗi cho MarkRead. Telex/VNI, sửa dấu, xóa, composition/caret, multiline, native copy-paste/selection và mở/đóng docked keyboard cần manual QA trên layout đúng. Không nhận `adb input text`, JS value hoặc synthetic keydown làm bằng chứng IME.

Trước P4: mở Gboard Languages, chọn Vietnamese/Telex; xác minh bàn phím ngoài app cũng tạo `tiếng Việt`; sau đó dùng cùng layout trong Source, unified và Search/Rename. Nếu lỗi chỉ xuất hiện trong MarkRead, ghi native composition sequence và source trước/sau rồi phân loại; mọi mất/sai nội dung phải thành **Blocker**.

## F04 — High validation gap: TalkBack chưa nghiệm thu

TalkBack đã bind/touch exploration enabled; injected activation Settings không đạt và UiAutomation root không ổn định. Chưa có bằng chứng speech/swipe/activation đầy đủ. Đây là failure của attempt cần manual diagnosis, chưa có root cause đủ để sửa app. Không thêm ARIA hoặc thay focus trap chỉ để né automation.

Trước P4: kiểm bằng TalkBack thật file tree/names/current, Settings categories/themes, modal order/return focus, Search count/error/toggles, editor/unified exit, Rename và SAF; nghe lời đọc, không chỉ chụp screenshot. Nếu trap/mất tên/focus không truy cập được, phân loại lỗi cụ thể và bổ sung regression tương ứng.

## F05 — Medium: performance cần profile kiểm soát

Native gfxinfo trong6 Settings cycles có78frames,16janky(20.51%),p50 27ms,p90 53ms. Không đủ cơ sở quy nguyên nhân hoặc tính FPS WebView; có instrumentation/emulator/tải host chia sẻ. Cần lặp cold/warm, dài gần5MiB, scrolling/search/theme/keyboard, nhiều ảnh/math/diagrams trên thiết bị hoặc emulator kiểm soát, thu trace bao phủ compositor. Không thay renderer để tối ưu theo một mẫu counters.

## F06 — Medium validation gap: provider/lifecycle coverage

Chưa thử revoke grant, provider chỉ đọc, lỗi ghi/hết dung lượng, SD card/cloud, API gần26/WebView100, physical device, native fallback khi provider lỗi hoặc max system text/display size. Tree/read/export/rename/empty/missing-file thật đã đạt; policy/JVM mocks không thay thế các tình huống còn thiếu. Không dùng clear app data/uninstall hoặc gây crash draft thật để dựng case.

## F07 — Low QA infrastructure: runner lịch sử

Legacy `ProbeInstrumentation` và `run_emulator_tests.py` còn assumptions UI cũ, có nhánh uninstall; không được dùng như green gate. P3F thêm driver/test APK riêng và evidence hiện tại, không đổi Gradle instrumentation runner. Trước CI/native release gate cần cập nhật runner có opt-in fixture guard, không destructive trên app đang chứa dữ liệu. Các probe sơ bộ ẩn Source/duplicate const/Back timing được ghi superseded trong raw checks, không phải regression ứng dụng.

Chưa có bằng chứng **Blocker gây sai/mất nội dung** trong case hợp lệ đã chạy. Đây không phải chứng nhận không còn Blocker ở các case NOT TESTED. Xem [release gate](P3F_RELEASE_READINESS.md).
