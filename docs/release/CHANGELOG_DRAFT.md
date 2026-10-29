> **Cập nhật phạm vi P4C —29/10/2026:** người dùng xác nhận KHÔNG phát hành Google Play; phân phối APK trực tiếp bằng release key local. Các điều kiện Console/upload key/target36 bên dưới là đánh giá lịch sử cho phạm vi Play, không chặn APK trực tiếp. P4C đã đối chiếu artifact GitHub thật, áp dụng1.2.0/code120 và kiểm nâng cấp release; xem [P4C_REPORT](P4C_REPORT.md). Không sửa lại evidence P4B cũ thành kết quả thử mới.

# MarkRead1.2.0 — Quiet Ink

**BẢN NHÁP, chưa duyệt version, chưa phát hành.** Tên release đề xuất: **MarkRead1.2.0 — Quiet Ink: đọc rõ, sửa thuận tay**. Code120 chỉ là ứng viên, còn phải vượt mọi versionCode đã dùng trên Play. [Gate P4B](P4B_REPORT.md) chưa đạt.

MarkRead được làm mới để dành nhiều không gian hơn cho nội dung Markdown, với giao diện graphite và điểm nhấn sage dịu mắt. Những khả năng đọc, sửa theo khối, sửa nguồn, LaTeX, thư mục con và lưu bản sao tiếp tục hoạt động ngoại tuyến trên thiết bị.

## Trải nghiệm được cải thiện

- **Quiet Ink nhất quán:** màu bề mặt, chữ, selected/pressed/focus/disabled thống nhất; giữ đủ12theme và CSS riêng cho bài đọc.
- **Bố cục linh hoạt:** toolbar, sidebar, vùng đọc/chỉnh sửa và Settings thích ứng màn hình hẹp/rộng, hướng xoay và chữ lớn; cải thiện spacing, typography và vùng chạm.
- **Settings rõ ràng hơn:** nhóm màu giao diện, font/bố cục, đọc/chỉnh sửa, CSS riêng và hướng dẫn; theme picker có preview và trạng thái chọn rõ.
- **File Browser/Sidebar:** danh sách thư mục/tệp dễ quét, trạng thái tài liệu hiện tại, filter/sort và empty state rõ hơn; giữ thư mục con và điều hướng tệp trước/sau.
- **Reader/Editor:** kiểu chữ và khoảng đọc được tinh chỉnh; vùng sửa nguồn/khối hài hòa hơn với bài viết, giữ cơ chế source span và xuất Markdown hiện có.
- **Search, Replace và dialog/menu:** bố cục gọn, nhãn/trạng thái lỗi rõ hơn, hỗ trợ focus và bàn phím nhất quán. Không thêm tìm kiếm trên toàn cây thư mục hoặc đồng bộ đám mây.
- **Chuyển động nhẹ:** phản hồi nút, mở/đóng sidebar/Settings/menu/dialog/toast và chuyển theme ngắn; hỗ trợ giảm chuyển động, không animate caret hoặc từng đoạn tài liệu dài.
- **Icon đồng nhất:**23Lucide SVG dùng offline cho điều khiển; launcher **Open Book** mới có adaptive foreground/background, round và monochrome theo themed icons Android.
- **Accessibility/interaction:** semantic HTML, accessible names/ARIA theo trạng thái, keyboard focus neutral rõ và vùng chạm lớn hơn. Không tuyên bố TalkBack đã được nghiệm thu.

## Sửa lỗi có bằng chứng

- Replace dùng native textarea transaction để **Undo/Redo** khôi phục đúng nội dung trước/sau thao tác, gồm nhiều block, regex captures và Unicode. Không hứa lịch sử Undo xuyên mọi field/file/reload.
- Màu lỗi LaTeX do renderer tạo đủ tương phản trên12theme, inline/block và lỗi cú pháp; giữ màu tác giả chủ động và quyền ưu tiên CSS riêng.
- Ô Search/Replace tắt auto-capitalize để Gboard giữ đúng nội dung chữ thường; editor vẫn nhập tự nhiên, không viết lại IME engine.
- Cải thiện focus, keyboard fallback/Back, responsive và trạng thái tương tác đã có regression coverage qua P2–P3. Không tuyên bố đã sửa mọi lỗi trên mọi WebView/thiết bị.

## Kiểm chứng và quyền riêng tư

P3F-R2 đã kiểm tra Android Emulator API35/WebView124: Gboard Telex/editor, Undo/Replace, SAF local provider, Back/lifecycle và LaTeX12theme. P4A đã kiểm tra launcher/adaptive/themed icon trên API35. P4B chạy lại2297regression,81icon,2220palette,18APK và thêm5test chặn builder tự sinh khóa; build debug đạt. Các số này không thay phép thử cập nhật bản Google Play thật đang chờ P4C.

Ứng dụng Java Android + WebView tiếp tục dùng asset offline, không INTERNET permission/analytics/telemetry; truy cập file qua quyền SAF người dùng đã cấp. Không bổ sung quyền hoặc thu thập dữ liệu. Mẫu khai báo trên Play Console chưa được gửi/duyệt trong lượt này.

## Hỗ trợ và giới hạn

- Cấu hình hiện tại: Android8.0+/API26 và WebView100+; runtime đã thử chủ yếu API35/WebView124. API26, máy thật và OEM khác còn cần coverage.
- Google Play submission có gate riêng: target hiện35, normal update đang yêu cầu36; chưa tuyên bố bản nháp này đã đủ điều kiện Play. MinSdk hay toolchain chưa đổi trong P4B.
- TalkBack: **NOT TESTED — accepted limitation**. Giữ semantics/ARIA/focus hiện có.
- VNI, mọi biến thể IME, provider read-only/cloud/SD/low-storage và FPS chưa được nghiệm thu đầy đủ. Không khẳng định60FPS.
- Native Undo dùng API deprecated; lịch sử giữa nhiều field và sau reload/file switch có giới hạn. Lỗi provider mất/move file đôi khi hiện thông báo tiếng Anh technical; dữ liệu được giữ trong các ca đã thử.
- Draft chưa xuất nằm trong RAM; mất process, update app hoặc hết phiên có thể mất draft. Lưu bản sao trước cập nhật; không có autosave/cloud sync mới.

## Cài đặt/cập nhật — chỉ dùng sau khi gate được duyệt

Người dùng Google Play cập nhật qua đúng app/test track được duyệt để giữ định danh và dữ liệu. Không dùng APK debug thay bản Play, không uninstall/clear data để vượt lỗi chữ ký. Giữ/kiểm tra bản xuất Markdown cần thiết trước update. Keystore cục bộ khớp APK local chưa chứng minh là upload key trên Play; xem [signing audit](P4B_SIGNING_AUDIT.md).

Chưa có APK/AAB release mới, số version mới hoặc GitHub Release được tạo. Nội dung cuối phải được rà lại sau P4C, gồm SDK thực, code đã phê duyệt và kết quả update trên artifact đúng signer.
