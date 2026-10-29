# MarkRead v1.2.0 — Quiet Ink

MarkRead được làm mới cho việc đọc và chỉnh sửa Markdown trên Android: nhiều không gian hơn cho nội dung, màu dịu và công cụ nhất quán. Ứng dụng tiếp tục hoạt động offline, không tài khoản, quảng cáo hoặc analytics.

## Giao diện

- Giao diện Quiet Ink thống nhất màu, typography, spacing và trạng thái nhấn/chọn/focus/disabled; giữ đủ 12 theme và CSS riêng.
- Settings theo nhóm và Theme Picker có preview màu; Sidebar/File Browser theo cây rõ ràng hơn.
- Reader, Editor và Toolbar ưu tiên nội dung; Search/Replace, dialog và menu được tổ chức lại; bố cục thích ứng chiều rộng và chữ lớn.
- 23 Lucide SVG gói offline, cùng launcher **Open Book** mới: adaptive, round và monochrome cho launcher Android hỗ trợ themed icons.
- Animation/micro-interactions ngắn, hỗ trợ giảm chuyển động; không animate caret hoặc từng đoạn Markdown dài.

## Trải nghiệm và ổn định

- Cải thiện focus bàn phím, semantic HTML/ARIA và vùng chạm; giữ cơ chế truy cập file SAF.
- Sửa Undo/Redo sau Replace, gồm thay một/thay tất cả, regex và Unicode trong các luồng đã kiểm.
- Tắt tự viết hoa ngoài ý muốn của Gboard trong ô Search/Replace; giữ kiểu nhập tự nhiên của editor.
- Cải thiện tương phản LaTeX, đặc biệt màu lỗi renderer trên 9 theme tối; đã kiểm công thức inline/block và lỗi trên đủ 12 theme. Màu tác giả và custom CSS giữ quyền ưu tiên.
- Cải thiện fallback/khả năng tương thích Android WebView, native insets và reduced motion; giữ kiến trúc Java Android + WebView.
- Chuẩn hóa metadata **1.2.0 / code 120** và ký bằng khóa release tương thích các APK cũ đã xác minh; không thêm permission/network access.

## Cập nhật giữ dữ liệu

Đã cài đè APK release công khai ở tag `v1.1.6` (metadata thực **1.1.5/code 115**) lên **1.2.0/code 120** trên emulator API 35, không uninstall/clear data. Settings, theme/font, CSS riêng, quyền SAF, tệp con và byte các file đã lưu được giữ; Reader/Editor, Search/Replace, Undo/Redo, export và Android Back đạt kiểm thử.

**Lưu bản sao Markdown của mọi sửa đổi cần giữ trước khi cập nhật.** Draft, caret và history Undo trong RAM không được bảo đảm khi installer hoặc Android kết thúc process. Mở APK mới để cập nhật trực tiếp lên bản release cùng applicationId/chữ ký; không cần gỡ app. Nếu xung đột chữ ký, kiểm tra nguồn APK/certificate trước; không gỡ ứng dụng hoặc xóa dữ liệu để vượt lỗi. APK debug dùng chứng chỉ khác.

## Tải và yêu cầu hệ thống

- **Android 8.0+**, Android System WebView 100+; minSdk 26, targetSdk 35.
- Tải **MarkRead-v1.2.0.apk** và **MarkRead-v1.2.0.sha256** trong Assets của release; source ZIP/TAR không phải APK.
- Mở file/thư mục qua bộ chọn Android; chỉ phạm vi người dùng cấp quyền được truy cập. Dùng vị trí cục bộ để đọc hoàn toàn offline.
- Không yêu cầu tài khoản; thư viện, công thức, sơ đồ, font và icon nằm sẵn trong APK. [Hướng dẫn cài đặt/cập nhật và SAF](https://github.com/thanhnguyen0203/MarkRead/blob/v1.2.0/HUONG_DAN_CAI_DAT.md).

APK **7.184.639 byte**, SHA-256:

```text
a1ffba49a0e48008ba04e63b20baa35cfeaa2f69e8a0b8e844aa60a2743f5995
```

Certificate SHA-256:

```text
52a8a4d97bf264d0d43914f71408f6ccdaf6622951c55246157239aae13c2b54
```

## Kiểm chứng và giới hạn đã biết

P4C: **2.385/2.385 automated checks**, palette **2.220/2.220**, launcher **81/81** (đã nằm trong tổng automated), release APK **18/18**, **44/44 native upgrade assertions**; Gradle assembleRelease/lintVitalRelease đạt. P4D kiểm lại nguyên APK P4C, không build lại hoặc tính các kết quả cũ là lần chạy mới.

- TalkBack: **NOT TESTED — accepted limitation**. Giữ semantic HTML/ARIA/focus; không tuyên bố nghiệm thu TalkBack.
- Chưa nghiệm thu thiết bị vật lý, Android API 26/OEM và mọi nhà cung cấp SAF/IME. Gboard Telex core đã thử ở P3F-R2; P4C không lặp lại mọi phương thức nhập. Không tuyên bố tương thích mọi thiết bị hoặc 60 FPS.
- Một số lỗi SAF provider có thể chứa thông tin kỹ thuật tiếng Anh.
- Undo dựa trên history textarea của WebView; không cam kết xuyên field/file/reload hoặc cập nhật. Một chuỗi nhập có thể chia nhiều nhóm Undo.
- Draft chưa xuất nằm trong RAM; không có autosave nội dung/cloud sync. Tối đa 5 MiB mỗi tài liệu; ảnh mạng/SVG và CSS có URL/`@import` bị chặn.

Phân phối APK trực tiếp qua GitHub Releases, **không Google Play**. Bằng chứng chi tiết gắn với tag v1.2.0: [P4C build/signing](https://github.com/thanhnguyen0203/MarkRead/blob/v1.2.0/docs/release/P4C_REPORT.md), [nâng cấp](https://github.com/thanhnguyen0203/MarkRead/blob/v1.2.0/docs/release/P4C_UPDATE_VALIDATION.md), [readiness trước release](https://github.com/thanhnguyen0203/MarkRead/blob/v1.2.0/docs/ui-redesign/P3F_R2_RELEASE_READINESS.md).
