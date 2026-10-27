# MarkRead Android 1.1.3

Ứng dụng đọc và chỉnh sửa tài liệu Markdown ngoại tuyến. Hỗ trợ Android 8 trở lên; cần Android System WebView 100 trở lên.

## Cài đặt APK 1.1.3

1. Tải `dist/MarkRead-Android-1.1.3.apk` về điện thoại.
2. Mở APK bằng trình quản lý tệp. Nếu Android yêu cầu, cho phép ứng dụng đang mở APK cài ứng dụng.
3. Mở MarkRead và cấp lại quyền thư mục bằng bộ chọn hệ thống nếu cần.

Bản này dùng package `vn.markread.local`, versionCode 113. Checkout không có khóa ký riêng của bản cũ; APK mới dùng khóa cục bộ trong `private/`. File `APK_SIGNATURE.txt` chỉ chứa thông tin chữ ký, không thể dùng để ký APK. Nếu ứng dụng đang cài dùng khóa khác, Android sẽ từ chối cài đè. Hãy xuất mọi bản sửa cần giữ trước khi thay bản cài; gỡ ứng dụng sẽ xóa cài đặt và quyền thư mục đã nhớ. Muốn cài đè bằng chữ ký cũ cần khôi phục đúng khóa riêng rồi build lại.

## Các thay đổi trong 1.1.3

- **Sửa trực tiếp:** chế độ hợp nhất không còn khung và thanh MARKDOWN; văn bản dùng font/màu của bài và vùng sửa tự giãn.
- **Menu chế độ:** khi tắt hợp nhất, nút **⋮** ở góc trên bên phải cho phép chọn **Đọc** hoặc **Nguồn**. Nhóm chọn trong cài đặt vẫn có.
- **Preview theme:** 12 ô theme dùng đúng nền và chữ của mỗi theme; ô được chọn chỉ còn một viền và dấu chọn.
- **Nhãn định dạng:** chữ MD và các phần mở rộng tệp không còn khung viền riêng.
- **Ô đổi tên:** khi nhập tên, giữ viền thông thường và không có viền xanh bao ngoài.
- **Chuyển đoạn sửa:** chạm đoạn khác để sửa ngay tại vị trí đó, giữ trang đọc và ô nhập đang lấy nét, không tải lại bài rồi cuộn trở về.
- **Thanh tiêu đề:** ẩn dần khi cuộn xuống một đoạn và hiện dần khi cuộn lên. Nếu thiết bị bật tùy chọn giảm chuyển động, thanh được giữ ổn định.

## Mở tài liệu, thư mục con và chuyển bài

Bấm **☰ → Mở → Mở thư mục**, chọn thư mục tài liệu rồi cấp quyền trong bộ chọn Android. Nếu không chọn được gốc Download, dùng thư mục con như `Download/TaiLieu`.

App chỉ lập danh sách tệp trong phạm vi đã chọn. Hỗ trợ tài liệu `.md`, `.markdown`, `.txt`, CSS và ảnh raster; quét cả thư mục con bên trong phạm vi đó. Nhánh chứa tài liệu xuất hiện thành cây, có thể gập/mở. Ảnh/CSS không xuất hiện như bài đọc.

Nút trước/sau chuyển theo toàn bộ cây, kể cả nhánh đang gập. Tên sắp theo số tự nhiên: 2 trước 10. Nút ⇅ đảo thứ tự. Ô lọc chỉ lọc danh sách, không thu hẹp phạm vi chuyển bài. Không chuyển vòng ở đầu/cuối.

Bản sửa của từng tệp được giữ khi chuyển bài trong cùng phiên. Dấu chấm cạnh tên báo bài đang có sửa chưa xuất. Bấm × **cạnh tên thư mục** để gỡ bộ tệp và thu hồi quyền đã nhớ; dấu × này khác dấu cạnh thương hiệu đã được bỏ.

## Đọc và chỉnh sửa

Khi tắt hợp nhất, bấm **⋮** ở góc trên bên phải để chọn **Đọc** hoặc **Nguồn**. Bạn cũng có thể chọn trong **Cài đặt → Đọc & chỉnh sửa**. Chế độ **Chia đôi** có trên màn hình lớn. Trên điện thoại, đóng cài đặt sau khi chọn để xem chế độ vừa chọn.

Bật **Hợp nhất Đọc và Nguồn** để chạm vào từng đoạn, tiêu đề, bảng hoặc khối mã và sửa Markdown của khối đó. Vùng sửa xuất hiện trực tiếp trong bài, không có khung hoặc thanh công cụ riêng. Chạm vào đoạn khác để kết thúc sửa đoạn hiện tại và chuyển trực tiếp sang đoạn vừa chạm, giữ nguyên vị trí và ô nhập đang lấy nét. Chạm vùng trống ngoài đoạn hoặc bấm **Ctrl/Cmd+Enter** để trở lại bản đọc; **Esc** phục hồi riêng khối đang sửa. Các liên kết vẫn hoạt động như bình thường. Khi hợp nhất đang bật, nhóm chọn chế độ riêng và nút ⋮ được ẩn.

Khi cuộn xuống qua đoạn đầu của bài, thanh tiêu đề sẽ trượt và mờ dần để tăng vùng đọc. Cuộn lên để thanh xuất hiện trở lại và dùng các nút chuyển bài, tìm kiếm, lưu hoặc cài đặt. Việc định vị nội dung bằng chương trình không tự ẩn thanh.

Bấm biểu tượng lưu trên thanh trên để chọn nơi xuất bản sao bằng hộp lưu Android. App không tự ghi nội dung bản sửa vào tệp gốc. Chỉ đóng app sau khi đã xuất những bản sửa cần giữ.

## Tìm, thay thế và regex

1. Bấm biểu tượng kính lúp.
2. Nhập nội dung cần tìm. Số kết quả và các nút lên/xuống dùng để chọn kết quả.
3. Nhập nội dung thay thế; để trống nếu muốn xóa phần khớp.
4. Bấm **Thay thế** cho kết quả hiện tại hoặc **Thay tất cả** cho mọi kết quả trong bài đang mở.

**Hoa/thường** bật phân biệt chữ hoa và chữ thường. **Regex** bật biểu thức chính quy JavaScript với chế độ Unicode và nhiều dòng: `^`, `$` áp dụng cho từng dòng. Nhập biểu thức trực tiếp, ví dụ `Item-(\d+)`, không bọc thêm `/.../g`.

Khi bật Regex, phần thay hỗ trợ `$1`, `$2`, `$<ten_nhom>`, `$&` và `$$` theo quy tắc JavaScript. Ví dụ: tìm `Item-(\d+)`, thay `Số $1` sẽ đổi `Item-12` thành `Số 12`. Khi tắt Regex, các ký tự `$` được thay nguyên văn.

Phạm vi tìm là **mã nguồn Markdown của tài liệu hiện tại**, gồm cả ký hiệu định dạng, mã và URL trong tài liệu. Nếu kết quả không có chữ tương ứng trên bản đọc, app đánh dấu khối chứa kết quả; chuyển sang Nguồn để xem chính xác vùng đã chọn. Thay thế không chạm vào tệp khác và chưa ghi xuống ổ lưu trữ cho tới khi xuất bản sửa.

Regex xử lý quá lâu sẽ bị dừng sau khoảng 2,5 giây; tài liệu vẫn được giữ nguyên nếu chưa thay thành công. Tối đa 20.000 kết quả được liệt kê; khi vượt mức này, thu hẹp biểu thức trước khi thay tất cả. Bản sửa không được vượt 5 MiB.

Phím tắt: **Ctrl/Cmd+F** mở tìm; **Ctrl/Cmd+H** mở phần thay; Enter/Shift+Enter trong ô tìm chuyển kết quả; Enter trong ô thay thay một, Ctrl/Cmd+Enter thay tất cả.

## Đổi tên và phần mở rộng

1. Ấn giữ khoảng nửa giây vào tên trên thanh trên hoặc trong danh sách. Bàn phím có thể dùng **F2**.
2. Nhập toàn bộ tên, ví dụ `Chương 3.txt` hoặc `Chương 3.markdown`.
3. Bấm **Đổi tên**.

Ô nhập tên giữ viền thông thường khi được chọn, không có thêm vòng viền xanh bên ngoài.

Đổi phần mở rộng chỉ đổi tên, không chuyển đổi định dạng nội dung. App kiểm tra tên sai và tên trùng, kể cả thư mục và tệp khác khi dùng quyền thư mục Android. Vị trí chỉ đọc hoặc không hỗ trợ đổi tên sẽ báo lỗi, giữ tên hiện tại. Nếu quyền ghi chưa có, mở lại đúng thư mục/tệp để cấp quyền.

Các bản sửa đang có vẫn theo tệp sau khi đổi tên và chuyển bài. Tệp đổi sang phần mở rộng khác vẫn dùng được trong phiên hiện tại. Sau khi đóng app và quét lại thư mục, danh sách tài liệu tự nhận `.md`, `.markdown`, `.txt`; phần mở rộng tùy ý khác không tự xuất hiện thành tài liệu. Các liên kết dùng tên cũ không tự cập nhật.

## Nhập và áp dụng CSS

Mở **Cài đặt → CSS riêng → Nhập tệp CSS**. Chọn `.css` bằng bộ chọn hệ thống ở Bộ nhớ trong hoặc thẻ nhớ, kể cả nơi ngoài thư mục tài liệu đang mở. Tệp không cần được thêm vào bộ tài liệu. Hủy chọn hoặc lỗi đọc không thay nội dung CSS đang nhập và không làm mất tài liệu.

Sau khi nhập, bấm **Áp dụng CSS**. Dùng `body`, `#paper`, `h1`, `table`… để định dạng vùng đọc. Có thể sửa trực tiếp hoặc bấm **Xóa CSS**. Tệp tối đa 100.000 byte; hỗ trợ UTF-8 và UTF-16 có BOM. CSS có URL, `@import` hoặc lỗi cú pháp bị từ chối. Chọn một tệp CSS là thao tác nhập nội dung cục bộ; không hỗ trợ tự tải tài nguyên mạng bằng CSS.

## Theme, font và cài đặt

Có 12 theme, trong đó có Tokyo Night/Light, Nord, xanh xám, Dracula, Rose Pine và các theme sáng/tối. Mỗi ô theme thể hiện màu nền và chữ của chính theme đó.

**Font chữ & bố cục** có font hệ thống, serif, Merriweather và monospace; chỉnh cỡ chữ, độ rộng, giãn dòng. Các font Merriweather được gói sẵn, không tải từ mạng. Bảng cài đặt co theo nội dung và cuộn khi màn hình thấp.

**Nhớ cài đặt** lưu theme, font, bố cục, tùy chọn đọc, thứ tự và CSS trên thiết bị. Không lưu nội dung bài hoặc lịch sử đọc. Quyền thư mục được Android lưu riêng để mở lại nếu còn hiệu lực.

## Dữ liệu và giới hạn

Ứng dụng không khai báo quyền Internet, không tài khoản, quảng cáo hoặc thư viện thống kê. Không yêu cầu quyền toàn bộ bộ nhớ. Tệp chỉ được đọc qua bộ chọn hệ thống và quyền thư mục người dùng đã cấp. CSS nhập riêng không thay quyền thư mục đã giữ. Giao diện và bản đọc chặn kết nối mạng; thư viện, công thức, sơ đồ và phông được gói sẵn.

Giới hạn: 5 MiB mỗi tài liệu, 5.000 mục trong cây, tối đa 32 cấp thư mục, 10 MiB mỗi ảnh, 8 sơ đồ mỗi bài. Ảnh SVG/ảnh Internet bị chặn; ảnh raster phải thuộc bộ tệp được chọn. Sơ đồ, công thức hoặc CSS không hợp lệ có thể giữ mã nguồn/hiện thông báo thay vì hiển thị.

MarkRead là ứng dụng độc lập lấy cảm hứng từ MarkText, không thuộc dự án MarkText.
