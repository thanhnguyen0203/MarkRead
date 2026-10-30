# P2B — Accessibility, Semantics & Touch Targets

**27/10/2026 · hoàn tất triển khai P2B, chờ duyệt · dừng trước P2C.** Kiến trúc giữ Java Android + WebView + HTML/CSS/JavaScript thuần.

## 1. Điều kiện đầu vào và baseline

- HEAD vẫn là `5efe52f` của P1. Working tree đã chứa toàn bộ P2A chưa commit cùng tài liệu P0/cache chưa được Git theo dõi từ trước. P2B kế thừa các thay đổi đó; không reset checkout hoặc coi chúng là thay đổi mới của P2B.
- Đã đọc/đối chiếu P0, MASTER, COMPONENTS, ACCESSIBILITY, IMPLEMENTATION_PLAN và P2A_REPORT; tra `touch target Android` bằng skill `ui-ux-pro-max`. Áp dụng 48dp cho mục tiêu Android, phân biệt với CSS px và kiểm tra browser.
- Asset đầu vào khớp đúng SHA-256 P2A: `ba2602e80a4f1ced1fa6ef9f4496250cc400cc3889245342871adaa4ecf09dd4`. Đã đối chiếu log **439 P0 + 39 P2A**, chạy mới **91/91 Node unit** trước khi sửa và kiểm chứng thêm custom CSS trên cả bundle trước P2A và bundle hiện tại. Không phát hiện hồi quy nghiêm trọng chặn P2B.
- CSS hợp lệ ghi đè background/text/link/blockquote đạt 4/4 ở mỗi bản. Khai báo custom properties như `body{--bg:...}` bị parser từ chối ở **cả hai bản**; đây là giới hạn có sẵn của `cleanCSS` đối với AST Raw, không phải hồi quy P2A. Việc P1 nói đến override alias rộng hơn khả năng parser hiện tại cần được làm rõ ở công việc riêng; P2B không nới parser/CSP.
- Snapshot trước P2B: `build/ui-p2b/before-p2b.zip`, manifest `before-sha256.json`, trạng thái Git `git-before.txt`. Không ghi đè bằng chứng P0/P1/P2A.

## 2. Thay đổi và file thuộc P2B

Chỉ bốn file ứng dụng có nội dung khác snapshot P2A:

- `web/src/shell.html`: danh sách tệp dùng `ul`; thêm tên dialog/menu, quan hệ controls/expanded; button có type rõ; thêm nút đóng sidebar; tách nhóm công cụ đọc và tùy chọn tài liệu để đủ vùng chạm ở màn hẹp. Giữ ID các control hiện có.
- `web/src/app.js`: render `ul/li` chứa file button; đồng bộ expanded của sidebar và busy của rename form; accessible name trước/sau có tên đích; dirty marker có tên và được ẩn khi sạch. Không đổi dữ liệu, parser, debounce, long-press, bridge hoặc chính sách file.
- `web/src/app.css`: kích thước control thật tối thiểu 48 CSS px, hàng tệp/theme/switch label 56px; header chia hai hàng cục bộ khi workspace hẹp; sidebar đóng dùng `visibility:hidden`. Không dùng vùng chạm giả chồng lấn.
- `app/src/main/assets/index.html`: renderer sinh lại từ source, đồng bộ byte với `web/dist/MarkRead.html`.

File mới: `web/tests/accessibility-ui.cjs` và báo cáo này. `paper.css`, `tokens.js`, hai test P2A mới, các test cũ, theme/preferences, Java, native transport, package/lockfile, build config và tài liệu P0/P1/P2A **không thay đổi thêm trong P2B**. Diff Git hiện tại bao gồm P2A chưa commit; dùng snapshot trên để phân biệt hai giai đoạn.

## 3. Accessibility và semantics đã sửa

- **File browser:** bỏ `role=listitem` khỏi button; mỗi button nằm trong `li`, folder là `li > details > summary + ul`. Danh sách con có đúng chủ sở hữu list/listitem. Button vẫn có tên path đầy đủ, `aria-current=page`, event click và `bindRenameHold` trên chính node button. Glyph extension là decoration.
- **Sidebar:** `#menu` có `aria-controls=sidebar` và expanded theo trạng thái hiển thị; helper chung cập nhật khi mở, đóng, chọn file, Escape, Back và đổi breakpoint. Mobile đóng thì subtree không còn nằm trong role queries/Tab sequence. Thêm `#closeSidebar` với tên “Đóng danh sách tệp”; scrim vẫn là backdrop trang trí có thao tác pointer và đã có nút đóng tương đương.
- **Dialog/menu:** Help và Export có `aria-labelledby` gắn heading thật; Help dùng tiêu đề rõ “Hướng dẫn sử dụng”. Menu Mở có tên “Mở tài liệu”. Các dialog vẫn dùng `showModal()` và cơ chế đóng hiện có.
- **Settings:** nút điều hướng trỏ đúng section qua `aria-controls`; current dùng `aria-current=true` cho nhóm cài đặt thay vì mô tả một page. Hidden section, expanded font picker, option selected và switch checked tiếp tục theo state hiện có.
- **Toolbar/search:** nút tìm khai báo controls/expanded ngay từ trạng thái đóng; prev/next có accessible name chứa đích khi có; nút lưu nói rõ “Lưu bản sao Markdown”. Mode checked, sort pressed, disabled thực tế giữ nguyên.
- **Form/draft/decoration:** rename form có busy đồng bộ với `renameBusy`; dirty marker có tên “Có bản sửa chưa xuất” và hidden khi sạch. Brand mark, file type, extension, ký hiệu lọc và shorthand đứng cạnh nhãn được đánh dấu decoration. Button mặc định có `type=button`, rename submit giữ `type=submit`.
- Không thêm interactive element lồng nhau. Không gán tree/treeitem, tab/tablist hoặc aria-modal cho các phần chưa có behavior tương ứng.

## 4. Vùng chạm và điều chỉnh bố cục cần thiết

- Toolbar/menu/sidebar close/sort/forget, dialog close/actions, Settings navigation/font options/CSS actions, search/replace: bounds thật tối thiểu **48×48 CSS px**. Glyph SVG cũ giữ kích thước; không thay bộ icon.
- File row và theme tile: min-height **56px**. Folder summary, filter input, range input và rename input: min-height **48px**. Switch input có box **48×48px**, label cao tối thiểu **56px**, track vẫn 44×26px. TOC link trong shell có chiều cao tối thiểu 48px; link nằm trong đoạn Markdown không bị kéo giãn.
- Gap giữa nhóm nút toolbar, sort/forget, tìm kiếm và dialog actions là 8px. Không dùng pseudo-element mở rộng ra ngoài bounds hoặc phủ lên Markdown.
- Sáu nút 48px cùng tên tệp không thể vừa một hàng 320px. Theo hướng P1, header compact dùng hàng title/menu/settings/mode và hàng prev/next/find/save. Thay đổi chỉ nằm trong header hiện có, không thêm bottom bar hoặc menu tính năng mới. Header rộng vẫn một hàng. Quy tắc compact dùng width<680px hoặc viewport821–909px do sidebar cố định hiện tại chiếm230px; không dùng container query chưa được xác minh trên WebView100.
- Bounds header đã đo ở **320×568, 360×800, 390×844, 600×960, 680×800, 820×800, 844×390, 910×800, 1024×800, 1280×800**: đủ kích thước, center hit đúng control, không chồng lấn/tràn và reader bắt đầu sau header. Ở320px: header112px; icon target48×48px, gap8px, title còn120px. Header hiện có tự đo chiều cao cho tiến độ/ẩn hiện; không sửa thuật toán motion.

**Giới hạn đơn vị:** đây là số đo CSS px trong Chromium. Meta viewport vẫn `width=device-width,initial-scale=1`; native `textZoom=100`, không thêm scale hay system inset vào CSS. Đã thử browser deviceScaleFactor1/2/3 và visualViewport.scale1 để phát hiện phụ thuộc mật độ trong layout; **không dùng DPR để quy đổi dp**. Chưa có Android nên chưa xác nhận target vật lý tương đương48dp. Khi có thiết bị, cần đối chiếu bounds WebView với density/display metrics thật và target native48dp ở nhiều display size. Không thay API Java để suy diễn số đo này.

## 5. Các thành phần cố ý chưa thay đổi

- Không thêm focus trap/modal isolation, chuyển focus khi mở sidebar hoặc trả focus khi đóng; không tự thêm `inert`/tabindex manager. Sidebar mở vẫn theo cơ chế hiện có. Chỉ sửa subtree khi **đóng** và trạng thái ARIA; phần quản lý focus phức tạp thuộc P2C.
- Giữ keyboard editor, Tab indent, source/unified entry, commit/cancel, IME handling, textarea reuse, undo/redo, selection và source offsets. A02/A03 vẫn cần P2C; không tuyên bố hoàn tất accessibility editor.
- DOM order của nhóm toolbar giữ thứ tự logic trước đây: title → công cụ đọc → tùy chọn. Ở compact, nhóm tùy chọn nằm trên cùng theo đặc tả thị giác; cần đánh giá thứ tự focus/đọc với bàn phím và TalkBack ở P2C. Không đổi thứ tự tabindex để ép theo grid.
- Giữ Settings navigation cuộn ngang, font listbox với model focus hiện có và breakpoint sidebar/TOC. Category selector mới, typography/font scaling, các điều chỉnh layout rộng hơn thuộc nhóm sau.
- Không tích hợp Motion; không sửa startup reduced animation/native fallback, native dialog theme, timeout bridge, SAF, search worker, custom CSS parser, theme persistence hoặc data/file logic. Không thêm dependency, permission, analytics, network request hay font.

## 6. Kết quả kiểm thử

Trên bundle P2B cuối, **0 test thất bại**:

- **439/439 P0:** Node unit cũ79; browser UI54, Revision62, Reading46, simulated Native27, Session17, Startup53; JVM Policy69, SessionPolicy7; APK validation25. Test cũ không sửa thêm kỳ vọng trong P2B.
- **39/39 P2A:** 12 token unit + 27 Foundations browser assertions. Node unit tổng hiện91 =79+12.
- **68/68 P2B mới:** computed roles/names và cấu trúc list; sidebar closed/expanded/breakpoint; controls relationships; selected/checked/disabled; 10 kích thước header; target/hit-test và không chồng lấn; Settings5 nhóm/font/switch/dialogs; long-press file chưa chọn không mở file; source undo/redo/node/focus/caret khi resize; export; browser density1/2/3. Tổng theo cách đếm baseline: **546 =439+39+68**. Đây không phải546 test trên Android.
- Palette checker **2.220/2.220**, đủ12 theme, 0 fail. Đếm riêng, không cộng vào546. Các suite P2A còn xác minh preview/CSS riêng/token qua renderer thật.
- `npm run build`, `node --check` app/test, CSS parse: đạt, **0 lỗi parse**. Java ECJ compile, D8, AAPT2 link, ZIP alignment: đạt. APK **không ký** với asset P2B qua25/25 validation, gồm CSP hash/font offline/zero permissions. Không tạo bản phát hành có chữ ký mới.
- Renderer và Android asset cùng SHA-256 **`3efe92a9e0dd858ade0ab59ecce2e7bceebce758ca426da700f31809a1ef78ac`**, 13.223.468 bytes. APK phát hành cũ giữ hash `5a0ee4e950df4ca30963b0669337b7ab731f7b65c493be35cde9f3fad6eefa90`; chữ ký cũ verify đạt.
- Log riêng ở `build/ui-p2b/{ui,revision-ui,reading-ui,native-ui,session-ui,startup-ui,foundations-ui,accessibility-ui,web-unit}.log`, `apk-validation.log`, `palette-results.json`. Ảnh/target JSON ở `build/ui-p2b/workspace/test-results/ui-p2b/`. Đã xem ảnh Settings sáng và header điện thoại; `git diff --check` đạt.

**Chưa chạy:** Gradle `assembleDebug` vì không có Gradle8.9 cache hoặc Gradle trên PATH và chưa có SDK đầy đủ được cấu hình; chỉ có toolchain dùng cho ECJ/AAPT2/D8. Không tải/cài toolchain trong P2B. Không có adb/emulator/device để chạy Android thật, WebView100, TalkBack, SAF/provider/grant, IME tiếng Việt thật, system font/display scaling và native insets. Synthetic/browser input, simulated native và độ cao viewport thay đổi không chứng minh các trường hợp Android đó.

## 7. Rủi ro, rollback và cổng P2C

- Header compact chiếm112px thay vì54px, cần thiết để đủ target và không đè nội dung. Trên màn ngang thấp, reader ít chiều cao hơn; đã có kiểm tra browser844×390, chưa có IME/cutout thật. Cơ chế hide/show hiện có vẫn qua Reading suite.
- Wrapper list và file row cao hơn làm giảm số tệp nhìn thấy một lúc; thứ tự/filter/collapse/navigation/draft và long-press đã qua regression. Chưa benchmark5.000 file trên Android; không thêm virtualization.
- Vòng focus/selected từ P2A vẫn còn; font picker và sidebar mở cần TalkBack/focus policy riêng. Không coi P2B là chứng nhận WCAG hoặc Android accessibility hoàn chỉnh.
- Rollback **chỉ P2B**: khôi phục `web/src/app.js`, `web/src/app.css`, `web/src/shell.html`, `app/src/main/assets/index.html` từ `build/ui-p2b/before-p2b.zip`; bỏ file test mới `web/tests/accessibility-ui.cjs`; chạy lại `npm run build` để đồng bộ web dist. Không dùng `git restore HEAD` cho các file chung vì HEAD là P1 và sẽ làm mất P2A chưa commit. P0/P1/P2A và báo cáo này có thể giữ để truy vết. Sau rollback, renderer phải trở lại hash P2A `ba2602e...`, baseline478 phải đạt.
- Chỉ chuyển P2C khi chủ dự án duyệt P2B, đặc biệt header compact112px, semantics/sidebar close và rủi ro thứ tự focus. P2C cần phân tích keyboard/source composition trước khi sửa A02/A03 hoặc thêm focus trap/return/isolation; có test dữ liệu/undo/caret và kế hoạch Android/TalkBack/IME thật. Các khoảng trống thiết bị vẫn là cổng trước phát hành native, không được đổi nhãn thành PASS.

**Dừng tại P2B.** Không triển khai P2C–P2G, không commit hoặc phát hành APK trong lượt này.
