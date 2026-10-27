# Báo cáo kiểm thử MarkRead Android 1.1.2

Ngày kiểm tra: 27/10/2026.

## Kết quả kiểm tra tự động đã hoàn tất

| Nhóm | Số kiểm tra đạt | Phạm vi |
| --- | ---: | --- |
| JavaScript unit | 76 | Parser, CSS, đường dẫn, kênh native, cây tệp, bản sửa, tên đầy đủ, tìm/thay thế và regex. |
| Java Policy | 69 | Nguồn trang tin cậy, URI cục bộ, tên tệp, phần mở rộng, giới hạn đọc/xuất. |
| Giao diện hồi quy | 29 | Theme, font offline, thư mục con, bản sửa, chỉnh khối, công thức, Mermaid, lọc nội dung nguy hiểm. |
| Giao diện 1.1.2 | 58 | Thanh trên ở 6 kích thước, cài đặt ở màn hình dọc/ngang, font theo theme, nút cảm ứng, đổi đuôi, nhập CSS, tìm/thay thế, thời gian chờ regex. |
| Luồng native mô phỏng | 27 | Giao thức MessagePort, rename theo ID, giữ bản sửa, đổi đuôi tùy ý, CSS độc lập/hủy/lỗi, xuất dữ liệu. |
| APK và quyền | 25 | Manifest biên dịch, version 112, gói native, tài nguyên mới nhất, CSP, font offline, không có khóa riêng. |
| Khóa ký nâng cấp | 2 | Khớp khóa trong bản sao lưu đã gửi và chứng thư của APK 1.1.1. |
| **Tổng các nhóm trên** | **286** | Các nhóm Android mô phỏng và trình duyệt không thay thế kiểm thử trên thiết bị thật. |

Các tệp kết quả chi tiết nằm trong `test-results/` của gói bàn giao.

## Những điều đã kiểm tra ở tính năng mới

- Menu ⋯, chế độ tập trung và dấu đóng cạnh thương hiệu không còn trong DOM.
- Thanh tiêu đề vừa các màn hình 320×640, 360×800, 390×844, 412×915, 844×390, 1280×800.
- Bộ chọn font tùy biến theo theme, không gọi hộp chọn mặc định của Android; chọn được bằng cảm ứng, phím mũi tên, Home/End và Enter.
- Tắt WebView tap highlight; nút tìm, chuyển tệp và cài đặt trở lại màu nền mặc định sau khi chạm. Giữ viền lấy nét bàn phím.
- Đổi tên gồm phần mở rộng, giữ bản sửa Unicode sau khi chuyển bài; xuất theo tên đầy đủ mới. Luồng Android mô phỏng chỉ gửi opaque ID và basename hợp lệ.
- Tìm tiếng Việt có/không phân biệt hoa thường; thay một, thay tất cả, xóa chuỗi, ký hiệu `$` ở chế độ thường, nhóm bắt ở chế độ regex, regex sai, kết quả rỗng và chuỗi Unicode có emoji.
- Regex bệnh lý bị dừng; giao diện vẫn nhận thao tác trong khi worker đang chạy và tìm được tiếp sau lỗi.
- Thay thế không sửa tài liệu khác; bản sửa được giữ khi chuyển bài rồi quay lại.
- Nhập tệp CSS ngoài cây tài liệu trên luồng trình duyệt và mô phỏng native, áp dụng được, từ chối CSS chứa URL; hủy/lỗi không làm mất CSS đang nhập hoặc bộ tài liệu.
- APK dùng cùng package, versionCode tăng; chữ ký v2/v3 hợp lệ, không có quyền Internet/toàn bộ bộ nhớ, không chứa khóa ký.

## Android giả lập

- Android API 35 giả lập, chạy bằng mô phỏng CPU vì môi trường không có KVM.
- **Cài đặt baseline 1.1.1, cài đè 1.1.2 và cài APK kiểm thử: thành công.**
- Có 5 kiểm tra khởi tạo đạt: manifest không có quyền, APK không bật debug, tắt backup, tạo được WebView, tắt truy cập file/content và mạng trực tiếp trong WebView.
- **Luồng Android chưa hoàn tất.** Dừng ở lần gọi JavaScript đầu tiên: `JavaScript callback timed out` sau thời gian chờ 120 giây. Không có kết quả xác nhận các thao tác tìm/thay thế, CSS hoặc đổi tên trên WebView Android trong lượt này.
- Log giả lập cũng có ANR ở dịch vụ hệ thống điện thoại và crash dịch vụ Bluetooth; chưa đủ bằng chứng để quy lỗi chờ phản hồi cho mã ứng dụng hay riêng hiệu năng giả lập. Không đánh dấu kiểm thử toàn luồng Android là đạt.
- File `ANDROID_INTEGRATION_RESULTS.txt` giữ kết quả thật. Các mục ghi “native mô phỏng” ở trên là Chromium + MessagePort giả lập, không phải kiểm thử provider Android thật.

## Giới hạn cần hiểu đúng

Chưa có kiểm thử trên điện thoại thật của bạn hoặc mọi phiên bản Android/provider lưu trữ. Đổi tên tệp thật vẫn phụ thuộc quyền ghi và hỗ trợ từ nơi lưu. Đổi phần mở rộng không chuyển định dạng nội dung; khi quét mới, app tự nhận tài liệu `.md`, `.markdown`, `.txt`. Phần mở rộng khác được giữ trong phiên đang mở.

Tìm/thay thế tác động mã nguồn Markdown của bài hiện tại, chưa ghi tệp gốc; cần xuất bản sửa bằng nút lưu. Không có tuyên bố ứng dụng không thể gặp lỗi trong mọi tình huống.
