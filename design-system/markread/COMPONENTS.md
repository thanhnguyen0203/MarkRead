# MarkRead — component specifications

**P1 đề xuất, chưa triển khai.** Mọi tên `mr-*`, category menu, editing navigator hoặc environment metadata mới bên dưới là hợp đồng P2; không phải API/file đã có. Áp dụng [MASTER](MASTER.md), [ACCESSIBILITY](ACCESSIBILITY.md), [MOTION](MOTION.md), [ICONS](ICONS.md). BẮT BUỘC và TÙY CHỌN dùng nghĩa trong MASTER.

## 1. Quy ước chung

- Button/icon-button dùng HTML button thật, `type=button` trừ submit. Target48×48 CSSpx và xác minh48dp, gap8, radius10; glyph Lucide24/stroke2. Button text14/20 weight500, padding12/16, min-height48; wrap nếu text lớn, không fixed-height cắt nhãn.
- Common states: normal, hover (fine pointer), pressed (surface tint, không border xanh/scale field), focus-visible neutral2px offset2, disabled thật, busy có tên/trạng thái. Focus hiện tức thì, độc lập selected/pressed và tồn tại đến khi blur.
- Primary: accent-fill/on-accent; secondary: elevated/text-primary; tertiary/icon: transparent/text-secondary, hover/pressed từ base; destructive text: error + nhãn hành động cụ thể. Không đổi màu accent toàn màn để báo lỗi.
- Không phải button nào cũng có border. Field mới dùng control-border1px và focus ring ngoài; border thường không đổi sang xanh khi tap. Disabled không giảm opacity toàn nhóm/label quan trọng.
- Busy không phụ thuộc animation-end. Nếu operation không có phần trăm thật, dùng status “Đang mở…” thay progress giả; spinner chỉ decoration của status. Khi modal mở, error/status nằm trong modal.

## 2. Header và toolbar

**Source hiện có:** `web/src/shell.html` header/#filename/#dirty/#prevFile/#nextFile/#findToggle/#download/#settings/#modeMenu; `app.js:updateNavigation/setMode/paintDocumentBar`; `app.css` toolbar/header.

- Áp dụng hai layout680px theo MASTER; giữ mọi thao tác mở danh sách, trước/sau, tìm, lưu, cài đặt và chế độ. Không thêm bottom bar cố định chiếm vùng đọc.
- Hàng title: hamburger khi drawer, tên bài, trạng thái draft có accessible description, Settings và More. Hàng actions khi hẹp: trước/sau/tìm/lưu. Khi rộng gom một hàng. Không dùng nút nhỏ32px để né bài toán bố cục.
- Tên file button hiện có vẫn F2/long press; More thêm mục có nhãn **Đổi tên tệp** để thao tác không phụ thuộc giữ lâu. Accessible name chứa tên đầy đủ; ellipsis không làm mất thông tin với TalkBack. Không tự rewrite links sau rename.
- More dùng menu mode hiện có, giữ ID trigger nếu có thể để giảm churn tests. Read/Source/Split checked đúng. Unified: ẩn các lựa chọn mode riêng, **giữ trigger menu để vào “Chọn khối để sửa”/đổi tên**. Đây là thay đổi cấu trúc đề xuất, sẽ cần cập nhật assertion visual cũ, không thay chính sách unified.
- Prev/next disabled ở boundary, không wrap, không phụ thuộc filter/collapse; title/aria-description có đích. Export accessible name “Lưu bản sao Markdown”; icon download đúng nghĩa create/export, không hứa lưu đè.
- Progress3px, selected track + accent foreground, role progressbar0–100, không live announce mỗi frame; hide/show header không làm mất progress hoặc focus. Header height đo thực tế, xem MOTION.

## 3. Library và drawer

**Source:** shell #sidebar/#scrim/#files, `app.js:renderFileList/bindRenameHold/clearFiles`, `workspace.js:fileTree/orderedPaths`.

- Sidebar surface, inset16/24; brand nhỏ, không hero/tagline chiếm nhiều dòng. Mở là primary toàn chiều rộng,48px min, có FolderOpen/chevron và menu hai lựa chọn hiện hữu.
- Scope caption có tên root đầy đủ khi cần; sort48 và **Gỡ bộ tệp**48 có nhãn, cách nhau8. Gỡ dùng X + text/menu label, không Trash: app không xóa file thật. Giữ confirm nếu có draft và release grants chỉ khi đã xác nhận.
- Filter tên tệp input48, label rõ (có thể label sr-only khi visual affordance đủ), placeholder chỉ hỗ trợ. Empty copy: “Chưa có tài liệu. Mở thư mục hoặc chọn tệp.” / “Không có tên tệp phù hợp. Xóa bộ lọc để xem lại.” Nhận biết TXT.
- Row min-height56, vertical padding12, inline gap8, file label14/20, extension12 không khung. Long filename wrap tối đa hai dòng ở base scale; ở font lớn cho tăng height, không che extension/current state.
- Selected: nền selected, chữ selected-text, current semantics + marker riêng; hover/press không xóa current. Folder vẫn native details/summary; không thêm ARIA tree giả. DOM listitem phải **chứa button**, không `button[role=listitem]`. Không đổi sequence hay scope khi thay cấu trúc semantics.
- Drawer đóng: không focusable/readable trong accessibility tree. Drawer mở: điều khiển modal rõ, đóng48px, focus vùng drawer, nền main không tương tác; giữ filter và scroll list. Dùng inert nếu hỗ trợ, fallback quản lý focus/tabindex/semantics ở WebView100; aria-hidden riêng không đủ.
- Đóng bằng close/scrim/Escape/Back trả focus trigger (trừ khi chọn bài, chuyển focus có chủ đích sang workspace). Không mở drawer chỉ vì người dùng Tab; focus không nhảy vào vị trí translateX ngoài màn.

## 4. Settings

**Source:** shell #settingsDialog, năm `[data-section]`, #fontOptions/ranges/switches/#customCSS; `app.js:uiSettings/settingsChange` và section handlers.

- Dialog max760px, radius20, content padding24 (hẹp16); title22/28, close48; header không đè nội dung. Một body scroll; không thêm nhiều vùng scroll lồng vào nhau trong mobile.
- Năm nhóm và chức năng giữ nguyên: **Màu giao diện; Font chữ & bố cục; Đọc & chỉnh sửa; CSS riêng; Chung & hướng dẫn**. Desktop nav200, rows56; hẹp/thấp dùng category selector48 mở menu dọc với cả năm nhãn đầy đủ, current name luôn hiện. Không tabs cuộn ngang cắt chữ như P0.
- Category menu là popover trong dialog, có Arrow/Home/End/Escape và menuitemradio; desktop nav vẫn aria-current hiện có. Một state section chung, không hai nguồn selected. Back/Escape đóng category menu trước dialog; không tạo route/Activity mới. Menu mới phải thêm vào Back handler có kiểm thử, chưa có trong source.
- Appearance: grid2 cột khi mỗi tile≥144px, một cột khi cần vì width/font lớn. Tile min-height56, màu preview theo palette thật, tên14/20, check24. Focus vòng ngoài lấy màu surface cha, không dùng selected border làm focus.
- Typography: bốn font ID giữ nguyên; combobox/listbox custom hiện có được chỉnh semantics nhất quán, option48, selected check. Khi font menu mở, giới hạn list và scroll nếu thiếu height; không đẩy range khỏi khả năng truy cập. Giữ range bounds/steps/defaults; row label/value luôn nhìn được, range target48/thumb20, keyboard arrows/Home/End theo native input.
- Editing: đúng hai switch hiện có. Label/tap row56+, track44×26, thumb20; role switch/checked, off/on có text/state ngoài màu. Không thêm lại switch “nhớ cài đặt”.
- CSS: textarea min-height160 nhưng được cuộn/có keyboard; label14; import/reset/apply48 wrap theo chiều rộng. Import chưa Apply; show inline result/error. Reset chỉ CSS, không reset appearance/grants. Hint liệt kê selectors/giới hạn và giữ nguyên parser/CSP.
- General: câu ngắn giải thích appearance tự lưu, draft RAM/10 phút và save bản sao. Stats/hướng dẫn hiện tại giữ; nội dung sửa nhãn cũ không tự tăng version. Các đoạn chú thích14/21, không chữ8–11px.

## 5. Đọc, source và hợp nhất

**Source:** shell #reader/#editor; `app.js:safeHTML/readerStyle/beginInline/finishInline/resizeInline`, `workspace.js` block mapping; paper.css.

- Reader là bài liền mạch, max-width từ preference; không thêm nền card/toolbar trên từng khối. Typography/gutter theo MASTER; ảnh/table/math không tràn parent. Custom CSS có quyền đổi chúng trong iframe.
- Source toàn bài dùng textarea hiện có,16/26 monospace, padding24/16; không CodeMirror/framework, không normalize thêm ngoài baseline. Selection/caret/undo browser và composition phải giữ.
- Unified textarea vẫn frameless, font/color theo bài, vị trí khối/height/structural newline và reuse focus giữ nguyên; keyboard focus dùng start marker neutral2px + lời mô tả trường, không vẽ hộp xanh quanh đoạn.
- Source keyboard spec: **Tab vẫn chèn hai space**, **Shift+Tab rời field về điều khiển trước, không sửa source**. Escape khi không có menu/find/dialog đang ưu tiên sẽ đưa focus khỏi source về More, giữ mode/source. Hint gần editor: “Tab thụt dòng; Shift+Tab hoặc Esc rời ô.” Như vậy giữ được indent và có đường thoát. Khi find/menu mở, Escape đóng lớp trên trước. Không bắt phím khi IME composition.
- Unified keyboard: More có “Chọn khối để sửa”, mở **một navigator nhẹ** với Khối trước/Khối sau/Sửa khối/Đóng. Đây là view state tạm mới, không setting/persisted data. Chọn khối gần viewport đầu tiên; thông báo loại khối + đoạn text ngắn; chuyển khối là programmatic scroll có anchor, không auto-hide header. Không thêm hàng nghìn tab stops/role button lên mọi đoạn.
- Nút Sửa dùng lại beginInline; khi đang sửa, navigator có Hoàn tất/Hủy để TalkBack và keyboard không lệ thuộc shortcut. Ctrl/Cmd+Enter commit, Escape hủy active block, Back vẫn hoàn tất như baseline. Commit/cancel trả focus navigator khi phiên sửa được bắt đầu bằng keyboard/assistive control; thao tác touch liên tiếp giữ đúng behavior không blur/refocus.
- Navigator không nằm trong source span/Markdown export, không cho nội dung untrusted chèn metadata. Nó có thể là toolbar của parent để giảm can thiệp DOM iframe; vị trí cụ thể phải proof bằng Reading/IME tests ở G2. Nếu chưa đạt, chưa phát hành G2, không thay bằng full iframe reload.

## 6. Search/replace

- Panel surface, padding16, label14, input48, button48. Hẹp: find row + prev/next; replace row được wrap để “Thay thế/Thay tất cả” không bóp input. Tùy viewport có thể xếp action trên hàng kế; tối đa khoảng45% chiều cao usable rồi cuộn panel, vẫn nhìn được reader/source và close.
- Giữ plain/case/regex, count/live status, alert invalid/timeout, source scope, worker caps/stale guards. `Aa`/`.*` là text shorthand có label “Hoa/thường”/“Regex”, không giả làm pictogram khác family.
- Focus mở vào find; Ctrl/Cmd+H vào replace; đóng trả trigger nếu còn tồn tại. Không steal focus khi count cập nhật; điều hướng mark không animate lâu. Error giữ query/replacement để sửa, disable replace khi stale/invalid.
- Không thêm search toàn cây, recent history hay network. Replace all không thêm confirm bắt buộc mới; giữ behavior và báo số thay.

## 7. Dialog, menu và form

- Menu elevated, radius12, inset8, row48/gap4–8; target dài wrap14/20. Không portal thư viện; dùng DOM/HTML primitives hiện có và kiểm tra focus. Dialog vẫn showModal; không mô phỏng bằng div khi không có lý do.
- Rename max440px, title22, field48, cancel/submit48, error14 nối aria-describedby. Viền thường neutral; keyboard ring2px riêng. Busy text và disable giữ nguyên, không cho rename thứ hai/stale submit. Full extension editable.
- Help/export có aria-labelledby; title/close/scroll rõ. Guide mở trên Settings thì topmost focus đúng, đóng trả Help trigger trong Settings. Export browser vẫn có link/copy/readonly fallback, native vẫn dùng OS picker.
- Form error đặt tại field, rõ nguyên nhân + cách sửa, role alert khi cần, không phát live toàn dialog lặp. Native JS confirm và dirty-exit giữ nút/chức năng đang có; typography/surface/foreground light/dark xử lý Java riêng.

## 8. Loading, feedback và fallback

- Startup giữ saved background + appearance/font/document first frame, status sau800ms; không skeleton bài giả hoặc crossfade welcome sang tài liệu. Khi handshake không đến sau20s: trạng thái lỗi có chữ “Đóng và mở lại MarkRead”, có đường đóng app native được xác minh trong G8; không tự mở file/network vì mất trust. Retry channel là **TÙY CHỌN**, chỉ khi chứng minh không tạo hai port/race.
- Mở/quét/lưu hiển thị status gắn thao tác nếu chưa xong sau300ms, disable thao tác trùng; pointer feedback ngay. Không trì hoãn thành công để spinner đủ thời gian; source còn đọc/sửa được nếu operation cho phép.
- Toast4.5s chỉ thông tin phụ, role status polite, không focus. Lỗi cần hành động có thông báo tại chỗ tồn tại đến khi sửa/thử lại; không chỉ toast hết hạn. Không thêm banner thường trực gây mất vùng đọc.
- Draft có text assistive “Có bản sửa chưa xuất”; visual marker nhỏ + tooltip/hint, không dấu tròn đơn độc. Không announce mỗi keystroke; announce khi chuyển clean↔dirty. Sau save bản sao vẫn nêu đúng hợp đồng gốc/draft.
- Native unsupported WebView: dùng foreground tương ứng nền, text18sp, padding dp, hướng dẫn đọc được ở cả3 theme sáng và9 tối. Native confirm/exit/crash dùng palette/native theme phù hợp; OS SAF giữ giao diện hệ thống. Không đổi grant/lifecycle để “đồng nhất giao diện”.

## 9. Kiểm thử bắt buộc theo component

Keyboard/focus/semantics + ảnh sáng/tối cho mỗi component thay; đo all states. Layout320/360/390/600/844×390/1280 và font200%; native targets/insets/IME/TalkBack trên Android thật. Unit/B/S suites chọn theo plan, source/export exact và scoped SAF không được thay bởi screenshot test. P1 chưa render những component đề xuất này.
