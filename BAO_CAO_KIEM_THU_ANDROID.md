# Báo cáo kiểm thử MarkRead Android 1.1.3

Ngày kiểm tra: 27/10/2026. Package `vn.markread.local`, versionCode 113, versionName 1.1.3.

## Kết quả của lượt phát hành này

Tổng cộng **312 kiểm tra đạt**, gồm:

- **76 JavaScript unit:** parser, CSS, đường dẫn, MessagePort, cây tệp, bản sửa, tên tệp, tìm/thay thế, regex.
- **69 Java Policy:** nguồn trang tin cậy, URI cục bộ, tên tệp, giới hạn đọc và xuất.
- **53 giao diện hồi quy:** đối chiếu preview của cả 12 theme với màu nền/chữ thực tế ở hai kích thước 390×844 và 1280×800; một viền chọn; chỉnh khối không có khung hoặc thanh MARKDOWN; hủy/kết thúc sửa; giữ nguyên nguồn ngoài khối; font, cây tệp, xuất, công thức, Mermaid và lọc HTML.
- **62 giao diện bổ sung:** menu Đọc/Nguồn cảm ứng và bàn phím, giữ bản sửa khi chuyển chế độ, đóng menu khi chạm ngoài/Esc; thanh điều hướng ở sáu kích thước; cài đặt, tìm/thay thế, regex timeout, đổi tên và nhập CSS.
- **27 luồng native mô phỏng:** Chromium với MessagePort host mô phỏng; đọc theo ID có giới hạn, đổi tên, giữ bản sửa, chỉnh hợp nhất, xuất Unicode, nhập CSS/hủy/lỗi và thu hồi bộ tệp.
- **25 kiểm tra APK:** manifest biên dịch, package/version, SDK tối thiểu 26 và target 35, DEX, ZIP CRC, renderer mới nhất, CSP khớp script, font offline, không có khóa riêng trong gói, chính sách WebView và không khai báo quyền.

Log của lượt này nằm trong `test-results/1.1.3/`. Các bài kiểm thử chạy thành công, không báo lỗi JavaScript hoặc yêu cầu mạng ngoài trong các bộ UI.

## APK được bàn giao

- File: `dist/MarkRead-Android-1.1.3.apk`, 7.127.896 byte.
- Chữ ký APK v2 và v3 được apksigner xác minh; zipalign kiểm tra thành công.
- Renderer trong APK trùng từng byte với `app/src/main/assets/index.html`.
- SHA-256 và thông tin gói lưu tại `dist/SHA256SUMS.txt` và `test-results/1.1.3/ARTIFACT.json`.
- Build trên Windows bằng Java 17, Eclipse ECJ và Android SDK API 35. Sửa tương thích đường dẫn Windows và phần mở rộng công cụ; không thay đổi các tính năng ngoài ba yêu cầu giao diện.

## Chữ ký và cài đè

Không có khóa ký riêng của bản cũ trong checkout. Lượt build này tạo khóa cục bộ mới ở `private/` và dùng lại khóa đó cho các lần build tiếp theo. Không đưa khóa hoặc mật khẩu vào APK hay nhật ký kiểm thử.

Chứng thư mới **khác** chứng thư trong file `APK_SIGNATURE.txt` ở gốc dự án. File cũ được giữ nguyên; kết quả đối chiếu nằm ở `test-results/1.1.3/SIGNING_STATUS.txt`. APK này không cài đè được một bản đang cài bằng chứng thư cũ. Muốn giữ khả năng cài đè cần khôi phục đúng khóa riêng cũ rồi build lại. Xuất mọi bản sửa cần giữ trước khi thay bản cài; gỡ app sẽ xóa cài đặt và quyền thư mục đã nhớ.

## Phạm vi và giới hạn

Lượt này chưa chạy Android giả lập, chưa cài APK lên điện thoại thật và chưa kiểm tra Android Storage Access Framework thực tế. Kiểm tra native mô phỏng và Chromium không thay thế kiểm thử WebView/provider Android. Không tính việc cài đặt, cài đè hoặc tính tương thích khóa cũ là kiểm tra đã đạt.

Chỉ ba hành vi giao diện yêu cầu được thay đổi: sửa hợp nhất không khung, menu ba chấm dọc khi tắt hợp nhất, preview theme đúng màu với một viền. Các thay đổi khác phục vụ số phiên bản, đóng gói, hướng dẫn và bằng chứng phát hành.

## Lịch sử

Báo cáo 1.1.2 trước khi cập nhật được lưu tại `test-results/history/BAO_CAO_KIEM_THU_ANDROID_1.1.2.md`. Các log cũ ở gốc `test-results/` thuộc các lượt trước, không được dùng làm kết quả của 1.1.3. Những tuyên bố cài đè, chữ ký tương thích hoặc Android giả lập trong tài liệu lịch sử không áp dụng cho APK mới này.
