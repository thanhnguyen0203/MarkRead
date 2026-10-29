# P3B — File Browser & Sidebar Quiet Ink

28/10/2026. Hoàn tất phần triển khai và kiểm thử tự động P3B; dừng trước P3C. **Chưa kiểm thử Android runtime trên thiết bị/emulator.**

## 1. Đầu vào và ranh giới

Đối chiếu tài liệu P0–P3A: [AUDIT](AUDIT.md), [FILE_MAP](FILE_MAP.md), [REGRESSION_CHECKLIST](REGRESSION_CHECKLIST.md), [MASTER](../../design-system/markread/MASTER.md), [COMPONENTS](../../design-system/markread/COMPONENTS.md), [ICONS](../../design-system/markread/ICONS.md), [MOTION](../../design-system/markread/MOTION.md), [ACCESSIBILITY](../../design-system/markread/ACCESSIBILITY.md), [kế hoạch](IMPLEMENTATION_PLAN.md), [P2G](P2G_REPORT.md), [P3A](P3A_REPORT.md) và [Build Gate](ANDROID_BUILD_GATE.md). Không ghi đè tài liệu cũ.

Sử dụng [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md), Quick Reference về typography, labels, targets, focus, hierarchy, states và performance. Tra cứu `hierarchical navigation long labels` trả guidance truncation phù hợp nhưng kết quả đầu về form label không đặc hiệu; truy vấn hẹp `folder hierarchy navigation` trả breadcrumbs cho website. Không dùng các kết quả này để thêm breadcrumbs/history cho ứng dụng. Thiết kế cụ thể dựa vào Quiet Ink và cấu trúc nguồn đã kiểm tra.

Git đầu vào HEAD `7fe84d0`, có P2/P3A/Build Gate chưa commit. Đã lưu Git status, hash inventory và source/test/docs/asset trước sửa ở `build/ui-p3b/before/workspace`; APK P3A nguyên bản ở `build/ui-p3b/before/MarkRead-P3A-debug.apk`. Không stage, commit, reset hoặc dọn công việc có sẵn. Chạy mới trước sửa: **1.561/1.561 PASS, palette 2.220/2.220**. Browser chạy trong workspace cô lập để giữ ảnh/bằng chứng lịch sử.

## 2. Kiến trúc và hành vi đã xác minh

Java Android + WebView, HTML/CSS/JavaScript. Sidebar ở `shell.html`; cây dựng bởi `app.js:renderFileList`, dùng `workspace.js:fileTree/orderedPaths/adjacentPath`. `DocumentStore` cấp snapshot các entry file trong scope SAF; không cấp node thư mục rỗng. Không có lazy loading folder UI hoặc navigation vào thư mục cha theo kiểu trang riêng.

Các handler tiếp tục dùng cơ chế cũ:

- Mở menu → chọn folder/files → bridge/SAF hoặc browser picker → `importFiles` → `renderFileList/openFile`.
- Filter chỉ lọc tên trong bộ tài liệu; sort directory-first và so tên theo tiếng Việt/numeric; sequence trước/sau tính trên toàn cây, không phụ thuộc filter/collapse và không wrap.
- File click gọi `openFile`; stale read được chặn bằng ticket/session; draft và view state do cơ chế cũ quản lý.
- Folder là `details/summary`; `collapsedFolders` nằm trong RAM. Filter mở các nhánh phù hợp; chọn file mở ancestor theo hành vi có sẵn. Không thêm persistence hoặc lệnh expand-all. Mặc định các nhánh chưa bị gập vẫn mở như baseline.
- Drawer phụ thuộc width 1.024 CSS px; trạng thái open trong body class, focus/isolation/Back và reduced motion từ P2C/P2G. Không thêm resize listener hoặc thay state machine này.
- Nhấn giữ 550 ms, di chuyển trên 10 px hủy, suppress click 800 ms; contextmenu/F2 mở thẳng dialog đổi tên. Không có menu file nhiều mục hoặc rename folder trong implementation hiện tại.
- Gỡ bộ tệp vẫn là gỡ scope/session và xác nhận nếu có draft, không xóa file vật lý. Native take/release grants, URI/provider policy, rename/export, lifecycle và recovery giữ nguyên.

## 3. Thiết kế mới và các nhóm thay đổi

### A — Shell/header/scope

Brand gọn hơn, tagline “Tài liệu cục bộ”, giữ logo `mr` và close target 48 px. Mở là primary duy nhất, dùng Lucide/chevron cũ; giảm khoảng trống và shadow của nút. Không thêm footer hoặc thao tác mới.

Tên scope/root có một hàng riêng, có thể xuống dòng; không còn phải chia chiều rộng với hai nút sort/gỡ. Hàng dưới hiển thị số tài liệu và hai action 48 px, gap 8 px. Khi lọc, số đếm hiển thị `k / n tài liệu` từ chính tập tài liệu hiện có, không quét SAF thêm. Không dùng live region thông báo lại mỗi lần gõ.

Filter nền và border theo token; hit area 48 px, nhãn truy cập và input ID giữ nguyên. Header dùng surface, heading, secondary, control border của theme đang chọn; không palette riêng cho Dark.

Gate nhóm A: Accessibility **68/68** sau đổi shell/header.

### B — Folder tree

Giữ chevron Lucide 16 px ở vị trí disclosure cũ; thêm `folder-open` 24 px trang trí trong wrapper riêng, không bị rule rotate chevron tác động. Tên folder là text node/span an toàn, path đầy đủ vẫn trong title. Native summary tự cung cấp expanded semantics; không thêm ARIA tree hoặc mô phỏng keyboard tree.

Guide line mảnh là decoration, không phải control boundary. Mỗi cấp đầu dùng padding 8 px + margin 4 px + border; từ cấp thứ tư ngừng cộng indent. Ba cấp indent có hiệu lực khoảng 39 CSS px, các nhánh sâu vẫn tồn tại trong DOM và còn chiều rộng cho tên.

Mở/gập dùng disclosure native tức thì, chỉ chevron có transition token P2G; không tween chiều cao cả subtree hoặc rebuild list khi toggle. Không thêm scanning/lazy-loading/virtualization mới. Kiểm tra branch scroll và drawer reopen trên danh sách dài đạt.

### C — File items/navigation

Row gồm `file-text` 24 px, tên file đầy đủ và metadata extension hiện có. Tên dùng `textContent`, **không bỏ đuôi `.md/.markdown` khi hiển thị**. Unicode, tiếng Việt, `&` và chuỗi giống HTML được giữ như text. Cho xuống dòng thay vì cắt mất tên; title/accessible name vẫn là full path. Không thêm gesture xem tên hoặc đổi loại file.

Row min-height 56 px, gap 8 px, padding 12×8; label 14/20 và metadata 12/18 theo scale hiện có. Row tăng chiều cao khi tên/chữ lớn cần chỗ. SVG/metadata là trang trí, accessible name không bị lặp.

File hiện tại có selected surface, `aria-current=page` và marker 2 px độc lập với nền pressed. Focus ring neutral kế thừa P2A, không đổi stroke/scale khi nhấn. Selected không biến thành trạng thái pressed sau release. Không tạo selection nhiều file, disabled/error giả hoặc dirty badge không được backing state hỗ trợ.

Toolbar trước/sau và thuật toán chuyển file không sửa. Test xác nhận chuyển qua file khác rồi quay lại vẫn giữ draft, và filter chỉ còn một kết quả không giới hạn sequence.

### D — Context action và rename

Giữ luồng nhấn giữ/contextmenu/F2 → **rename dialog**. Cải thiện surface, radius, padding, field border và action spacing của dialog hiện có, dùng tokens chung và enter animation P2G. Không tạo popup nhiều thao tác làm đổi trình tự người dùng, không thêm delete/move/copy hoặc rename folder.

Dialog native top layer, close/Cancel/Back, selected basename, extension editable, busy/error và restore focus vẫn dùng code cũ. Synthetic click sau hold bị chặn; scroll threshold không mở nhầm dialog. Không thay form handler hoặc rename API.

### E — Responsive/motion

Giữ width/breakpoint và kích thước drawer P2F: overlay tối đa 320 px, còn ít nhất 48 px bên ngoài; sidebar fixed 280 px khi rộng. Không thu hẹp reader bằng panel mới. Màn hình bình thường cuộn file list; khi chiều cao ≤479 px, toàn sidebar là vùng cuộn để header/filter/action vẫn tới được, tránh list bị ép về 0. Không đóng drawer vì IME làm chiều cao giảm.

Không đổi drawer enter/exit, scrim, isolation, reduced native OR media hoặc Back từ P2G. Không animate hàng loạt file, không tween font/width/height và không thêm animation engine. State/ARIA/focus đổi ngay; không callback animation nào quyết định chọn file.

### F — Empty/error/accessibility

Empty state có book icon trang trí, tiêu đề rõ và hướng dẫn ngắn. Chưa có dữ liệu: “Mở thư mục hoặc chọn tệp để bắt đầu.” Filter không khớp: hướng dẫn xóa bộ lọc. Bộ tệp có ảnh/CSS nhưng không có tài liệu: giải thích nhận `.md`, `.markdown`, `.txt`.

Không suy đoán node thư mục rỗng vì snapshot không cung cấp chúng; khi scope không có tài liệu, dùng thông báo chung đúng với dữ liệu. Không thêm scan để phát hiện folder rỗng. Không có busy state danh sách riêng trong implementation cũ, nên không tạo loading giả. Lỗi đọc, mất quyền, file bị di chuyển/xóa tiếp tục qua error/toast thực hiện có; không tự xin lại quyền hoặc che thông báo lỗi bằng empty state.

Giữ listitem chứa button, summary native, accessible path/current, keyboard, modal isolation/inert fallback. Những controls không có disabled/error state thực không được gắn ARIA giả. Cả 12 theme và text scale 200% có kiểm tra browser.

Gate B–F: suite library mới **112/112** và full regression bên dưới. Đã xem ảnh narrow/wide, Dark/Light/Sepia, empty/filter/rename, landscape và 200% text.

## 4. Phạm vi diff

Ba production source có sẵn:

- [shell.html](../../web/src/shell.html): tagline và `#fileCount`; giữ mọi ID/control/event target cũ.
- [app.js](../../web/src/app.js): chỉ thay thân `renderFileList` để dựng decoration, full filename, count và empty copy.
- [app.css](../../web/src/app.css): append các block P3B scoped sidebar/file/rename.

Test mới: [library-redesign-ui.cjs](../../web/tests/library-redesign-ui.cjs). Test cũ [icons-ui.cjs](../../web/tests/icons-ui.cjs) chỉ đổi selector từ descendant SVG sang direct-child SVG để tiếp tục kiểm chevron 16 px khi có thêm folder icon. Không xóa/thay assertion hoặc số kiểm tra kế thừa.

Generated: [Android index.html](../../app/src/main/assets/index.html), ignored web/dist và APK debug. [SCOPE.json](../../test-results/ui-p3b/SCOPE.json) xác minh đúng 5 file cũ đổi hash. So sánh text xác nhận **app.js ngoài renderFileList nguyên vẹn; CSS cũ là prefix nguyên vẹn**. Java/bridge/SAF/file handlers, renderer/editor, search, settings P3A/persistence, tokens/themes, 23 SVG/registry/license và tài liệu cũ không đổi.

## 5. Kiểm thử và kết quả

[RESULTS.json](../../test-results/ui-p3b/RESULTS.json), [suite summaries trước/sau](../../test-results/ui-p3b/SUITES.json); raw logs `build/ui-p3b/{before,after}`:

- **1.561 kế thừa PASS, 0 FAIL**: Node 132 + browser 1.233 + JVM 171 + APK baseline 25. Settings P3A vẫn 148/148.
- **112 mới PASS, 0 FAIL** bằng Chromium thật: matrix 320/360/393/412/600/800/1280; full names/icons/targets/current; nested tree/collapse/resize; filter/count/empty; contextmenu/hold/cancel/suppress-click; draft/navigation; 12 theme selected/pressed/focus; 200% text và viewport thấp; rapid drawer/reduced motion; scroll preservation; 5.000 row; markup trong filename.
- **Tổng 1.673 PASS, 0 FAIL**. Không đếm 5.000 row thành 5.000 test mới, không cộng lại smoke runs.
- **Palette 2.220/2.220** riêng; 12 palette không sửa. Icon suites 61/70 cùng Node icon tests nằm trong số kế thừa; giữ đủ 23 glyph offline.
- **18/18 Gradle debug APK checks** riêng: variant/SDK/version/ID, permissions, debug signature/alignment/CRC, renderer/notices/DEX, CSP/sandbox/font/offline và không đóng gói credentials.
- Syntax **45 JS/build/test files**; parse 2 CSS files; renderer web/Android byte-identical; `git diff --check` đạt.

Các diagnostic trong quá trình kiểm tra: harness native before ban đầu trỏ nhầm path after, đã sửa đúng output rồi chạy lại; browser test mới cần chờ breakpoint event và chờ async file open; thứ tự directory-first đặt tài liệu ở nhánh con trước file trực tiếp nên test không được giả định A10 là file kế tiếp. Sửa harness/expectation theo contract đã kiểm chứng, không đổi navigation implementation. Icon selector cũ đã được làm rõ như mục 4; final logs đều đạt.

Browser/native-host simulations không chứng minh quyền SAF thật. Keyboard và pointer-event long-press trong Chromium không phải thao tác IME/TalkBack trên Android.

## 6. Build và artifact

Chạy `scripts/Build-AndroidDebug.ps1 -Offline -RerunTasks` với quyền thực thi cho loopback daemon. **BUILD SUCCESSFUL in 52s; 31 actionable tasks, 31 executed.** Giữ Gradle 8.9, AGP 8.7.3, JDK 17, applicationId `vn.markread.local`, version 1.1.5/code115, min26/target35/compile35 và signing configuration.

[APK debug P3B](../../app/build/outputs/apk/debug/app-debug.apk): **7.602.598 bytes**, SHA-256 **`ac7f99cee436bc6359282d5f405dbfa67a73f15aea961fc21de4e44c3750a8b0`**.

Renderer **13.295.737 bytes**, SHA-256 **`5d7961ec0179cfa85cb87f6a39175d0982319387667246835b26abdc6b3ef38c`**. So với P3A tăng 4.752 bytes HTML và 1.400 bytes APK. Không thêm/bớt ZIP entry; chỉ `assets/index.html` đổi. DEX, compiled Manifest/resources và notices nguyên vẹn. Debug certificate vẫn của Build Gate, không phải release certificate. [Artifact hashes](../../test-results/ui-p3b/ARTIFACTS.json), [packaging checks](../../test-results/ui-p3b/debug-apk-checks.json).

## 7. Ảnh trước/sau và hiệu năng

**24 ảnh trước + 24 ảnh sau**, cùng 7-file fixture/root, viewport, theme, UI scale và reduced motion. Windows desktop Chromium 156 / Playwright, DPR1. [Before manifest](../../test-results/ui-p3b/before/manifest.json), [after manifest](../../test-results/ui-p3b/after/manifest.json) ghi provenance từng ảnh.

- Ví dụ [360 dark trước](../../test-results/ui-p3b/before/360x852-dark-tree-1x.png), [360 dark sau](../../test-results/ui-p3b/after/360x852-dark-tree-1x.png).
- [1280 wide](../../test-results/ui-p3b/after/1280x800-dark-tree-1x.png), [200% text](../../test-results/ui-p3b/after/393x852-dark-tree-2x.png), [landscape](../../test-results/ui-p3b/after/800x360-dark-tree-1x.png).
- [Empty](../../test-results/ui-p3b/after/393x852-dark-empty-1x.png), [filter](../../test-results/ui-p3b/after/393x852-light-filter-1x.png), [rename ở viewport thấp](../../test-results/ui-p3b/after/393x480-dark-rename-1x.png). Manifest còn chứa 12 theme tại 393×852.

Kiểm tra 5.000 tài liệu ghi nhận **2.926 ms** cho thao tác Playwright transfer/import + row commit trên desktop trong lượt chạy này. Đây không phải benchmark so sánh P3A, thời gian render bài hoàn chỉnh, input latency, Android hoặc FPS. Không tuyên bố đạt 60 FPS. SVG mỗi row làm tăng DOM theo số file; cần profile Android trước mọi quyết định virtualization. Không có observer, scan-per-frame hoặc loop animation mới, không animation nội dung Markdown.

## 8. Giới hạn và rollback

`adb devices -l` trả danh sách trống. Chưa cài/chạy APK, chưa Android WebView100/current, TalkBack, IME tiếng Việt, gesture Back, font/display scaling/density/48dp thực, keyboard/system insets, lifecycle hoặc SAF provider/grants/revoke/move/delete/rename/export thực. 200% root text, viewport thấp và host mocks không thay thế các ca thiết bị này.

Giới hạn dữ liệu có sẵn: không biết folder rỗng vì snapshot chỉ có entry file; không có trạng thái busy/error trên từng row hoặc lịch sử/parent navigation để redesign. Giữ các giới hạn này thay vì mở rộng SAF/file state machine trong P3B. File dài được wrap có thể làm row cao; dưới 480 px height toàn sidebar cuộn để vẫn tới được controls. Cần đánh giá cuộn/IME/menu trên Android thật trước nghiệm thu native UX.

Rollback riêng P3B: khôi phục ba production source, `web/tests/icons-ui.cjs` và Android generated asset từ `build/ui-p3b/before/workspace`; bỏ test library mới nếu không giữ test lịch sử. Rebuild renderer và APK bằng script cũ; renderer P3A phải trở về `5c225bee...`. APK debug P3A nguyên bản có trong backup. Có thể giữ report/evidence; không reset repo về HEAD vì còn toàn bộ P2/P3A chưa commit.

Điều kiện chuyển P3C: người dùng duyệt thiết kế/ảnh P3B; 1.673 tests, palette và packaging tiếp tục đạt; không có regression về file/draft/focus/Back. Thử APK trên Android với file access thực, cây sâu/dài, long-press/scroll, IME/TalkBack/lifecycle và các theme trước khi tuyên bố native QA đạt. **P3B dừng tại đây; không tự triển khai P3C–P3F.**
