# MarkRead v1.2.0 — Quiet Ink

29/10/2026 · versionCode120 · `vn.markread.local` · **APK release để phân phối trực tiếp, chưa upload**.

MarkRead được làm mới để dành nhiều không gian hơn cho Markdown, với bề mặt graphite, điểm nhấn sage và cách tổ chức công cụ rõ ràng. Giữ Java Android + WebView và hoạt động local, không thêm quyền Internet, analytics hoặc telemetry.

## Những thay đổi chính

- Giao diện Quiet Ink thống nhất màu, typography, spacing và trạng thái nhấn/chọn/focus/disabled; giữ12theme và CSS riêng cho bài đọc.
- Settings/theme picker, File Browser/Sidebar, Reader/Editor/toolbar và Search/Replace/dialog/menu được sắp xếp lại, thích ứng màn hình hẹp/rộng và chữ lớn.
-23Lucide SVG offline cho điều khiển; launcher Open Book mới với foreground/background, round và monochrome theo themed icons Android.
- Chuyển động ngắn cho nút, overlay và feedback, hỗ trợ reduced motion; không animate caret hoặc từng đoạn bài dài.
- Semantic HTML/ARIA, keyboard focus và vùng chạm được cải thiện, giữ luồng chỉnh sửa và quyền SAF.
- Sửa Undo/Redo sau Replace, gồm regex/Unicode; cải thiện tương phản LaTeX mặc định/lỗi renderer trong12theme và giữ màu tác giả/custom CSS.
- Search/Replace không tự viết hoa truy vấn với Gboard; editor giữ kiểu nhập tự nhiên.
- Chuẩn hóa version1.2.0/code120 và signing release có kiểm fingerprint, không fallback sang debug hoặc tạo khóa khác.

## Cập nhật và toàn vẹn dữ liệu

Đã thử cài đè APK công khai của tag GitHubv1.1.6 (metadata thực1.1.5/code115) →1.2.0/code120 trên AVD API35. Chữ ký/UID giữ nguyên; theme/font/cỡ chữ/CSS và quyền SAF còn nguyên, mở được tệp con/bản đã lưu. Reader, Source, Search/Replace, Undo/Redo, export và Back đạt; các file fixture ngoài app không bị ghi đè. Artifact công khai và local cũ đã kiểm đều có code<120 và cùng certificate release.

Chạy đủ2383 kiểm tra kế thừa +2negative signing checks, palette2220, launcher81, APK18 và44assertion nâng cấp native; Gradle assembleRelease/lintVitalRelease đạt. Các số native được tách khỏi tổng2385 automated.

## Cài đặt

1. Xuất bản sửa Markdown cần giữ trước khi cập nhật. Draft/Undo/caret trong RAM không được bảo đảm qua installer hoặc process death.
2. Kiểm checksum trong `MarkRead-v1.2.0.sha256`, rồi cài `MarkRead-v1.2.0.apk` bằng cơ chế cập nhật lên bản cùng applicationId/chữ ký. Không uninstall/clear data để vượt xung đột.
3. Bản debug dùng certificate khác nên không cài đè bằng APK release này. Thiếu đúng signer cần xử lý nguồn bản cài/khóa tương ứng, không đổi appId hoặc xóa dữ liệu.

SHA-256 APK: `a1ffba49a0e48008ba04e63b20baa35cfeaa2f69e8a0b8e844aa60a2743f5995`.

Certificate SHA-256: `52a8a4d97bf264d0d43914f71408f6ccdaf6622951c55246157239aae13c2b54`.

## Hỗ trợ và giới hạn

- Android8.0+/min26, target/compile35, WebView100+. Runtime release-upgrade đã thử API35/WebView trong AVD QA; chưa có nghiệm thu thiết bị vật lý/API26/OEM khác.
- TalkBack: **NOT TESTED — accepted limitation**; giữ semantics/ARIA/focus hiện có.
- P4C dùng Android key input và native editor transaction cho smoke; không gọi đó là lặp kiểm Gboard Telex/VNI đầy đủ. Evidence Gboard Telex sâu thuộc P3F-R2 trước đó.
- Provider read-only/cloud/SD/low-storage, mọi biến thể IME và FPS chưa được kiểm hết. Không khẳng định60FPS; lỗi provider missing/moved đôi khi vẫn trả thông báo technical tiếng Anh.
- Undo dựa vào native textarea history; không cam kết history xuyên field/file/reload. Chuỗi Android key input có thể chia thành nhiều nhóm Undo; Replace được kiểm transaction riêng.
- Không phát hành trên Google Play trong phạm vi này. Không cần khóa upload Play hoặc nâng targetAPI chỉ vì chính sách Play. Không upload/tạo GitHub Release cho đến bước được duyệt tiếp theo.
