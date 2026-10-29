# MarkRead — motion system

**P1 đề xuất, không sửa animation hiện tại.** Áp dụng [MASTER](MASTER.md), [COMPONENTS](COMPONENTS.md), [ACCESSIBILITY](ACCESSIBILITY.md). Giải quyết A13 và phần feedback/header của A10/A11/A15, nhóm G7; không dùng thư viện animation.

## 1. Nguyên tắc bắt buộc

- Motion chỉ giải thích điều khiển vừa thay đổi, vị trí panel hoặc kết quả thao tác. Bài đọc/paragraph và danh sách file không có animation xuất hiện hàng loạt.
- Focus, checked/selected, disabled, busy và kết quả lưu là state tức thì; animation trang trí không được quyết định dữ liệu, trì hoãn focus hoặc khóa thao tác.
- Chỉ transition property có chủ đích: opacity/transform, màu control ở vùng nhỏ. Không `transition:all`, không tween width/height/font/padding của reader hay field.
- View đang có IME composition, selection/caret hoặc source block active không bị crossfade/reparent/reload vì animation. Không scale text khi nhấn.
- Ưu tiên reduced motion hơn mọi preset; không bắt buộc spring. Với sự kiện cuộn, motion phải theo ngón tay/scroll intent, không thêm easing time-based làm header trôi sau khi người dùng dừng.

## 2. Motion tokens đề xuất

Đơn vị ms, là số thực cấu hình một chỗ trong CSS/JS; chưa có trong source:

- `--mr-motion-none:0ms`: focus, reduced motion, seek/search/caret positioning.
- `--mr-motion-press:80ms`: tint khi pointerdown; phản hồi phải bắt đầu trong frame kế tiếp.
- `--mr-motion-fast:120ms`: hover/release/menu enter.
- `--mr-motion-standard:160ms`: switch thumb/chevron và đổi state nhỏ.
- `--mr-motion-enter:200ms`: dialog/toast enter.
- `--mr-motion-drawer:240ms`: drawer dịch tối đa320px.
- `--mr-motion-exit:140ms`: dialog; drawer exit180ms, popover exit80ms. Ngoại lệ có tên, không ép mọi exit đúng một số.
- `--mr-ease-standard:cubic-bezier(.2,0,0,1)`; `--mr-ease-enter:cubic-bezier(0,0,.2,1)`; `--mr-ease-exit:cubic-bezier(.4,0,1,1)`; linear chỉ vòng quay xác định và progress nếu phù hợp.
- Khoảng dịch: popover4px, dialog/toast8px, drawer theo chiều rộng thực. Không zoom toàn trang/scale iframe.

**TÙY CHỌN spring:** chưa cần cho nút, field, switch hoặc đọc bài. Chỉ thử spring có damping cao cho gesture drawer nếu sau này có thao tác kéo được duyệt, không overshoot quá2px, settle/cancel trong240ms. Không thêm thư viện/CSS `linear()` bắt buộc hay gesture mới chỉ để có spring; cubic-bezier là baseline. Motion bị hủy vẫn đặt final state đúng.

## 3. Choreography theo component

- **Button/icon:** normal→pressed tint80, release120; selected vẫn selected sau release; pointercancel/scroll/mất capture bỏ pressed. Không scale. Hover120 chỉ fine pointer, không sticky ở touch.
- **Field/focus:** ring hiện/biến mất ngay; pointer field giữ border neutral + caret, không flash ring xanh. Error color đổi tối đa120 nhưng text/alert xuất hiện ngay, không fade focus indicator.
- **Switch:** thumb translate160, background160; input.checked/role state đổi ngay. Track không layout shift; label-row target giữ nguyên.
- **Chevron/menu:** chevron rotate160; menu opacity120 + translateY4→0, exit80. Không đợi enter xong mới focus item. Menu đóng/đổi item trước khi callback animation kết thúc phải an toàn.
- **Drawer:** translateX240 enter/180 exit, scrim opacity160/120; width/layout cố định trong transition. Drawer semantics/focus isolation có hiệu lực ngay lúc mở. Close nhanh hoặc đổi breakpoint hủy animation cũ, khôi phục focus/inert đúng.
- **Settings/help/export/rename:** showModal có hiệu lực ngay; visual opacity200 + translateY8→0. Exit140 là tùy chọn, có thể close tức thì nếu cơ chế closing ảnh hưởng Back/keyboard. Không đặt dialog vào trạng thái vô hình nhưng còn focus trap sau đóng.
- **Toast/status:** opacity160–200, translate8; duration hiển thị4.5s không đổi. Lỗi cần hành động là nội dung tồn tại tại chỗ, không biến mất theo toast.
- **Theme change:** shell/reader palette đổi atomic, không full-document crossfade hoặc lộ theme trung gian. Có thể transition màu tối đa120ms cho control nhỏ; nội dung dài không animate background/color toàn viewport. Font change chờ font ready/giữ anchor, không animate font-size.
- **Unified block:** không tween. Reuse textarea/reader document, đồng bộ source spans, reserve host height và restore anchor theo baseline. “Mượt” ở đây là ổn định vị trí và focus, không hiệu ứng morph.
- **TOC/search/local link:** programmatic seek instant nếu đang sửa/tìm/reduced. Smooth anchor thủ công là tùy chọn, không phụ thuộc thời lượng để xác định match/caret; không bật smooth cho scroll do layout/IME.
- **Progress3px:** update scaleX theo progress thật trong rAF; không tween trễ giá trị, không announce mỗi phần trăm. Resize/content/font changes cập nhật đúng.

## 4. Header thu khi đọc

**Giữ chức năng P0:** sau khoảng đầu72px, cuộn xuống thu theo ý định người dùng; cuộn lên hiện lại; programmatic scroll không thu; focusin hiện lại; progress vẫn ở đầu.

Với header hai hàng, offset dùng **chiều cao thực** và geometry sau reflow, không dùng54/60px. Không thay markup/IME height khi pointer còn giữ nút. Khi field/menu/dialog/drawer/focus keyboard hoặc edit session active, header ổn định; không để control bị cuộn mất focus.

`app.css` hiện đổi margin-bottom theo scroll frame; P2 cần trace trước khi thay. Target tối ưu là transform/opacity vùng chrome với vùng reader ổn định, không tween reflow toàn tài liệu. Nếu thiết kế thu chrome cần resize reader, cập nhật geometry có chủ đích và đo anchor/progress; **không hứa giải pháp transform đơn thuần sẽ tự trả lại khoảng trống trong flow**. Đây là patch riêng sau G4, phải chứng minh lợi ích và không đổi scroller/source/offset algorithm.

## 5. Reduced motion và khả năng tắt

**BẮT BUỘC:** `prefers-reduced-motion:reduce` tắt mọi CSS animation/transition (kể cả startup keyframe), smooth scroll, spinner quay, auto-hide header và spring. State vẫn đổi ngay; dùng icon/status đứng yên cho loading. Không giả giảm motion bằng duration.01ms rồi dựa animationend.

Nguồn Android bổ sung nếu WebView không phản ánh tùy chọn hệ thống: đọc cờ hiển thị cục bộ qua API công khai đã kiểm chứng [Settings.Global.ANIMATOR_DURATION_SCALE](https://developer.android.com/reference/android/provider/Settings.Global#ANIMATOR_DURATION_SCALE). Scale0 là tín hiệu phải tắt; không ghi setting hệ thống, không thêm permission. Metadata/bridge flag để truyền sang CSS **chưa tồn tại** và là việc G8/G7, chỉ mang boolean transient, không appearance/draft. Khi media query hoặc native flag yêu cầu giảm thì kết quả là reduced; không dùng native flag false để ghi đè media query true.

Đọc lúc mở/return, không poll nền hay analytics. Lỗi đọc setting không làm kẹt startup: dùng media query/fallback tĩnh. Browser nhánh kiểm thử dùng media query. Không giả rằng mọi thiết bị Android tự phản ánh setting này vào WebView trước khi thử.

**TÙY CHỌN ngoài P2 bắt buộc:** switch animation riêng trong app. Nó cần mở rộng preference/schema có review riêng; không cài ngầm ở P1 hoặc đưa lại switch cũ không liên quan. Giảm/tắt qua OS/media query là yêu cầu nền tảng.

## 6. Hiệu năng và test

- Đo trên cùng thiết bị, cùng file: bài ngắn, bài dài gần5MiB, code/table/math, nhiều ảnh và tối đa8 diagram; cache/font cold và warm tách riêng. Không animate nội dung render Mermaid lần đầu.
- Mục tiêu sau khi input được dispatch: phản hồi control trong100ms, không thêm long task>50ms do motion; budget60Hz khoảng16.7ms/frame là mục tiêu profiling, không hứa đạt trên mọi máy.
- Không rAF liên tục khi idle; batch read/write layout, không getBoundingClientRect cho mọi block mỗi frame; không `will-change` toàn list/reader; cleanup observer/timer/animation.
- Test bật/tắt reduced trước startup và khi đang mở UI; startup status vẫn hiện đúng sau800ms **không fade**; không đổi các timeout nghiệp vụ search2.5s/handshake20s/session10 phút.
- Test rapid open→close→open, pointercancel, breakpoint/orientation/IME đổi giữa transition, focusin khi header đang thu; state cuối/focus/grants đúng và không có callback stale.
- Reading/Startup/Session suites, source/export exact, keyboard/TalkBack và trace Android là cổng P2. P1 chỉ xác định token/tiêu chí, chưa đo animation mới.
