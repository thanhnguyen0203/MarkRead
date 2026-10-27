# MarkRead 1.1.5 — 27/10/2026

- Luôn tự động lưu theme, font, cỡ chữ, bố cục, tùy chọn đọc/chỉnh sửa, thứ tự tệp và CSS; bỏ công tắc nhớ cài đặt mặc định tắt. Android lưu bản bền vững trong SharedPreferences, tiếp nhận cài đặt WebView đã lưu từ bản trước.
- Trước 10 phút rời app, khôi phục thư mục/bộ tệp và đúng tài liệu gần nhất; từ đúng 10 phút đóng các tài liệu cũ. Giữ thư mục và danh sách tệp, gỡ bộ tệp mở riêng khi hết phiên. Cài đặt không hết hạn.
- Áp dụng cùng quy tắc khi app còn sống trong nền; không tính thời gian ở bộ chọn mở/lưu tệp. File mở riêng nhận quyền bền vững theo đúng cờ hệ thống trả về.
- Chỉ lưu metadata và URI được cấp quyền; bản sửa chưa xuất vẫn cần lưu thủ công. Nút × gỡ phiên và quyền mà không xóa cài đặt.
- VersionName 1.1.5, versionCode 115; dùng lại khóa ký cục bộ hiện có. Kiểm chứng và giới hạn môi trường nằm trong `test-results/1.1.5/`.

# MarkRead 1.1.4 — 27/10/2026

- Bỏ nút “Thêm đoạn” ở cuối nội dung tài liệu.
- Tắt highlight chạm trong vùng nội dung, kể cả phần tử giả CSS; tắt highlight focus mặc định của WebView. Giữ con trỏ nhập và chỉ báo focus bàn phím trong giao diện web.
- Bỏ dòng trống phát sinh khi chạm vào khối để sửa: ký tự xuống dòng cuối khối được giữ riêng trong nguồn Markdown, không tạo thêm hàng trong ô nhập. Giữ chiều cao khối ban đầu và khoảng cách gốc; giữ nguyên ký tự xuống dòng khi chỉ mở/đóng hoặc hủy sửa.
- Bỏ nhóm chuyển chế độ trùng lặp trong cài đặt. Chuyển Đọc/Nguồn bằng menu ⋮ trên thanh điều hướng; giữ Chia đôi trên màn hình lớn trong menu này.
- Thêm thanh tiến độ đọc cao 3 px, dùng màu theme, ngay dưới đường phân cách thanh điều hướng. Thanh vẫn nằm ở đầu vùng đọc khi thanh điều hướng ẩn; cập nhật theo cuộn, đổi chế độ, đổi tài liệu và thay đổi kích thước nội dung.
- Tăng versionName lên 1.1.4 và versionCode lên 114; dùng lại khóa ký cục bộ của APK 1.1.3. Không thay đổi các tính năng khác.

# MarkRead 1.1.3 — 27/10/2026

## Bổ sung giao diện đọc và chỉnh sửa

- Bỏ khung viền quanh nhãn định dạng tệp, gồm MD trong danh sách và trên thanh tiêu đề.
- Ô đổi tên giữ nguyên viền thông thường khi được chọn; bỏ viền xanh bao ngoài.
- Trong chế độ hợp nhất, chạm đoạn khác để chuyển trực tiếp sang sửa đoạn đó. Giữ nguyên trang đọc, vị trí vừa chạm và ô nhập đang lấy nét; không tải lại iframe rồi khôi phục vị trí cuộn. Nếu chưa thay đổi nội dung, dùng lại phần hiển thị sẵn có khi chuyển đoạn.
- Thanh tiêu đề ẩn dần khi cuộn xuống sau một đoạn đầu và hiện dần khi cuộn lên. Việc định vị bằng chương trình không tự ẩn thanh; tùy chọn giảm chuyển động giữ thanh ổn định.
- Giữ nguyên versionName 1.1.3 và versionCode 113. APK được dựng lại bằng khóa ký cục bộ đã có, không thay đổi các tính năng khác.
- 266 kiểm tra đạt: 76 unit, 53 Browser UI, 62 Revision UI, 23 Reading UI, 27 native mô phỏng và 25 kiểm tra APK. Chưa kiểm thử trên Android thật hoặc giả lập; không cộng lại 69 Java Policy của lượt trước vào tổng lần này.

## Thay đổi trước đó trong 1.1.3

- Bỏ khung, nền hộp, thanh MARKDOWN và nút kéo giãn khi sửa trong chế độ hợp nhất Đọc/Nguồn. Vùng sửa dùng font và màu chữ của bài, tự giãn theo nội dung. Chạm ngoài hoặc Ctrl/Cmd+Enter để kết thúc; Esc hủy lần sửa đang mở.
- Khi tắt hợp nhất, thêm nút ba chấm dọc ở góc trên bên phải để chuyển Đọc/Nguồn. Menu phản ánh chế độ hiện tại, hỗ trợ bàn phím và đóng khi chạm ngoài, Esc hoặc Back Android.
- Mỗi ô theme hiển thị đúng màu nền/chữ của theme đó trên giao diện cảm ứng và chuột. Theme đang chọn chỉ có một viền liên tục, giữ dấu chọn và chỉ báo lấy nét bàn phím.
- Tăng versionCode lên 113, versionName 1.1.3; sửa đường dẫn build để đóng gói trên Windows. Không thay đổi các tính năng còn lại.
- Không có khóa ký riêng của bản cũ trong checkout. APK của lượt build này dùng khóa ký cục bộ mới; không tuyên bố cài đè được bản ký bằng khóa cũ.
- Kết quả kiểm chứng của bản này lưu ở `test-results/1.1.3/`; báo cáo 1.1.2 được giữ trong `test-results/history/`.

# MarkRead 1.1.2

- Bỏ menu ⋯ và toàn bộ chế độ tập trung; chuyển nhóm Đọc/Nguồn/Chia đôi vào cài đặt chỉnh sửa.
- Dùng bộ chọn font theo theme, điều khiển dạng nhóm, thanh kéo và hiệu ứng nhấn nhẹ. Giữ chỉ báo lấy nét bàn phím.
- Tắt WebView tap highlight và giới hạn hover cho chuột để nút cảm ứng nhả màu sau khi chạm.
- Làm lại nút Mở với biểu tượng SVG; bỏ nút đóng cạnh thương hiệu.
- Cho sửa toàn bộ tên và phần mở rộng; bỏ mô tả đổi tên. Giữ opaque ID, URI trả về, giới hạn đọc và bản sửa khi tên thay đổi. Nhận thêm tài liệu .txt.
- Thêm tìm/thay thế từng kết quả hoặc tất cả trong nguồn Markdown, hoa/thường, regex và mở rộng nhóm bắt JavaScript. Worker riêng có thời gian chờ, giới hạn số kết quả và dung lượng; hủy kết quả quá hạn hoặc thuộc tài liệu cũ.
- Nhập CSS từ bộ chọn Android riêng, kiểm tra loại tệp/dung lượng/mã hóa; giữ nguyên cây tài liệu, quyền thư mục và CSS cũ khi hủy/lỗi.
- VersionCode 112; giữ package và khóa ký của 1.1.1. Giữ manifest không yêu cầu quyền và chính sách ngoại tuyến.
