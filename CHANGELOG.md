# MarkRead 1.1.3 — 27/10/2026

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
