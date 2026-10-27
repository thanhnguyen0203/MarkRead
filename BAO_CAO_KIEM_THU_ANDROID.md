# Báo cáo kiểm thử MarkRead Android 1.1.4

Ngày kiểm tra: 27/10/2026. Package `vn.markread.local`, versionName 1.1.4, versionCode 114.

## Thay đổi

- Bỏ nút Thêm đoạn ở cuối bài.
- Tắt tap highlight của vùng đọc, phần tử giả CSS và focus highlight mặc định của WebView. Giữ con trỏ nhập chữ và focus bàn phím của giao diện web.
- Tách ký tự xuống dòng cuối khối khỏi vùng nhập hiển thị, giữ dấu phân cách trong nguồn; không thêm khoảng trống khi chạm đoạn văn. Giữ vị trí chạm, cùng ô nhập đang lấy nét và iframe hiện tại khi chuyển đoạn.
- Bỏ nhóm Đọc/Nguồn trong cài đặt; menu điều hướng giữ Đọc/Nguồn và Chia đôi trên màn hình lớn.
- Thanh tiến độ 3 px dùng màu theme, ngay dưới đường phân cách điều hướng; vẫn ở đầu vùng đọc khi điều hướng ẩn. Cập nhật theo cuộn, kích thước, thay nội dung, đổi tài liệu và chế độ.

## Kết quả thực thi

Tổng **289 kiểm tra đạt**:

- 76 JavaScript unit: parser, CSS, đường dẫn, MessagePort, cây tệp, nguồn, tên tệp và tìm/thay thế.
- 53 Browser UI: 12 theme ở điện thoại/máy tính, font, cây tệp, chỉnh khối, xuất, CSS, công thức và Mermaid.
- 62 Revision UI: menu chế độ, bàn phím/cảm ứng, sáu kích thước màn hình, cài đặt, tìm/thay thế, regex timeout, đổi tên và nhập CSS.
- 46 Reading UI: không còn nút thêm đoạn; chạm không làm dịch đoạn dưới; nguồn giữ đúng dấu phân cách; chuyển đoạn giữ focus/vị trí; sửa, tách, hủy; thanh điều hướng ẩn/hiện; tiến độ cuộn thường/lập trình, giảm chuyển động, 100% ở cuối/bài ngắn, đổi bài, chế độ Nguồn, Chia đôi; bảo toàn nguồn đã nhập khi mở/đóng/hủy với CRLF chuẩn hóa sẵn, tệp không có xuống dòng cuối và nhiều dòng phân cách.
- 27 luồng Android mô phỏng bằng Chromium và MessagePort host: đọc có giới hạn, bản sửa, đổi tên, xuất Unicode, nhập CSS và thu hồi bộ tệp.
- 25 kiểm tra APK: package/version, SDK, manifest không yêu cầu quyền, DEX, ZIP CRC, renderer mới nhất, CSP/script hash, font ngoại tuyến và không đóng gói khóa riêng.

Các bộ UI không có lỗi JavaScript; Browser UI và Revision UI xác nhận không gọi mạng ngoài. Loại bỏ một quy tắc CSS thừa dành cho các nút chế độ đã xóa sau khi chạy UI; APK cuối được dựng lại và kiểm tra lại renderer, CSP, manifest và chữ ký.

## APK và chữ ký

- APK: `dist/MarkRead-Android-1.1.4.apk`.
- Dung lượng: 7,131,992 byte.
- SHA-256: `18f36262b682ddebf2fc5b4a5ba88ed554a77d6050b7ef9d45aaafd097c76763`.
- Chứng thư SHA-256: `52a8a4d97bf264d0d43914f71408f6ccdaf6622951c55246157239aae13c2b54`.
- Chữ ký v2/v3 và zipalign được xác minh. Chứng thư trùng APK 1.1.3 cục bộ trong dự án; không tạo khóa mới.
- Renderer trong APK trùng byte với nguồn asset và bản dựng web.

## Giới hạn kiểm chứng

Chưa chạy Android thật hoặc giả lập; Chromium có cảm ứng và thay đổi chiều cao viewport chỉ mô phỏng bố cục/bàn phím. Không cộng lại 69 Java Policy của bản trước.

Ứng dụng không có lớp vẽ vòng tròn báo chạm. Vòng tròn do tùy chọn Show taps của Android hoặc trình quay màn hình cần tắt tại thiết bị; thay đổi WebView không thể xác nhận loại bỏ một lớp hiển thị của hệ thống. Tham khảo [Android Developer options](https://developer.android.com/studio/debug/dev-options).

Log, metadata và ảnh tiến độ nằm trong `test-results/1.1.4/`. Báo cáo 1.1.3 trước đó được giữ ở `test-results/history/BAO_CAO_KIEM_THU_ANDROID_1.1.3_reading.md`.
