# MarkRead — accessibility contract

**P1 đặc tả, chưa sửa các lỗi P0.** Mục tiêu P2 là UI dùng được với touch, keyboard, TalkBack, chữ lớn và giảm chuyển động. Đây không phải tuyên bố đạt toàn bộ WCAG/Android accessibility. [MASTER](MASTER.md) quy định màu/type/geometry; [COMPONENTS](COMPONENTS.md) quy định UI flow.

## 1. Mức yêu cầu và nguồn

- **BẮT BUỘC của dự án:** text thường≥4.5:1, meaningful non-text/focus/control boundary≥3:1, target Android≥48dp, keyboard thoát được, labels/state đúng, không che control đang focus, chữ200%/mức lớn nhất usable. Palette resolver dùng margin4.8/3.2; phải đo lại rendered UI.
- WCAG [Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) phân biệt text thường và text lớn; MarkRead giữ4.5 cho cả labels/caption thay vì lợi dụng ngưỡng chữ lớn.
- [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) dùng24×24 **CSSpx** và có ngoại lệ; đây khác mục tiêu48dp của [Android accessibility](https://developer.android.com/guide/topics/ui/accessibility/apps). Không gọi48px là một tiêu chí WCAG AA.
- [Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) và [Focus Not Obscured Minimum](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) là AA; MarkRead đặt mục tiêu thấy toàn control, cao hơn tối thiểu “không bị che hoàn toàn”. [Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) về diện tích2px/contrast cùng pixel là AAA; không trình bày nó là điều kiện AA mặc định.
- [No Keyboard Trap](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html) yêu cầu đường ra có thể dùng và được biết khi phím không thông thường. [Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) là cơ sở kiểm tra200%, không chỉ chụp screenshot mặc định.

## 2. Contrast và trạng thái

- Test cả12 theme, normal/hover/pressed/selected/focus/busy; primary text trên accent fill; muted trên panel/elevated/quote; syntax trên code; error/link và selected label. Alpha phải đo màu đã composite, không chỉ token gốc.
- Border decorative không cần giả thành control boundary3:1; ngược lại input chỉ nhận diện bằng border phải dùng border-control. Focus không phụ thuộc mỏng nhạt của decorative border.
- Disabled control được tiêu chuẩn miễn một số yêu cầu contrast, nhưng thiết kế vẫn đặt mục tiêu3.2 nội bộ để đọc được; helper text không disabled vẫn4.5. Không cả vùng form opacity.4.
- Selected có check/current/checked; error có nội dung cụ thể; draft có thông báo “Có bản sửa chưa xuất”. Không dựa duy nhất vào xanh/đỏ/dấu chấm.
- User CSS override reader có thể làm fail contrast; app không tự sửa user CSS hoặc gỡ declarations hợp lệ. Shell/settings/native phải còn đường nhập/reset CSS đọc được. Kết quả default palette không bảo đảm tùy biến mọi người dùng.

## 3. Focus không có viền xanh thô

Control thông thường: ring neutral theo heading của theme2px, offset2px, chỉ `:focus-visible`; focus không animate/fade. Padding container đủ để ring không bị overflow:hidden cắt. Theme tile ring đặt **ngoài** selected border/check, lấy màu surface cha để nhìn được kể cả tile có theme khác.

Pointer tap: không vẽ outer ring xanh khi chỉ nhấn button; pressed tint là feedback. Text field pointer vẫn có caret và border neutral rõ. Không blanket `outline:none` cho mọi input hoặc xóa highlight TalkBack của Android. Fallback nếu focus-visible không hỗ trợ phải **hiện focus**, không làm biến mất để đẹp screenshot.

Rename field phải có indicator keyboard riêng dù P0 test đang yêu cầu không ring. Inline field frameless có neutral start marker/caret và mô tả active; với component cao/rộng, marker phải có diện tích/visibility thích hợp, không tự nhận đạt Focus Appearance chỉ vì có một đường2px ngắn. P2 đo marker actual; nếu không đủ, dùng outline neutral cho riêng field keyboard.

Focus khi mở drawer/dialog chuyển vào lớp mở, đóng trả trigger hợp lệ; không focus off-screen. Không setTimeout đợi animation để focus. Header focusin hiện đủ, không tiếp tục auto-hide. Toast không steal focus; count/progress không kéo focus khỏi nơi đang gõ.

## 4. Keyboard contract

- Tab/Shift+Tab đi theo thứ tự nhìn thấy, không vào hidden sidebar hoặc section. Đóng sidebar phải loại cả descendant khỏi focus/accessibility, không chỉ transform/aria-hidden.
- Menu open/mode/font/category có ArrowUp/Down/Home/End, Enter/Space chọn, Escape đóng/trả trigger; Tab rời menu có quy ước đóng rõ. Không dùng ARIA menu nếu keyboard chỉ là các nút không có pattern tương ứng.
- Source giữ Tab indent2; Shift+Tab không chèn, đi về control trước. Escape khi không lớp trên đưa focus ra More, không đổi source/mode. Hint luôn truy cập được bằng aria-describedby và text ngắn gần editor. Ctrl/Cmd+S/O/F/H vẫn như hiện tại; không can thiệp khi composing hoặc chiếm shortcut trợ năng/OS.
- Unified có một lối “Chọn khối để sửa” qua More và navigator theo COMPONENTS; không bắt hàng nghìn div trở thành tab stop. Navigator hỗ trợ buttons rõ ràng với cả keyboard và TalkBack. Các link/summary trong bài giữ semantics đọc, không mặc định Enter trên mọi đoạn để sửa.
- Inline Escape vẫn cancel khối, Ctrl/Cmd+Enter commit; có nút Hoàn tất/Hủy cho assistive control. Back vẫn theo hợp đồng Android P0, không biến Cancel thành Commit cho cùng lệnh.
- F2/contextmenu/long press rename giữ nguyên; thêm menu text Đổi tên là equivalent action cho người không giữ lâu. Không phát rename khi scroll/mất pointer capture.

## 5. Semantics và TalkBack

- File list: li/listitem chứa button có tên path/current; không button role=listitem. Details/summary làm folder disclosure; không tree/treeitem nếu không triển khai đúng tree keyboard.
- Drawer: có tên “Tệp tài liệu”, expanded/control trên trigger, modal isolation khi mở; closed subtree không đọc. Có close rõ; đọc theo thứ tự brand/actions/scope/filter/list. Các glyph decorative aria-hidden.
- Settings/help/export/rename đều có tên dialog từ heading; label gắn input, mô tả lỗi nối aria-describedby/invalid. Settings chỉ section active trong accessibility tree, font options đúng selected/expanded, switches đúng checked và label.
- HTML listbox font hiện có cần kiểm chứng TalkBack: một model focus nhất quán, không vừa dùng aria-activedescendant vừa di chuyển DOM focus tùy trường hợp. Nếu giữ focus vào option buttons thì button/option semantics phải review trên WebView thật; không kết luận vì browser snapshot xanh.
- Đổi bài thông báo tên bài **một lần** sau load, không đọc toàn nội dung hoặc mỗi render; không luôn focus body gây mất vị trí keyboard. Outline link giữ heading context, math MathML và image alt đã có không bị mất khi style.
- Dirty clean↔dirty thông báo ngắn, không mỗi keystroke. Search count live polite theo query debounce; error alert có nghĩa, không lặp do aria-live lồng. Reading progress không live-update gây nhiễu.
- Native Java TextView/AlertDialog phải có text/nút rõ và theme foreground thích hợp; không sửa Android AccessibilityService. SAF picker thuộc OS/provider, không can thiệp accessibility tree của hệ điều hành.

## 6. Scaling và vùng chạm

- Dùng48×48 CSSpx làm min layout; **đo dp thật**, density/display size, không nhân devicePixelRatio để tự kết luận dp. Không hit-slop chồng nhau. Text controls có thể cao hơn48, row56 là min, không max.
- UI authoring dùng rem/base size; Android effective metrics theo MASTER, source/reader dùng đúng cỡ tương ứng. Font slider vẫn lưu giá trị cơ sở12–32, không đổi metadata10 phút. Nội dung nhãn/value/helper không cắt ở200%/max scale; dialog/menu cuộn, không giấu nút đóng hoặc thao tác chính.
- [Configuration.fontScale](https://developer.android.com/reference/android/content/res/Configuration#fontScale) chỉ mang thông tin; tài liệu Android cảnh báo không dùng trực tiếp làm multiplier vì scaling phi tuyến. Dùng API [TypedValue.applyDimension](https://developer.android.com/reference/android/util/TypedValue#applyDimension(int,float,android.util.DisplayMetrics)) với COMPLEX_UNIT_SP cho từng cỡ/role, chia mapping density→CSSpx đã được đo ở WebView. Có thể gửi bảng nhỏ các cỡ UI và21 mức reader nguyên12–32 trong meta/attribute transient mới; không sửa appearance/URI bridge. Với giá trị cỡ lẻ từ preference cũ, giữ nguyên giá trị và quy định nội suy metric đã đo hoặc converter numeric có giới hạn được review, không âm thầm làm tròn preference.
- [WebSettings.setTextZoom](https://developer.android.com/reference/android/webkit/WebSettings#setTextZoom(int)) đặt phần trăm zoom trang; code hiện100. Native TextView dùng sp/padding dp. Chỉ có **một** layer effective font scaling: không nhân fontScale hoặc tăng textZoom thêm sau metric native. Kiểm chứng Android8/15, WebView100/current và density/display-size khác nhau; lỗi lấy metric dùng base sizes và UI mở được, không đợi handshake mới thấy chữ. Không cap effective text về cỡ mặc định khi hệ thống yêu cầu lớn.
- Không giả metadata mới có sẵn: cần thêm trong G5/G8, bounded numeric và CSP-safe tương tự appearance embedding, không nội suy script. Không thêm permission/network/saved preference. Display size làm thay viewport và phải reflow, không scale icon target nhỏ đi.

## 7. Insets, keyboard và motion

- Native root đã xử lý status/nav/IME; không CSS padding-safe-area trùng. Test gesture và3-button nav, cutout, portrait/landscape, bàn phím tiếng Việt/phím vật lý. Field/caret và ít nhất hành động hoàn tất/đóng phải luôn tới được bằng scroll.
- Focus control không ẩn sau header/search/dialog/keyboard do app tạo; không sửa hành vi OS bằng overlay click xuyên. Modal top layer cao hơn z-index toast, nên errors khi modal mở phải ở modal.
- Reduced motion tắt keyframes startup, transition, smooth scroll, auto-hide và spinner; text/status còn rõ. Xem MOTION về native flag khi WebView không phản ánh OS. Không tăng delay nghiệp vụ chỉ để “chậm hơn dễ dùng”.

## 8. Ma trận nghiệm thu P2

- **B/M keyboard:** fresh launch Tab đầu không ngoài viewport; mở/đóng tất cả menu/dialog; source Tab/Shift+Tab/Escape; unified navigator/commit/cancel; selection/focus độc lập12 theme.
- **B/M layout:**320×568,360×800,390×844,600×960,844×390,1280×800, scale1/1.5/2/max; kiểm tra no body overflow và full labels/actions trong settings, CSS/search/rename.
- **A/M:** TalkBack swipe focus/double-tap trên các workflow mở file, đọc, chọn khối sửa, rename, search/replace, export, CSS và Settings; keyboard/IME true; hệ thống font/display size/reduced animation; kiểm thử native fallback/dialog light/dark.
- **U/B/S:** giữ source bytes nội bộ, source spans/separators, draft riêng, extension rename, natural order, search timeouts/stale results, export/CSP; **A** mới chứng minh SAF thật/grant persistence/lifecycle.
- Lỗi nghiêm trọng: mất source/draft ngoài contract, keyboard không ra được, focus vô hình/ngoài màn, controls mất tên, grant bị mở rộng/nhả sai, chức năng bị bỏ. Chặn phát hành nhóm liên quan.

P1 chỉ đã kiểm tra tính đủ của đặc tả và palette math. Không đánh dấu TalkBack, rendered focus, system font scale, Gradle hay SAF thật là PASS trước khi P2 chạy chúng.
