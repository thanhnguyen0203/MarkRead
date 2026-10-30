# MarkRead — Lucide iconography

**P1 đề xuất, chưa nhập SVG hoặc thêm package.** Người dùng chọn Lucide; hướng dẫn Phosphor/React trong skill không áp dụng. Xem [MASTER](MASTER.md) và [COMPONENTS](COMPONENTS.md).

## 1. Chuẩn bắt buộc

- Một family **Lucide outline**, glyph hành động24×24 CSSpx, viewBox `0 0 24 24`, stroke-width2 trong viewBox, fill none, stroke currentColor, round caps/joins. Không trộn nét1.7, gear19px, ký tự font và icon filled ở cùng toolbar.
- Icon24 nằm giữa button target48, không mở hit area bằng pseudo-element chồng sang nút bên cạnh. Gap icon/label8. Icon inline phụ có thể16px trong lớp decoration riêng, không dùng16 cho nút chính.
- Selected/pressed/focus không đổi stroke hoặc scale glyph; đổi token foreground/background và check/state ngoài màu. Disabled không dùng icon opacity khiến label bình thường mất contrast.
- Glyph không có text thay thế riêng nếu nằm trong button đã có tên hoặc có visible label tương đương: `aria-hidden=true`, `focusable=false`. Accessible name/state đặt trên control thật. SVG không là tab stop. Standalone meaningful graphic cần tên/description thích hợp.
- Giữ brand `mr` và launcher icon sách hiện tại; đây là nhận diện, không phải icon chức năng phải đổi sang Lucide. MD/TXT/extension là text metadata. `Aa`/`.*` là shorthand có nhãn Hoa/thường/Regex, không phải icon family thứ hai.

## 2. Mapping đã kiểm tra nguồn chính thức

Tên icon sau đã được xác minh có trang Lucide chính thức ngày27/10/2026. Mapping là thiết kế, không khẳng định repo đang chứa file SVG tương ứng:

- `#menu` → [menu](https://lucide.dev/icons/menu), tên “Danh sách tệp”; expanded/controls theo drawer.
- `#openMenu/#openFolder` → [folder-open](https://lucide.dev/icons/folder-open); mục mở tệp → [file-text](https://lucide.dev/icons/file-text). Không biến cùng folder thành thư mục có quyền ngoài scope.
- `#prevFile/#nextFile` → [chevron-left](https://lucide.dev/icons/chevron-left) / [chevron-right](https://lucide.dev/icons/chevron-right), “Tệp trước/Tệp sau”; disabled ở boundary.
- `#findToggle` và decoration filter → [search](https://lucide.dev/icons/search). Nút có tên “Tìm và thay thế”; filter input tự có label riêng.
- `#download`/export link → [download](https://lucide.dev/icons/download), “Lưu bản sao Markdown”, không “Đã lưu tệp gốc”.
- `#settings` → [settings](https://lucide.dev/icons/settings), “Cài đặt”.
- `#modeToggle`/document More → [ellipsis-vertical](https://lucide.dev/icons/ellipsis-vertical), tên theo menu công cụ thực tế, aria-haspopup/expanded/controls.
- `#sortOrder` → [arrow-up-down](https://lucide.dev/icons/arrow-up-down), mô tả chiều tăng/giảm đang có; giữ aria-pressed và label có nghĩa, không chỉ nói “nút sort”.
- Close dialog/drawer/find và `#forget` → [x](https://lucide.dev/icons/x). **Gỡ scope phải có nhãn “Gỡ bộ tệp”**, không chỉ X vô danh; close từng nơi có tên riêng. Không dùng Trash vì không xóa file trên đĩa.
- Theme/font/mode selected → [check](https://lucide.dev/icons/check); state thật aria-pressed/selected/checked vẫn cần. Không đọc “check” lặp cùng nhãn option.
- Open/font/category disclosure → [chevron-down](https://lucide.dev/icons/chevron-down), decorative; rotate theo expanded, reduced motion không rotate tween.
- Find previous/next match → [arrow-up](https://lucide.dev/icons/arrow-up) / [arrow-down](https://lucide.dev/icons/arrow-down), tên “Kết quả trước/Kết quả sau”, khác file navigation.
- Read/Source/Split menu → [book-open](https://lucide.dev/icons/book-open), [code-xml](https://lucide.dev/icons/code-xml), [columns-2](https://lucide.dev/icons/columns-2); kèm nhãn Đọc/Nguồn/Chia đôi và radio state, không chỉ icon.
- Mục đổi tên/entry sửa khối → [pencil](https://lucide.dev/icons/pencil), có nhãn rõ thao tác; không sửa dữ liệu khi chỉ focus icon.
- Browser copy export → [copy](https://lucide.dev/icons/copy), có status khi copy hoặc fallback select thành công.
- Hướng dẫn/trạng thái thông tin → [info](https://lucide.dev/icons/info); lỗi/cảnh báo → [triangle-alert](https://lucide.dev/icons/triangle-alert), luôn có câu phân biệt error/warning.
- Busy decoration → [loader-circle](https://lucide.dev/icons/loader-circle), reduced motion giữ tĩnh và có status text. Không animate cả23 glyph hoặc giữ vòng quay khi idle.

Tổng **23 hình Lucide khác nhau**; một hình dùng nhiều vai trò thì tên/semantics thay theo control, không hardcode aria-label theo tên icon.

## 3. Cách đưa vào code ở P2

Lucide có [SVG tĩnh dùng ngoài framework](https://lucide.dev/guide/static). MarkRead sẽ copy **chỉ các SVG cần dùng**, review path/attribute, ghi tag/commit và SHA nguồn trong manifest asset/notices của lần triển khai. Không dùng `lucide-react`, `createIcons()` runtime, npm package mới, CDN, icon font hoặc request URL icon lúc chạy.

Shell hiện đã inline SVG và builder nhúng nguyên shell; phương án ưu tiên là inline SVG tin cậy vào chính cấu trúc đó. Nếu cần helper chung cho glyph động, tạo module nội bộ nhỏ **ở P2** và review riêng; không có `icons.js`/sprite sẵn được giả định trong P1. Không fetch SVG trong iframe, không thêm external `<use>` hoặc nới CSP để tiện tải icon. SVG được chép vào code thuộc asset tin cậy, không được trộn với Markdown untrusted.

P1 mới xác minh catalog/tên, **chưa vendoring SVG, chưa chốt revision byte asset**. P2 phải pin một tag/commit nhất quán cho toàn bộ subset, lấy path chính xác tại revision đó và ghi nguồn. Không vẽ phỏng đoán path rồi gọi là Lucide. Nếu tên đã đổi tại revision chọn, xác minh alias hoặc chọn lại tên có review trước khi dùng.

## 4. License và offline

[Lucide License](https://lucide.dev/license) công bố ISC và các icon kế thừa Feather có notice MIT liên quan. Khi đưa SVG vào P2, giữ copyright/permission notice đúng **revision đã pin**, kể cả notice Feather áp dụng; append vào `app/src/main/assets/THIRD_PARTY_NOTICES.txt` hiện có và đảm bảo gói trong APK. Không chép toàn bộ website/catalog. P1 không sửa notice/asset vì chưa phân phối SVG.

Link trong tài liệu phục vụ tra cứu thiết kế, không phải URL app sẽ gọi. Runtime hoàn toàn offline, không thay permissions/CSP/transport. Không thêm telemetry tải icon hay kiểm tra phiên bản Lucide khi mở app.

## 5. Cổng kiểm thử P2

- Kiểm tra subset đủ23 tên/nguồn/revision/license; SVG không script/href/event/embedded resource, không cần `unsafe-inline` script mới.
- Chụp cùng glyph24/stroke2 ở Dark/Light/Sepia/OLED, target48 và zoom/font lớn; không dịch layout khi nhấn.
- Accessibility tree chỉ đọc button name/state một lần, không tên file SVG; test close/forget khác nghĩa và sort/selected đúng state.
- Build HTML/APK chứa icon offline; không request bên ngoài, render CSP hash/reader isolation như baseline. Brand/extension label tiếp tục đúng.
