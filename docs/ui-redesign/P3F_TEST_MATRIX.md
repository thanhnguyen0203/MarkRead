# P3F — Test Matrix

28/10/2026. **PASS** chỉ áp dụng đúng phương pháp/case đã nêu. **FAIL** là expectation chưa đạt hoặc known defect được tái hiện. **NOT TESTED** là thiếu precondition/bằng chứng; không đổi thành PASS nhờ unit test. Tổng runtime record không cộng vào automated count.

| Nhóm / case | Loại bằng chứng | Kết quả | Bằng chứng / giới hạn |
|---|---|---|---|
|2.061 kiểm tra kế thừa trước/sau|Node/Chromium/JVM/baseline APK|PASS|[SUITES](../../test-results/ui-p3f/SUITES.json), không bỏ assertion|
|36 math/custom CSS mới|Desktop Chromium|PASS|Normal contrast, precedence, explicit formula color; không bao gồm9 known error-color failures|
|Palette2.220,12 theme,23 SVG|Arithmetic/Node/browser|PASS|[PALETTE](../../test-results/ui-p3f/PALETTE.json)|
|Source/renderer/editor/bridge/dependency/Manifest integrity|Hash/static/build|PASS|126 file đầu vào không đổi; zero app permissions; không bật debug bridge|
|Web/dist = Android asset = APK asset|Byte/hash/static APK|PASS|[ARTIFACTS](../../test-results/ui-p3f/ARTIFACTS.json)|
|Gradle assembleDebug/signature/alignment/packaging18|Local Android build|PASS|Rebuild byte-identical P3E; bản cài emulator cùng SHA|
|Cài cập nhật debug, startup|Android Emulator API35/WebView124|PASS|install-r, UI/bridge ready; không clear data|
|Fresh install với dữ liệu trống|Android|NOT TESTED|Không xóa data hay uninstall bản sẵn có|
|Cold restart trên existing fixture scope|Android|PASS|LaunchState COLD,1.574ms Activity launch, screenshot; không phải full content-ready latency|
|Markdown Việt/Unicode/list/code/table/math|Android WebView|PASS|Fixture source/hash, native render và250 chapters|
|Local image|Android WebView|PASS một phần|Blob admitted trong DOM; decode/tỉ lệ mọi định dạng không được đo riêng. Browser suite kiểm natural sizes|
|Merriweather offline/custom CSS|Android và browser|PASS|Font ready, underline có hiệu lực, source không đổi|
|12 theme không biến đổi source|Android|PASS|12 runtime assertions + default math measurement|
|Source selection, native typing Undo/Redo|Android WebView native editing API|PASS|Probe cuối Source hiển thị; execCommand có positive controls, không gọi đó là IME typing|
|Plain/Case/Regex/Previous/Next|Android WebView|PASS|Worker thật của app trong WebView; một số control kích hoạt bằng instrumentation JS|
|Replace một/all/Unicode/captures/invalid regex|Android WebView|PASS|Source đúng expected, dirty và error guard giữ nguyên|
|Undo sau Replace|Android WebView124 + Chromium156|FAIL|Không trở về source trước Replace; [probe](../../test-results/ui-p3f/android/undo-webview.json)|
|Save UTF-8 và không ghi đè gốc|Real Android DocumentsUI/SAF|PASS|Bản xuất tên mới đúng SHA; file gốc đúng SHA|
|Mở lại bản xuất/prev-next|Real SAF tree read + WebView|PASS|Source khớp bản xuất, boundary/navigation đúng fixture|
|Chọn tree, đọc thư mục con|Real Android system picker|PASS|Grant root fixture, scoped index/read|
|Long-press/rename Unicode/đuôi.txt|Real pointer hold + native SAF|PASS|Rename thật, giữ source RAM và bytes file gốc|
|Thư mục Empty|Real Android picker/SAF|PASS|Grant Empty,0 tài liệu, screenshot|
|File fixture không còn tồn tại|Real shared-storage deletion + SAF read|PASS|Lỗi hiển thị, tài liệu/source hiện tại không đổi|
|Grant bị thu hồi/provider read-only/không thể ghi|Android provider thật|NOT TESTED|JVM/host mô phỏng không thay thế provider test|
|SAF không vượt scope|Policy/JVM/static|PASS|Runtime picker chỉ dùng fixture; thử URI escape thực trên provider chưa làm|
|SD card/cloud provider|Android|NOT TESTED|Chỉ external-storage provider của emulator|
|Home/return/orientation giữ draft|Android UI thật|PASS|Source equality trước/sau|
|Activity recreation sạch|Android Activity.recreate|PASS|Khôi phục đúng fixture/grant/source, không có draft khi recreate|
|Back qua IME/Search/Settings|Android KEYCODE_BACK|PASS|Chờ stack Gboard handwriting/popup/IME; không giả định luôn chỉ2 lần nhấn|
|Process death khi đang có draft|Android|NOT TESTED|Không cố tình làm mất bản sửa RAM|
|Native fallback/recovery WebView lỗi|JVM/browser policies|PASS ở policy; runtime NOT TESTED|Không downgrade/crash WebView để ép nhánh|
|Gboard chạm phím Latin|Android keyboard thật|PASS observation|Input events thực, [IME log](../../test-results/ui-p3f/android/ime-observation.json)|
|Telex/VNI/sửa dấu/composition Việt/copy-paste|Android keyboard Việt|NOT TESTED|Attempt Telex ra Latin thô, chưa xác nhận layout composing đúng; không quy là lỗi app|
|Keyboard insets/focus|Android smoke + browser matrix|PASS smoke, NOT TESTED toàn diện|Floating/handwriting và một số keyboard transitions; chưa đủ docked Việt/max scaling|
|TalkBack service bind|Android accessibility service|PASS observation|Dumpsys bound + touch exploration enabled|
|TalkBack injected activation Settings|Android automation attempt|FAIL / inconclusive|Expected mở dialog, actual chưa mở; root cause app/input chưa được chứng minh|
|TalkBack manual swipe/announcements/editor/SAF|Android|NOT TESTED|Không nhận ARIA/browser xanh là TalkBack đạt|
|Focus/semantics/disabled/reduced motion/responsive/custom CSS|Browser + unit/JVM|PASS|Giữ các suite P2/P3; chưa thay thế TalkBack/min WebView device|
|48dp target ở emulator density420|Android geometry|PASS ở cấu hình này|48CSSpx×2.625nativepx/CSSpx÷2.625px/dp; không tổng quát mọi density/font|
|Font200%/six widths/landscape|Browser|PASS|320/360/393/412/600/800 và landscape; native system max-font chưa thử|
|Math thường contrast12 theme|Browser + Android|PASS|7.65–13.39|
|Unknown-command math error contrast|Browser + Android|FAIL ở9/12 theme|#cc0000 inline,2.12–5.89;3 theme sáng đạt4.5|
|Frames Settings6 cycles|Native gfxinfo|PASS thu số đo; chưa đạt performance acceptance|78frames/16jank,p50 27ms,p90 53ms; không đầy đủ WebView FPS|
|Tài liệu gần5MiB/8 diagrams/many images/p95 input|Android|NOT TESTED|Native fixture≈81KB, browser long≈173KB; không extrapolate|
|API gần26/WebView100/physical device|Android|NOT TESTED|Chỉ emulator35/WebView124|

Raw runtime [checks.json](../../test-results/ui-p3f/android/checks.json):74 record gồm66 PASS,1 FAIL attempt TalkBack và7 superseded NOT TESTED. Các observation “reproduce Undo limitation” PASS chỉ xác nhận tái hiện, **không** làm dòng Undo acceptance trở thành PASS. Các failure do precondition/snippet được giữ note, không sửa app để làm chúng xanh.
