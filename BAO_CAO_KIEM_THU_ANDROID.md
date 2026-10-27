# Báo cáo kiểm thử MarkRead Android 1.1.3

Ngày kiểm tra: 27/10/2026. Bản bổ sung giao diện đọc và chỉnh sửa, giữ package `vn.markread.local`, versionCode 113 và versionName 1.1.3.

## Phạm vi cập nhật

- Bỏ khung viền quanh nhãn định dạng tệp, gồm MD.
- Bỏ vòng viền xanh bao ngoài ô đổi tên khi nhập; giữ viền thông thường.
- Chuyển trực tiếp giữa các đoạn sửa trong chế độ hợp nhất, giữ vị trí vừa chạm và cùng ô nhập đang lấy nét, không tải lại iframe. Cập nhật nguồn và phần hiển thị trong trang hiện tại.
- Thanh tiêu đề ẩn dần theo thao tác cuộn xuống và hiện dần khi cuộn lên. Định vị bằng chương trình không tự ẩn thanh; giảm chuyển động giữ thanh ổn định.

Không thay đổi các tính năng khác. Tài liệu và metadata phát hành được đồng bộ với APK dựng lại.

## Kết quả của lượt cập nhật này

Tổng cộng **266 kiểm tra đạt**, gồm:

- **76 JavaScript unit:** parser, CSS, đường dẫn, MessagePort, cây tệp, bản sửa, tên tệp, tìm/thay thế và regex.
- **53 Browser UI:** theme, font, cây tệp, chỉnh khối, hủy/kết thúc sửa, nguồn ngoài khối, xuất, công thức, Mermaid và lọc HTML.
- **62 Revision UI:** menu Đọc/Nguồn, bàn phím/cảm ứng, thanh điều hướng ở sáu kích thước, cài đặt, tìm/thay thế, regex timeout, đổi tên và nhập CSS.
- **23 Reading UI:** nhãn định dạng không viền, ô đổi tên không có viền focus ngoài, chuyển đoạn bằng một lần chạm, cùng textarea giữ focus, vị trí vừa chạm ổn định, iframe không tải lại, offset sau khi thay độ dài hoặc tách đoạn, hủy riêng khối hiện tại, thay đổi chiều cao viewport mô phỏng bàn phím, thanh tiêu đề ẩn/hiện từng phần, giảm chuyển động, xuất và giữ công thức/sơ đồ/liên kết tham chiếu sau sửa.
- **27 native mô phỏng:** Chromium với MessagePort host mô phỏng; đọc theo ID có giới hạn, đổi tên, giữ bản sửa, chỉnh hợp nhất, xuất Unicode, nhập CSS/hủy/lỗi và thu hồi bộ tệp.
- **25 kiểm tra APK:** manifest biên dịch, package/version, SDK, DEX, ZIP CRC, renderer mới nhất, CSP khớp script, font ngoại tuyến, chính sách WebView, không có khóa riêng trong gói và không khai báo quyền.

Các bộ UI không báo lỗi JavaScript; hai bộ Browser UI và Revision UI cũng xác nhận không có yêu cầu mạng ngoài. Các kết quả trên đã chạy trong lượt sửa mã trước khi cập nhật tài liệu; lần cập nhật tài liệu này không chạy lại các bộ UI hoặc dựng lại APK.

69 Java Policy đã đạt trong lượt 1.1.3 ban đầu nhưng **không chạy lại** trong lượt bổ sung này, vì vậy không cộng vào tổng 266. Báo cáo ban đầu với tổng 312 kiểm tra được lưu riêng trong `test-results/history/BAO_CAO_KIEM_THU_ANDROID_1.1.3_initial.md`.

## APK được bàn giao

- File: `dist/MarkRead-Android-1.1.3.apk`, **7.131.992 byte**.
- SHA-256: `eb69d300d2d6bf343cfde43802996982f94c9df5d4a809c27c5d4aa380023eaf`.
- APK v2/v3 được apksigner xác minh; zipalign đã kiểm tra thành công trong lượt build.
- Renderer trong APK trùng từng byte với `app/src/main/assets/index.html` và `web/dist/MarkRead.html`.
- Build trên Windows bằng Java 17, Eclipse ECJ và Android SDK API 35; giữ nguyên phiên bản 1.1.3/113.
- Metadata hiện tại: `test-results/1.1.3/ARTIFACT.json`, `BUILD_RESULTS.txt`, `APK_VALIDATION_RESULTS.txt` và `dist/SHA256SUMS.txt`.

## Chữ ký và cài đè

Lượt cập nhật này dùng lại khóa ký cục bộ đã có trong `private/`, không tạo khóa mới. Chứng thư SHA-256 là `52a8a4d97bf264d0d43914f71408f6ccdaf6622951c55246157239aae13c2b54`, giống lượt build 1.1.3 ban đầu.

Chứng thư này khác chứng thư cũ trong `APK_SIGNATURE.txt` ở gốc dự án. File công khai cũ được giữ nguyên; đối chiếu nằm trong `test-results/1.1.3/SIGNING_STATUS.txt`. APK không cài đè được bản đang dùng chứng thư cũ khác đó. Chưa thực hiện thử cài đè trên Android trong lượt này.

## Phạm vi và giới hạn

Chưa chạy Android giả lập, chưa cài APK lên điện thoại thật và chưa kiểm tra Android Storage Access Framework thực tế trong lượt cập nhật này. Thay đổi chiều cao viewport trong Chromium chỉ mô phỏng phần bố cục khi bàn phím xuất hiện; không xác nhận hành vi bàn phím Android thật. Kiểm tra native mô phỏng không thay thế kiểm thử WebView/provider Android.

## Bằng chứng và lịch sử

`test-results/1.1.3/READING_UPDATE_RESULTS.md` tổng hợp kết quả của lượt bổ sung. Các log unit, Browser UI, Revision UI và native mô phỏng từ lượt ban đầu được giữ nguyên; bản tóm tắt mới ghi kết quả chạy lại và 23 kiểm tra Reading UI mới. Metadata và thông tin ký ban đầu được giữ trong `test-results/1.1.3/history/`.

Báo cáo 1.1.2 nằm trong `test-results/history/`. Các log ở gốc `test-results/` thuộc các lượt cũ, không phải kết quả của APK hiện tại.
