# Lịch sử kiểm thử MarkRead

## Bản hiện tại: 1.1.3 — 27/10/2026

Kết quả build và kiểm chứng mới nằm trong `1.1.3/`: 76 JavaScript unit, 69 Java Policy, 53 Browser UI, 62 Revision UI, 27 native mô phỏng, 25 kiểm tra APK, tổng 312 kiểm tra đạt.

- `BUILD_RESULTS.txt`: kết quả build APK và checksum.
- `WEB_UNIT_RESULTS.txt`, `POLICY_RESULTS.txt`: kiểm thử logic.
- `BROWSER_UI_RESULTS.txt`, `REVISION_UI_RESULTS.txt`, `SIMULATED_NATIVE_UI_RESULTS.txt`: kiểm thử giao diện.
- `APK_VALIDATION_RESULTS.txt`, `APK_CHECK_RUN.txt`: kiểm tra gói và tài nguyên.
- `APK_SIGNATURE.txt`, `SIGNING_STATUS.txt`: xác minh chữ ký mới và đối chiếu chứng thư cũ; không tương thích cài đè với khóa cũ.
- `ARTIFACT.json`: tên phiên bản, đường dẫn, dung lượng, SHA-256 và chứng thư của APK.

Không có kết quả cài đặt lên Android thật hoặc Android giả lập cho 1.1.3.

## Tài liệu trước đây

Các file log ở gốc thư mục này được giữ nguyên từ các lượt phát hành trước; nhiều file ghi phiên bản 1.1.1. Chúng không phải kết quả của lượt build 1.1.3. Báo cáo 1.1.2 trước khi cập nhật nằm trong `history/`.

Xem báo cáo hiện tại tại `../BAO_CAO_KIEM_THU_ANDROID.md` và lịch sử thay đổi tại `../CHANGELOG.md`.
