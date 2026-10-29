# MarkRead — kiểm toán UI/UX trước thiết kế lại

Ngày kiểm toán: **27/10/2026, Asia/Saigon**. Mốc mã nguồn: `a41a13a5e0e437a83fcd89b6f193292b5fdda9b1` (`Update v1.1.6`). Phiên bản được cấu hình và APK hiện có là **1.1.5 / 115**.

## Phạm vi và phương pháp

Chỉ phân tích và tạo tài liệu. Không sửa giao diện, nghiệp vụ, test hiện có, dependency, manifest, signing hay số phiên bản. Đã đọc toàn bộ mã ứng dụng do dự án sở hữu: bốn lớp Java production, HTML shell, hai stylesheet, các module JavaScript, cấu hình Gradle, script build/đóng gói, mã kiểm thử và tài nguyên Android. Đã đối chiếu bundle sinh ra với source build, asset Android và APK. Thư viện bên thứ ba, font nhị phân, Gradle wrapper và bundle minify được kiểm kê/đối chiếu thay vì coi là mã UI tự viết để thiết kế lại. Không đọc nội dung khóa ký trong `private/`.

Áp dụng [skill ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md), đặc biệt Accessibility, Touch & Interaction, Layout, Typography/Color và Motion. Đã chạy tra cứu cục bộ `keyboard focus modal` và `touch target Android`, domain `ux`; kết quả đúng chủ đề và được đối chiếu với stack thật. Không sinh design system mới và không áp dụng hướng dẫn Compose/React Native vào ứng dụng này.

Bằng chứng gồm đọc source, 439 kiểm tra baseline đạt, đo computed style/DOM/accessibility snapshot trên Chrome 156.0.8078.48, và xem ảnh chụp mới của sidebar, bộ chọn font sáng, cài đặt ngang. Xem [BASELINE.md](BASELINE.md) để biết lệnh, log, checksum và giới hạn môi trường; [FILE_MAP.md](FILE_MAP.md) để tra từng màn hình; [REGRESSION_CHECKLIST.md](REGRESSION_CHECKLIST.md) để giữ chức năng.

Phân loại bằng chứng:

- **Đo được**: tái hiện trên Chromium với renderer thật; chưa đồng nghĩa đã thử trên Android.
- **Source**: điều kiện/hành vi có thể chỉ ra trực tiếp trong mã; ghi rõ nếu chưa chạy nhánh native.
- **Cần thiết bị**: nhận định cần TalkBack, bàn phím Android, SAF hoặc WebView thật để kết luận.

Mức độ: **P1** cản trở chức năng chính hoặc accessibility đáng kể; **P2** làm giảm khả năng dùng/đọc hay tính nhất quán; **P3** hoàn thiện. Đây là ưu tiên công việc, không phải chứng nhận tuân thủ WCAG.

## 1. Kiến trúc và ranh giới UI

Ứng dụng **hybrid Java Android + WebView + HTML/CSS/JavaScript thuần**. Không có Kotlin, Jetpack Compose, XML layout màn hình, React, AndroidX UI hay framework điều hướng web. Các file `.gradle.kts` là Kotlin DSL cấu hình build, không phải UI Kotlin.

Luồng chính:

1. `MainActivity.java` tạo `FrameLayout` và `WebView` bằng Java; xử lý system/IME insets, lifecycle, Back, màu cửa sổ và thanh hệ thống.
2. WebView tải origin tổng hợp `https://appassets.androidplatform.net/app/index.html`. `shouldInterceptRequest()` phục vụ `app/src/main/assets/index.html` từ APK, không dùng máy chủ mạng.
3. HTML shell và `app.css` tạo sidebar, toolbar, tìm/thay thế, nguồn, cài đặt và dialog. `app.js` quản lý state, render, sự kiện và đồng bộ với native.
4. Nội dung Markdown được Marked phân tích, DOMPurify làm sạch, KaTeX/Highlight.js/Mermaid trang trí, rồi đưa vào **iframe `srcdoc`**. `paper.css`, font offline và palette điều khiển bài đọc. Iframe `sandbox="allow-same-origin"` không có `allow-scripts`; code tin cậy ở parent gắn tương tác vào DOM của iframe.
5. `native.js` liên lạc qua `WebMessagePort` và nonce với Java; `DocumentStore` đọc/đổi tên trong phạm vi SAF. Không có `addJavascriptInterface`, API đọc đường dẫn tùy ý hay quyền truy cập toàn bộ bộ nhớ.

Phân chia sở hữu giao diện:

- **Web shell**: mọi màn hình/chế độ đọc, nguồn, chia đôi, danh sách tệp, menu, tìm kiếm, 5 nhóm cài đặt, hướng dẫn, đổi tên, toast; export dialog chỉ dùng ở trình duyệt.
- **Web reader iframe**: bài Markdown, math, code, bảng/ảnh, sơ đồ, link, highlight tìm kiếm, field sửa từng khối.
- **Android native**: khung/insets, status/navigation bars, báo WebView quá cũ, hộp xác nhận JS, cảnh báo thoát có draft, cảnh báo renderer dừng.
- **Hệ điều hành/provider**: bộ chọn thư mục, chọn tệp/CSS và lưu bản sao SAF. Giao diện picker không do CSS ứng dụng điều khiển.
- **Tài nguyên Android**: adaptive launcher icon, theme nền cửa sổ và chính sách backup; không phải các màn hình nội dung.

## 2. Những điểm đang làm tốt cần giữ

- Một workspace với đường đọc chính rõ ràng; toolbar một hàng và tiến độ đọc 3 px. Không có footer/thanh trạng thái thừa trong DOM hiện tại.
- Có 12 palette đầy đủ; preview theme dùng chính nền/chữ của palette. Native background đồng bộ theme, startup chỉ lộ shell sau restore/font, tránh nháy theme mặc định.
- Hầu hết icon button có `aria-label`; menu mở và menu chế độ có trạng thái expanded, font listbox có selected, switch dùng input thực, tiến độ có `role=progressbar`.
- Hover chỉ bật cho thiết bị hỗ trợ hover/fine pointer; có pressed state, disabled opacity, quy tắc focus bàn phím chung. Không có sticky hover áp cho mọi màn hình cảm ứng.
- HTML `dialog.showModal()` được dùng cho cài đặt/đổi tên/hướng dẫn/xuất. Menu chế độ và font có Arrow/Home/End/Escape; đổi tên có F2 ngoài thao tác giữ lâu.
- Chế độ hợp nhất giữ iframe và textarea khi chuyển đoạn, bảo toàn nguồn xung quanh, chỗ vừa chạm và con trỏ; Escape hủy khối, Ctrl/Cmd+Enter hoàn tất.
- Giảm chuyển động tắt transition chính, smooth scroll và ẩn/hiện toolbar theo cuộn. `ResizeObserver` cập nhật tiến độ khi nội dung/viewport đổi.
- CSS người dùng được giới hạn trong iframe đọc; import lỗi/hủy không thay scope hoặc CSS đang dùng. Renderer chặn tải tài nguyên bên ngoài.

## 3. Phát hiện UI/UX

### A01 — P1 — Sidebar ẩn vẫn nhận focus; sidebar mở thiếu quản lý focus

**Đo được.** Tại 390×844, lần Tab đầu vào `#openMenu`, có bounding box x = −267, cạnh phải = −14: nút hoàn toàn ngoài màn hình. Sidebar chỉ được dịch `translateX(-100%)`, không có `inert`/trạng thái ẩn cho accessibility. Khi mở, focus vẫn ở `#menu`, `main.inert=false`; nút mở không có `aria-expanded`. Không có cơ chế chuyển/giữ/trả focus dành cho drawer.

Nguồn: `app.css:1,65–77`, `shell.html:18–28`, `app.js:559,542,587`. Đề xuất nhóm riêng cho drawer: ngăn focus khi đóng, thống nhất semantics và trạng thái mở, điều hướng focus khi mở/đóng; kiểm tra Back/scrim/filter không bị đổi hành vi. TalkBack còn cần thử trên máy thật.

### A02 — P1 — Tab và Shift+Tab bị giữ trong ô nguồn

**Đo được + source.** Handler `#editor` chặn mọi `Tab`, kể cả Shift+Tab, rồi chèn hai khoảng trắng. Probe xác nhận focus vẫn ở `editor` và nguồn có thêm `  `. Không có cơ chế thoát Tab được mô tả. `.block-source` cũng bắt Tab; field này có Escape/Ctrl+Enter để thoát lần sửa nhưng thiếu hướng dẫn gần field.

Nguồn: `app.js:418–425,542,561`. Cần xác định quy ước indent/thoát focus mà vẫn giữ việc nhập Markdown; không tùy tiện bỏ chức năng thụt dòng. Xác nhận cả keyboard thật, TalkBack và IME tiếng Việt.

### A03 — P1 — Sửa hợp nhất chưa có cách bắt đầu bằng bàn phím trong bài

**Source + DOM đo được.** `.md-block` là `DIV`, `tabIndex=-1`, không role tương tác. Bắt đầu sửa qua `readerClick()`; keydown iframe chỉ chuyển Enter cho link, không mở sửa khối. Khi bật hợp nhất, menu Đọc/Nguồn bị ẩn. Người không dùng con trỏ phải quay lại cài đặt để tắt hợp nhất mới dùng nguồn toàn bài.

Nguồn: `app.js:122–124,285,330,403–445`; `paper.css:2`. Cần bổ sung đường truy cập bàn phím có chủ ý và tín hiệu đang sửa, không biến mọi khối văn bản thành hàng trăm tab stop.

### A04 — P1 — Vai trò hàng tệp làm mất semantics nút

**Đo được.** Mã tạo `<button role="listitem">`; accessibility snapshot Chromium là `listitem "Audit.md"`, không có nút con. Điều này ghi đè vai trò tương tác mặc định của button. `aria-current=page` đã có cho tệp hiện hành và cần giữ.

Nguồn: `shell.html:23`, `app.js:149–158`. Cần chọn cấu trúc listitem chứa button, hoặc mẫu navigation phù hợp; không tự gắn tree/treeitem khi chưa triển khai đầy đủ keyboard tương ứng. Cần TalkBack để xác nhận cách thông báo trên Android.

### A05 — P1 có điều kiện — Màn WebView cũ có thể trắng trên nền trắng

**Source, chưa chạy native.** `onCreate()` áp theme đã lưu cho root trước khi kiểm tra phiên bản WebView; `unsupportedWebView()` luôn đặt chữ `Color.WHITE`. Với theme `light`, root trắng nên chữ trắng/trắng có tỷ lệ 1:1. Các theme sáng khác cũng rủi ro. TextSize 18 dùng đơn vị mặc định sp, nhưng `setPadding(32,48,32,32)` là px native thô.

Nguồn: `MainActivity.java:88–105,313–325`. Tách thành nhóm native fallback nhỏ; cần dựng tình huống provider cũ trên emulator/máy thử. Không thay ngưỡng WebView tối thiểu để che lỗi.

### A06 — P2 — Vùng chạm nhỏ và toolbar sát nhau

**Đo được tại 390×844, đơn vị CSS px.** Menu danh sách 32×32; trước/sau/tìm/lưu/cài đặt/chế độ 34×42; sort 32×32; gỡ scope 20×22; nút Mở cao 47; chọn font cao 46; range cao 28. Toolbar có gap 0 ở mobile. Kích thước glyph SVG thường 20, không phải kích thước vùng chạm.

Nguồn: `app.css:1,18,65–75,102–110,115–140`. Skill hướng dẫn Android tối thiểu 48dp; phép đo CSS px cần đối chiếu density/WebView thực tế, không được đánh đồng dp/px hoặc tự kết luận mọi nút vi phạm WCAG chỉ từ chuẩn Android. Nút gỡ scope nhỏ, gần sort và làm bỏ draft sau xác nhận là điểm đáng ưu tiên. Tăng target cần thiết kế lại phân bố toolbar để tránh bóp tên tệp ở 320–390px.

### A07 — P2 — Một số cặp màu chữ không đủ tương phản

**Đo từ computed palette, công thức relative luminance sRGB; chưa có custom CSS.** Toàn bộ 12 theme có `text/bg` từ 7.65:1 trở lên; vấn đề tập trung ở chữ muted, selected và primary. Mục tiêu dùng khi thiết kế: chữ thường ≥4.5:1, biểu tượng/chỉ báo có ý nghĩa ≥3:1. Không dùng ngưỡng 3:1 thay cho chữ 10–13px.

- **Light**: muted trên panel **4.22**, surface **4.02**, quote **4.18**; accent trên selected **4.38**.
- **Sepia**: muted trên bg **4.19**, panel **3.80**, surface **3.55**, quote **3.86**; accent/selected **3.67**; chữ nút primary `panel/accent` **3.92**.
- **Tokyo Night Light**: muted/panel và muted/quote **4.12**, muted/surface **3.87**.
- Chữ accent/selected trên **Xanh xám 4.27**, **Nord 3.82**, **Dracula 4.07**, **Gruvbox 4.24**. Đây là màu đang dùng cho hàng tệp, nav cài đặt, option font được chọn.
- Các theme Dark, Black, Tokyo Night, Rosé Pine và Forest đạt ngưỡng chữ 4.5 cho các cặp đã đo; không có nghĩa mọi trạng thái/alpha/đồ thị của chúng đã được chứng nhận.
- `line/bg` chỉ khoảng 1.26–1.91. Divider trang trí không mặc nhiên cần 3:1; cần đo riêng đường biên input/chỉ báo khi nó là cách duy nhất nhận diện điều khiển.

Nguồn: `themes.js:1–16`, `app.js:116–128,312`, `app.css` các selector `.primary`, `.file-row.active`, `.settings-nav`, `.font-options`, `.hint`; `paper.css` blockquote/code comment/search mark. CSS khởi tạo và vài theme trong `app.css:1` trùng nhưng khác palette JS; JS ghi đè sau startup. Không đánh giá màu đang dùng chỉ bằng các giá trị CSS khởi tạo.

### A08 — P2 — Focus đổi tên bị xóa; focus theme khó phân biệt selected

**Đo được.** `#renameInput` và `.rename-field` đều outline/shadow `none` khi focus; border không đổi. Theme tile focus-visible dùng đúng border/inset shadow của trạng thái active nên tile đang chọn khó chỉ ra focus riêng. `.block-source` chủ ý không viền/outline; phải thiết kế chỉ báo focus có thể nhận biết mà vẫn giữ trải nghiệm sửa liền mạch.

Nguồn: `app.css:59–60,98,130–133,150–151`; `paper.css:2`. `reading-ui.cjs:26–28` đang khẳng định không có vòng focus đổi tên; đây là hợp đồng thị giác từ phiên bản cũ, cần duyệt thay đổi và cập nhật assertion thị giác tương ứng sau khi duyệt. Không xóa test dữ liệu để làm xanh build.

### A09 — P2 — Chữ giao diện nhỏ, scale giữa shell và bài đọc chưa thống nhất

**Source + đo.** Shell 14px, tên tệp/row 12px, hint 11px, nav mobile 11px, vài caption 8–10px. Reader mặc định 18px/1.8 và có chọn 12–32px, 1.2–2.4; source toàn bài cố định 14px. Chỉnh font/cỡ bài không phóng to cài đặt, toolbar hay source toàn bài. Inter trong font stack không được đóng gói; Android sẽ dùng fallback hệ thống. Merriweather có regular-variable và italic offline; serif/mono dựa font sẵn có.

`MainActivity.java:121` đặt textZoom 100 và tắt WebView zoom; không thấy cơ chế đồng bộ fontScale hệ điều hành với shell. **Cần thiết bị** để đánh giá system font size/display size và zoom hỗ trợ thực tế. Không kết luận mọi text scaling Android đã bị vô hiệu chỉ từ một setter.

Nguồn: `app.css:1,22,84,113–139`, `preferences.js`, `app.js:312`, `web/build.mjs`. Nên tách typography shell/source/reader, giữ nguyên tùy chọn đã lưu và font offline.

### A10 — P2 — Breakpoint theo chiều rộng tạo trải nghiệm ngang khác hẳn dọc

**Source + đo.** Sidebar chuyển drawer ở ≤820px, outline ẩn ở ≤1150px, nhóm cài đặt chuyển ngang ở ≤600px. Màn 844×390 đã dùng sidebar cố định và nav cài đặt dọc, dù chiều cao rất thấp; nội dung cài đặt phải cuộn. Khi font menu mở nó đẩy các range xuống. Nav cài đặt mobile cần cuộn ngang để thấy đủ 5 nhóm và chưa có gợi ý overflow rõ.

Không đo được tràn ngang toàn app ở các viewport 320×568, 360×800, 390×844, 600×960, 844×390 và 1280×800. Không coi ellipsis tên tệp hay cuộn bảng/code là lỗi tự thân. Rủi ro còn lại: tên dài, system font lớn, keyboard thật, cutout và phần còn đọc được khi chiều cao giảm. Cần cân nhắc cả height/width, không chỉ đổi breakpoint số học.

Nguồn: `app.css:1,26–43,65–89,140`; `paper.css:1`; `MainActivity.java:97–103`. Android đã xử lý insets native; thêm safe-area CSS trùng lặp có thể gây padding kép.

Browser kiểm tra hiện là Chrome156; chưa chứng minh compatibility của CSS/DOM như `dvh`, `color-mix`, focus/inert tại WebView tối thiểu100. Cần kiểm tra tại mức tối thiểu được ứng dụng công bố trước khi chốt thiết kế.

### A11 — P2 — Phản hồi tải/lưu và cảnh báo draft chưa đủ gần thao tác

**Source.** `status()` là hàm rỗng; thông báo đang đọc/dựng/lưu gọi vào hàm này không xuất hiện. Startup có status chờ trễ 800ms, rename có busy text/disable, search có status/error/disable; nhưng mở tệp/quét thư mục/xuất chưa có busy state tương đương trên nút. `saving` ngăn xuất lặp, không đổi semantics disabled. Toast kéo dài 4.5 giây, không có thao tác retry. Dấu draft là `●` với title, chưa có thông báo trạng thái bằng chữ/live rõ ràng. Xuất bản sao không có nghĩa file gốc được cập nhật; không tự xóa dirty sau export khi chưa xác định lại hợp đồng.

Nguồn: `app.js:104–109,241–253,318–345,456–475,550–553`, `shell.html:28,56`. Thiết kế feedback cần bảo toàn cancel/error và bản sửa trong RAM. Không tự thêm draft autosave hay ghi đè file gốc.

### A12 — P2/P3 — Semantics dialog, icon và nội dung hướng dẫn chưa đồng bộ

- **P2, đo/source**: settings/rename có `aria-labelledby`; help/export không có. Snapshot help trả về `dialog` không tên dù bên trong có h2. Cần đặt tên và kiểm tra focus/trả focus khi dialog chồng (hướng dẫn mở từ cài đặt). `findbar` đóng chưa chủ động trả focus về trigger; đổi tệp/reader reload chưa có chiến lược thông báo tên bài/focus.
- **P3, source**: toolbar SVG stroke 1.7 và các glyph `☰ ⇅ × ⌕ ↑ ↓ ✓` cùng tồn tại; hình dạng glyph phụ thuộc font. Đây là ký hiệu Unicode, không nên báo nhầm toàn bộ là emoji. Có thể chuẩn hóa bằng SVG nội bộ, không cần cài bộ icon.
- **P3, source**: `demo.md` còn “+ Mở thư mục”, “Chọn tệp…” và “Nguồn … trong cài đặt”; shell hiện dùng menu Mở và menu ⋮. Help có nhãn phiên bản 1.1, general ghi 1.1.5. Input chọn tệp web thiếu `.txt` trong `accept` dù core/native nhận TXT. Empty copy chỉ nói Markdown trong khi TXT được hỗ trợ.

Nguồn: `shell.html:20–55`, `app.js:153–157,538–542`, `demo.md`; xem asset map.

### A13 — P3 — Giảm chuyển động chưa phủ animation startup

**Đo được.** Khi `prefers-reduced-motion: reduce`, transition là `none` nhưng `#startupStatus` vẫn có `animation: 0.15s 0.8s both startup-status`. Đây là fade nhẹ một lần, không phải lỗi chớp liên tục. Quy tắc reduced motion hiện tắt transition/smooth scroll, chưa tắt CSS animation.

Pressed scale .97 không thay layout bounds; không có bằng chứng nó tự gây reflow. Toolbar dùng transform/opacity **và margin-bottom** theo frame nên có khả năng layout work khi cuộn; chưa có trace hiệu năng để gọi là jank. Full rerender sau thay theme/slider (debounce 80ms), source edit (280ms), và list filter 5.000 mục cần benchmark nếu tối ưu, không thay thuật toán trong lượt thiết kế nhẹ.

Nguồn: `shell.html:13`, `app.css:96–100,141,156`, `app.js:74–100,149–158,314,549,560`.

### A14 — P2, cần Android — Native dialog chưa đồng bộ light/dark như Web UI

`styles.xml` dùng một `Theme.Material.NoActionBar`, accent cố định; không có `values-night` hay theme Light riêng. `setThemeColors()` đổi nền window/WebView và system bars nhưng không chọn theme AlertDialog theo palette. Các hộp confirm JS, renderer crash và thoát draft cần kiểm tra khi app dùng Light/Sepia/Tokyo Light. Đây là vấn đề lớp native, không sửa được chỉ bằng `app.css`.

Nguồn: `styles.xml:1`, `MainActivity.java:139–146,313–329`. Chưa có ảnh Android xác nhận hình thức thực tế của các dialog này.

### A15 — P2 — Thiếu đường phục hồi khi kênh native không khởi tạo

**Source.** `native.js` phát toast sau20s nếu chưa nhận MessagePort hợp lệ, nhưng `nativeReady` không reject/resolve theo timeout. `nativeCall()` chờ promise này trước khi đặt timeout của từng request; shell vẫn ở startup pending. Vì vậy lỗi restore/preferences đã được test có đường mở shell, còn **không có handshake** chỉ hướng dẫn đóng/mở lại và chưa có retry/fallback usable trong trang.

`web/dist/MarkRead.html` còn meta `native-channel`, nên mở file này trực tiếp trong browser không tự trở thành chế độ browser. Các suite Browser UI chủ động bỏ meta đó; browser fallback là nhánh code được thử, không phải một bản phát hành web độc lập đã được xác nhận. Nguồn: `native.js:2–18`, `app.js:585–592`, `shell.html:2,7,13–17`. Xếp cùng G7 về trạng thái chờ/lỗi; không tự mở rộng trust/origin để phục hồi.

## 4. Chức năng bắt buộc giữ nguyên

Chi tiết ca kiểm tra nằm trong [REGRESSION_CHECKLIST.md](REGRESSION_CHECKLIST.md). Những hợp đồng thiết kế không được tự đổi:

- Đọc `.md/.markdown/.txt`, UTF-8 và UTF-16 có BOM; normalize BOM/CRLF về source nội bộ, xuất UTF-8. GFM, toán, code, Mermaid có giới hạn, bảng, ảnh raster local, link nội bộ và outline.
- Nguồn toàn bài, read/split theo khả năng màn hình, hợp nhất từng khối; bảo toàn source ngoài vùng sửa, Unicode và xuống dòng cấu trúc; draft riêng từng file.
- Bản sửa nằm trong RAM; nút Lưu dùng SAF tạo **bản sao**, không tự ghi đè URI nguồn. Đổi tên là thao tác native thực sự khác với xuất; browser fallback chỉ đổi tên trong phiên.
- CSS riêng parse/giới hạn và áp vào reader; import độc lập không thay cây/grant; giữ CSS cũ khi hủy/lỗi.
- 12 theme, bốn font, size/width/leading, Mermaid/unified, thứ tự tăng/giảm, CSS và persistence luôn bật. Không tự thêm chọn theme theo hệ thống hoặc dependency font.
- Thư mục con, collapse/filter, sort tự nhiên tiếng Việt, directory-first, depth-first; trước/sau không bị filter/collapse giới hạn, không quay vòng.
- Search nguồn UTF-16, plain/case/regex, replacement JavaScript, match cap, deadline worker và loại bỏ kết quả cũ.
- Đổi toàn basename/phần mở rộng, giữ opaque ID/draft/URI mới/giới hạn đọc; reject collision/path không hợp lệ, báo thiếu quyền ghi.
- SAF read/write theo cờ picker trả về; giới hạn provider local; persist/release đúng scope; CSS picker không nhả grant. Không thêm Internet/storage permission hay mở rộng bridge.
- Khôi phục trước 600.000ms; đúng/sau ngưỡng đóng bài cũ, giữ tree/list, gỡ standalone; không tính picker là thời gian rời app. Cài đặt không hết hạn; không âm thầm lưu draft ra đĩa.
- Startup theme/font/last-document ổn định; Back ưu tiên đóng menu/editor/dialog/drawer/search/mode rồi mới thoát/nhắc draft.

## 5. Kế hoạch nâng cấp để duyệt

Mỗi nhóm nên là một thay đổi có thể review/revert riêng, giữ contract nghiệp vụ ở trên. Thứ tự ưu tiên đề xuất; **chưa có nhóm nào được triển khai**.

### G1 — Focus và semantics shell — rủi ro trung bình, ưu tiên đầu

Giải quyết A01, A04, phần dialog của A12: drawer closed/open/focus return, semantics hàng tệp, tên dialog và trạng thái trigger. File chính `shell.html`, nhánh list/menu/dialog của `app.js`, selector focus trong `app.css`. Không đổi thứ tự file/transport. Cổng kiểm tra: keyboard + accessibility tree, Browser/Revision/Native UI, Back Android/TalkBack. Có thể tách drawer và list/dialog thành hai patch nhỏ.

### G2 — Bàn phím và accessibility editor — rủi ro cao

Giải quyết A02, A03, phần editor của A08. Duyệt cách indent, thoát focus và bắt đầu sửa hợp nhất trước khi sửa handler. Chạm `app.js`, `paper.css`, có thể thêm semantics ở nội dung tin cậy. Cổng kiểm tra: toàn bộ Reading/Workspace/Search, source/export chính xác, giữ caret/IME/iframe và rollback Escape. Độc lập với palette/icon; không kết hợp refactor renderer hay parser.

### G3 — Palette, selected và focus — rủi ro thấp đến trung bình

Giải quyết A07 và focus theme/rename của A08; định nghĩa token cho text/subtle/selected/outline/error theo 12 theme, kiểm tra từng cặp và trạng thái. Giữ ID palette, settings schema và preview thật. Nếu đổi màu nền cần đồng bộ mapping Java; nếu chỉ đổi foreground không cần sửa native. Assertion cũ yêu cầu bỏ focus rename phải được cập nhật theo phương án đã duyệt. Cổng kiểm tra: contrast 12 theme, startup/theme persistence, preview parity, screenshots và custom CSS.

### G4 — Vùng chạm và toolbar responsive — rủi ro trung bình đến cao

Giải quyết A06, A10: phân bổ target, gap, title và overflow ở 320–600px/ngang, không bỏ trước/sau/tìm/lưu/cài đặt/chế độ. Chủ yếu `shell.html`, `app.css`; chỉ chạm handlers khi cấu trúc thay. Cổng kiểm tra: hành vi toolbar một hàng hoặc phương án thay đã duyệt, tất cả chức năng vẫn truy cập được, long filenames, zoom/font lớn, IME và native insets. Không thay sort/navigation.

### G5 — Typography và spacing shell — rủi ro thấp đến trung bình

Giải quyết A09, nhịp 4/8 và thứ bậc text/caption trong sidebar/cài đặt/search. Giữ bốn lựa chọn font/giới hạn đã lưu. Phần **reader/source layout** tách patch riêng rủi ro cao hơn vì ảnh hưởng line wrap, block anchor, chiều cao editor và tiến độ. Cổng kiểm tra: font offline/Vietnamese, 200% text hoặc mức lớn nhất máy thử, landscape và Reading UI. Không tải font ngoài.

### G6 — Icon và nội dung hướng dẫn — rủi ro thấp

Giải quyết phần icon/copy/TXT của A12; dùng cùng kiểu SVG inline đã có, glyph decorative ẩn với screen reader; giữ accessible names. Đồng bộ hướng dẫn với luồng thật, nêu rõ export bản sao và draft RAM. Cổng kiểm tra: accessible names, mở tệp TXT/browser/native, không đổi grant và không thêm dependency.

### G7 — Feedback và motion — rủi ro trung bình

Giải quyết A11, A13, A15: busy feedback tại thao tác, trạng thái draft bằng chữ/semantics, lỗi có đường phục hồi, native handshake timeout và reduced motion phủ startup. Có thể xử lý fade startup ở patch nhỏ riêng. Thay đổi auto-hide toolbar chỉ làm sau khi đo và duyệt; giữ scroll-intent, focus phục hồi và progress. Không thêm autosave hay thay deadline phiên. Cổng kiểm tra: async cancel/stale responses, Startup/Session/Reading/Native UI và test thao tác liên tiếp.

### G8 — Native fallback và native theme — rủi ro trung bình, cần thiết bị

Giải quyết A05, A14 trong `MainActivity.java`/resource theme. Giữ WebView minimum, insets, picker, lifecycle và security settings. Cổng kiểm tra: unsupported WebView sáng/tối, confirm/exit/crash dialogs, system bars Android 8–15 và SAF thật. Không gộp sửa script emulator/upgrade cũ vào patch UI.

### Ngoài gói thiết kế

Sai lệch version/report và instrumentation cũ được ghi trong baseline để duyệt thành công việc riêng. Không chuyển sang Kotlin/Compose, không tách framework, cập nhật thư viện/SDK, thêm mạng, thay policy/grants, sửa quy tắc lưu hoặc tăng phiên bản trong giai đoạn này. Không tối ưu hiệu năng chỉ dựa phỏng đoán.

## 6. Điều kiện bắt đầu triển khai

Cần người dùng duyệt nhóm và mức thay đổi trải nghiệm, đặc biệt keyboard editor, focus rename, target/overflow toolbar và UI native. Sau đó mỗi nhóm phải có diff nhỏ, đối chiếu checklist chức năng, ảnh sáng/tối và báo cáo kiểm thử đúng môi trường. Baseline xanh hiện tại không thay thế kiểm thử accessibility hay SAF trên Android.
