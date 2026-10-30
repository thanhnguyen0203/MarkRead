# MarkRead 1.2.0 — Cài đặt và sử dụng

Android 8.0 trở lên (minSdk 26), Android System WebView 100 trở lên. Package `vn.markread.local`, versionCode 120, targetSdk 35. Phân phối APK trực tiếp qua GitHub Releases, không qua Google Play.

## Tải đúng APK

Mở [GitHub Releases](https://github.com/thanhnguyen0203/MarkRead/releases). Khi v1.2.0 được xuất bản, chọn [MarkRead v1.2.0 — Quiet Ink](https://github.com/thanhnguyen0203/MarkRead/releases/tag/v1.2.0) và tải **MarkRead-v1.2.0.apk** cùng **MarkRead-v1.2.0.sha256** trong Assets. Source code ZIP/TAR không phải file cài Android.

**Chỉ tải v1.2.0 khi bản phát hành đã được duyệt và xuất bản.** Nếu chưa thấy v1.2.0 trên trang Releases, bản đó chưa được công bố; link theo phiên bản chưa hoạt động. Draft chỉ dành cho người có quyền review. Trong workspace chuẩn bị, hai file nằm ở `dist/releases/v1.2.0/`; thư mục này không nằm trong source Git.

APK có 7.184.639 byte; SHA-256:

```text
a1ffba49a0e48008ba04e63b20baa35cfeaa2f69e8a0b8e844aa60a2743f5995
```

Trên Windows, đặt hai file tải về cùng thư mục, mở PowerShell ở đó và kiểm tra:

```powershell
$releaseHash = (Get-FileHash -LiteralPath '.\MarkRead-v1.2.0.apk' -Algorithm SHA256).Hash.ToLowerInvariant()
$checksumLine = (Get-Content -LiteralPath '.\MarkRead-v1.2.0.sha256' -Raw).Trim()
if ($checksumLine -ne ($releaseHash + '  MarkRead-v1.2.0.apk')) { throw 'Checksum không khớp; dừng cài đặt.' }
if ($releaseHash -ne 'a1ffba49a0e48008ba04e63b20baa35cfeaa2f69e8a0b8e844aa60a2743f5995') { throw 'APK khác bản đã kiểm chứng.' }
```

Checksum kiểm toàn vẹn file; đồng thời kiểm tra đúng repository/nguồn tải. Không sửa file checksum để làm một APK khác đạt kiểm tra.

## Cài đặt mới

1. Mở APK từ trình quản lý tệp trên Android.
2. Nếu Android yêu cầu, cho phép **ứng dụng đang mở APK** cài ứng dụng không rõ nguồn gốc, rồi quay lại cài đặt. Tên mục tùy thiết bị; có thể tắt lại quyền của trình cài sau đó.
3. Mở MarkRead. Không đăng nhập; chọn file/thư mục qua bộ chọn Android để bắt đầu.

Không cần bật USB debugging hay thay cài đặt bảo mật/chứng chỉ để cài APK. Nếu trình cài từ chối, kiểm checksum, Android version, nguồn bản đang cài và chữ ký trước khi tiếp tục.

## Cập nhật từ bản cũ

1. **Lưu bản sao Markdown của mọi draft cần giữ** trước khi cập nhật. Draft, caret và history Undo trong RAM không được bảo đảm qua installer/process death.
2. Kiểm checksum, mở APK mới và chọn **Cập nhật**. Không gỡ ứng dụng trước; không xóa dữ liệu.
3. Mở lại và kiểm theme, font, CSS, thư mục và file đã lưu. Có thể chọn lại đúng thư mục nếu provider đã thu hồi quyền độc lập với cập nhật.

Release này dùng certificate SHA-256 công khai:

```text
52a8a4d97bf264d0d43914f71408f6ccdaf6622951c55246157239aae13c2b54
```

Đã kiểm nâng cấp trên emulator API 35 từ APK GitHub tag `v1.1.6` (metadata Android thực là **1.1.5/code 115**) lên **1.2.0/code 120**, cùng chữ ký và UID, giữ Settings/CSS/SAF và file đã lưu. Không suy kết quả này cho mọi APK từ nguồn khác.

Bản debug có chữ ký khác. Nếu Android báo xung đột package/chữ ký, **không uninstall hoặc clear data để vượt lỗi**; kiểm nguồn APK và certificate của bản đã cài. Chứng chỉ công khai không thay được khóa riêng để ký. [Chi tiết bằng chứng nâng cấp](docs/release/P4C_UPDATE_VALIDATION.md).

## Mở file và thư mục qua SAF

1. Bấm **Danh sách tệp (☰) → Mở → Mở thư mục**, chọn thư mục tài liệu và xác nhận dùng thư mục/cấp quyền trong bộ chọn hệ thống Android.
2. Hoặc chọn **Mở tệp** để chọn tài liệu riêng. Quyền được nhớ khi provider và cờ hệ thống hỗ trợ.
3. Nếu Android không cho chọn gốc Download, tạo/chọn thư mục con như `Download/MarkReadDocs`.

Chỉ phạm vi đã chọn được đọc/lập danh sách; không quét toàn thiết bị. `.md`, `.markdown`, `.txt` xuất hiện như tài liệu; thư mục con gập/mở được. Ảnh raster và CSS trong phạm vi phục vụ nội dung, không xuất hiện như bài đọc.

Tên được sắp theo số tự nhiên (2 trước 10); nút đổi thứ tự đảo chiều. Tệp trước/sau đi theo toàn cây, kể cả nhánh gập, không bị giới hạn bởi ô lọc và không chuyển vòng ở đầu/cuối. **Gỡ tệp đã chọn (× cạnh tên thư mục)** bỏ phạm vi/quyền khỏi phiên và giữ Settings; hãy xuất draft trước.

## Đọc, chỉnh sửa và lưu

Khi tắt hợp nhất, dùng **⋮ → Đọc / Nguồn**, hoặc **Chia đôi** trên màn hình lớn. Để sửa từng đoạn ngay trong bài, bật **Cài đặt → Đọc & chỉnh sửa → Hợp nhất Đọc và Nguồn**. Chạm đoạn/tiêu đề/bảng/khối mã để sửa; chạm ngoài hoặc Ctrl/Cmd+Enter để hoàn tất khối; Esc hủy lần sửa khối đó. Liên kết nội bộ vẫn cần đích nằm trong phạm vi được cấp quyền.

Nút **Lưu bản sao Markdown** trên toolbar mở hộp lưu hệ thống. Chọn nơi/tên file và xác nhận; nếu provider hỏi thay thế tệp trùng tên, kiểm tra kỹ trước khi đồng ý. App không tự ghi đè file gốc khi gõ. Mở lại bản đã lưu để kiểm nội dung trước khi đóng phiên.

Draft từng tệp được giữ khi chuyển bài trong cùng phiên; dấu chấm cạnh tên báo sửa chưa xuất. Thanh tiến độ phản ánh vị trí trong nội dung; toolbar ẩn/hiện theo cuộn và reduced motion. Không có tự lưu draft hoặc đồng bộ đám mây.

## Tìm và thay thế

Bấm kính lúp hoặc Ctrl/Cmd+F; Ctrl/Cmd+H mở phần thay. Phạm vi là **nguồn Markdown của bài hiện tại**, gồm cú pháp, mã và URL. **Thay thế** áp dụng kết quả hiện tại, **Thay tất cả** áp dụng mọi kết quả; thay thế chưa ghi ra ổ lưu trữ cho tới khi xuất bản sửa.

**Hoa/thường** bật phân biệt chữ hoa; **Regex** dùng JavaScript Unicode/nhiều dòng. Nhập `Item-(\d+)`, không bọc `/.../g`; thay `Số $1` đổi `Item-12` thành `Số 12`. Regex hỗ trợ `$1`, `$2`, `$<ten_nhom>`, `$&`, `$$`; chế độ thường giữ nguyên ký tự `$`.

Regex quá lâu bị dừng khoảng 2,5 giây; giới hạn 20.000 kết quả, bản sửa không vượt 5 MiB. Enter/Shift+Enter trong ô tìm chuyển kết quả; Enter trong ô thay thay một, Ctrl/Cmd+Enter thay tất cả. Dùng Undo/Redo trong editor phù hợp; không cam kết history xuyên field/file/reload. Một chuỗi nhập có thể chia nhiều nhóm Undo.

## Đổi tên

Ấn giữ tên file trên toolbar hoặc trong danh sách (bàn phím: F2), nhập toàn bộ basename/phần mở rộng và bấm **Đổi tên**. Chỉ đổi tên, không chuyển đổi định dạng nội dung. Quyền ghi/provider phải hỗ trợ; nếu cần, chọn lại đúng thư mục để cập nhật quyền.

App kiểm tên sai/trùng; lỗi giữ tên hiện tại. Tệp đổi sang đuôi khác vẫn dùng trong phiên; lần quét mới chỉ nhận `.md`, `.markdown`, `.txt` như tài liệu. Liên kết dùng tên cũ không tự đổi theo.

## Theme, font và CSS riêng

**Cài đặt** tổ chức thành Màu giao diện, Font chữ & bố cục, Đọc & chỉnh sửa, CSS riêng, Chung & hướng dẫn. Có 12 theme; font hệ thống, serif, Merriweather offline và monospace; chỉnh cỡ chữ, độ rộng bài, giãn dòng. Theme áp dụng đồng bộ UI/reader/native; CSS riêng dành cho vùng đọc.

Vào **CSS riêng → Nhập tệp CSS**, hoặc nhập trực tiếp; bấm **Áp dụng CSS**. Dùng `body`, `#paper`, `h1`, `table`…; **Xóa CSS** để trở về mặc định. Tối đa 100.000 byte, UTF-8/UTF-16 có BOM; CSS có URL, `@import` hoặc cú pháp sai bị từ chối. Hủy/lỗi nhập không thay nội dung bài hay quyền thư mục. CSS của bạn hoặc màu chỉ định trong công thức có thể tự làm giảm tương phản.

## Phiên đọc và cài đặt

Theme, font, cỡ chữ, bố cục, tùy chọn chỉnh sửa, thứ tự tệp và CSS đã áp dụng tự lưu trên thiết bị. Rời app dưới 10 phút có thể khôi phục tài liệu gần nhất khi quyền còn hiệu lực. Từ đúng 10 phút: đóng tài liệu cũ, giữ thư mục/danh sách, gỡ bộ tệp mở riêng; Settings vẫn còn. Thời gian ở bộ chọn mở/lưu không tính là rời app.

Chỉ metadata/URI được giữ; nội dung draft không lưu bền vững. Hãy xuất bản sửa trước khi rời lâu, đóng app hoặc cập nhật. Không bảo đảm phục hồi draft sau khi Android kết thúc process.

## Ngoại tuyến, quyền riêng tư và giới hạn

Không quyền Internet/toàn bộ bộ nhớ, tài khoản, quảng cáo, analytics hay telemetry. Thư viện, LaTeX, Mermaid, icon/font nằm trong APK; WebView chặn kết nối mạng. Android và provider do người dùng chọn nằm ngoài chính sách dữ liệu của MarkRead; chọn thư mục cục bộ để không phụ thuộc mạng.

Tối đa 5 MiB/tài liệu, 5.000 mục/32 cấp thư mục, 10 MiB/ảnh, 8 sơ đồ/bài. Chỉ ảnh raster được cấp quyền; ảnh mạng/SVG/nhúng Markdown bị chặn. Nội dung UTF-8/UTF-16 có BOM; mã hóa khác cần chuyển đổi trước. Công thức/sơ đồ/CSS sai có thể hiện lỗi hoặc giữ nguồn.

Runtime release đã kiểm API 35; máy thật/API 26/OEM/provider cloud, chỉ đọc, thẻ nhớ hoặc thiếu dung lượng chưa nghiệm thu đầy đủ. TalkBack **NOT TESTED — accepted limitation**; ARIA/semantic/focus vẫn giữ. Một số lỗi provider có thể là tiếng Anh kỹ thuật. Không hứa mọi IME/provider hay 60 FPS. [Release notes và phạm vi đã kiểm](docs/release/RELEASE_NOTES_v1.2.0_VI.md).

MarkRead là dự án độc lập, không thuộc MarkText.
