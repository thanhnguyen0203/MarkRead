# Lịch sử kiểm thử MarkRead

## Bản hiện tại: 1.1.3 — bổ sung giao diện đọc, 27/10/2026

Lượt bổ sung đã đạt **266 kiểm tra**: 76 JavaScript unit, 53 Browser UI, 62 Revision UI, 23 Reading UI, 27 native mô phỏng và 25 kiểm tra APK. Phiên bản giữ nguyên 1.1.3/113.

- `1.1.3/READING_UPDATE_RESULTS.md`: tóm tắt kết quả đã thực thi của lượt bổ sung và phạm vi kiểm thử.
- `1.1.3/ARTIFACT.json`: dung lượng, SHA-256 và chứng thư của APK hiện tại.
- `1.1.3/BUILD_RESULTS.txt`: bản ghi artifact của lượt build bổ sung, đồng bộ với file hiện có.
- `1.1.3/APK_VALIDATION_RESULTS.txt`, `APK_CHECK_RUN.txt`: kết quả kiểm tra APK hiện tại.
- `1.1.3/APK_SIGNATURE.txt`, `SIGNING_STATUS.txt`: chữ ký cục bộ được dùng lại và đối chiếu chứng thư công khai cũ.
- `../web/tests/reading-ui.cjs`: 23 kiểm tra hồi quy dành cho bốn thay đổi mới.

Các file `WEB_UNIT_RESULTS.txt`, `BROWSER_UI_RESULTS.txt`, `REVISION_UI_RESULTS.txt`, `SIMULATED_NATIVE_UI_RESULTS.txt` trong thư mục `1.1.3/` được giữ từ lượt ban đầu. Các bộ tương ứng đã chạy lại thành công khi sửa mã; bản tóm tắt mới ghi kết quả đó. `POLICY_RESULTS.txt` là 69 kiểm tra Java Policy của lượt ban đầu, không chạy lại hoặc cộng vào tổng 266.

Không có kết quả cài đặt lên Android thật hoặc Android giả lập cho lượt bổ sung. Việc đổi chiều cao viewport trong Chromium chỉ là kiểm tra bố cục mô phỏng bàn phím.

## Lượt 1.1.3 ban đầu

Lượt ban đầu đạt 312 kiểm tra, gồm cả 69 Java Policy và chưa có 23 Reading UI. Báo cáo được lưu trong `history/BAO_CAO_KIEM_THU_ANDROID_1.1.3_initial.md`; metadata APK, build và thông tin ký ban đầu nằm trong `1.1.3/history/`. Checksum APK ban đầu không áp dụng cho APK hiện tại.

## Các phiên bản trước

Các log ở gốc thư mục này được giữ nguyên từ các lượt trước; nhiều file ghi phiên bản 1.1.1. Báo cáo 1.1.2 nằm trong `history/`.

Xem báo cáo hiện tại tại `../BAO_CAO_KIEM_THU_ANDROID.md` và lịch sử thay đổi tại `../CHANGELOG.md`.
