# MarkRead Android 1.1.2

Ứng dụng đọc và chỉnh sửa tài liệu Markdown ngoại tuyến. Hỗ trợ Android 8 trở lên; cần Android System WebView 100 trở lên.

## Cài bản cập nhật

1. Tải `MarkRead-Android-1.1.2.apk` về điện thoại.
2. Mở APK bằng trình quản lý tệp và chọn **Cập nhật**. Nếu Android yêu cầu, cho phép ứng dụng đang mở APK cài ứng dụng.
3. Mở MarkRead. Quyền thư mục và cài đặt đã lưu được giữ khi Android cho phép.

Bản này dùng package `vn.markread.local`, versionCode 112 và cùng khóa ký với bản 1.1.1. Không cần gỡ bản cũ. Hãy xuất bản sửa đang có trước khi cập nhật: nội dung chưa xuất chỉ nằm trong bộ nhớ của phiên đang mở.

## Tám thay đổi

| Mục | Cách hoạt động trong 1.1.2 |
| --- | --- |
| Bỏ “⋯” và tập trung | Thanh trên chỉ còn công cụ chuyển tệp, tìm/thay thế, lưu và cài đặt. Chọn chế độ Đọc/Nguồn trong **Cài đặt → Đọc & chỉnh sửa**. |
| Tùy chọn theo theme | Bộ chọn font, thanh kéo, các nút và lựa chọn chế độ dùng màu theme hiện tại. Bộ chọn font hỗ trợ cảm ứng và bàn phím. |
| Phản hồi khi chạm | Bỏ nền xanh mặc định của WebView. Có hiệu ứng nhấn nhẹ; viền lấy nét bằng bàn phím vẫn được giữ để dễ thao tác. |
| Nút Mở | Biểu tượng SVG đồng bộ, menu có Mở thư mục/Mở tệp. Bỏ dấu × cạnh thương hiệu; chạm vùng ngoài hoặc dùng Back để đóng thanh bên. |
| Đổi phần mở rộng | Ô đổi tên chứa toàn bộ tên và phần mở rộng; bỏ mô tả dưới ô. |
| Nhả màu nút | Hiệu ứng rê chuột chỉ áp dụng cho chuột, tránh nền nút bị giữ sau khi chạm trên điện thoại. |
| Tìm và thay thế | Thay một kết quả hoặc tất cả kết quả trong tài liệu hiện tại; hỗ trợ hoa/thường và regex. |
| Nhập CSS độc lập | Mở bộ chọn tệp Android để chọn `.css` ở vị trí cục bộ khác, giữ nguyên bộ tài liệu đang mở. |

## Mở tài liệu, thư mục con và chuyển bài

Bấm **☰ → Mở → Mở thư mục**, chọn thư mục tài liệu rồi cấp quyền trong bộ chọn Android. Nếu không chọn được gốc Download, dùng thư mục con như `Download/TaiLieu`.

App chỉ lập danh sách tệp trong phạm vi đã chọn. Hỗ trợ tài liệu `.md`, `.markdown`, `.txt`, CSS và ảnh raster; quét cả thư mục con bên trong phạm vi đó. Nhánh chứa tài liệu xuất hiện thành cây, có thể gập/mở. Ảnh/CSS không xuất hiện như bài đọc.

Nút trước/sau chuyển theo toàn bộ cây, kể cả nhánh đang gập. Tên sắp theo số tự nhiên: 2 trước 10. Nút ⇅ đảo thứ tự. Ô lọc chỉ lọc danh sách, không thu hẹp phạm vi chuyển bài. Không chuyển vòng ở đầu/cuối.

Bản sửa của từng tệp được giữ khi chuyển bài trong cùng phiên. Dấu chấm cạnh tên báo bài đang có sửa chưa xuất. Bấm × **cạnh tên thư mục** để gỡ bộ tệp và thu hồi quyền đã nhớ; dấu × này khác dấu cạnh thương hiệu đã được bỏ.

## Đọc và chỉnh sửa

Mở **Cài đặt → Đọc & chỉnh sửa** và chọn **Đọc** hoặc **Nguồn**. Chế độ **Chia đôi** có trên màn hình lớn. Trên điện thoại, đóng cài đặt sau khi chọn để xem chế độ vừa chọn.

Bật **Hợp nhất Đọc và Nguồn** để chạm vào từng đoạn, tiêu đề, bảng hoặc khối mã và sửa Markdown của khối đó. Bấm **Xong** hoặc chạm ngoài để trở lại bản đọc; **Hủy** phục hồi riêng khối đang sửa. Các liên kết vẫn hoạt động như bình thường. Khi hợp nhất đang bật, nhóm chọn chế độ riêng được ẩn.

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
