> **Cập nhật phạm vi P4C —29/10/2026:** người dùng xác nhận KHÔNG phát hành Google Play; phân phối APK trực tiếp bằng release key local. Các điều kiện Console/upload key/target36 bên dưới là đánh giá lịch sử cho phạm vi Play, không chặn APK trực tiếp. P4C đã đối chiếu artifact GitHub thật, áp dụng1.2.0/code120 và kiểm nâng cấp release; xem [P4C_REPORT](P4C_REPORT.md). Không sửa lại evidence P4B cũ thành kết quả thử mới.

# P4B — Update compatibility test plan

29/10/2026 · **PLAN ONLY — chưa thực hiện nâng cấp release.** Người dùng xác nhận Google Play App Signing. P4B không cài APK, uninstall, clear data, cập nhật thiết bị thật hoặc tạo release/test-track mới.

## Gate trước khi chạy

- **PASS cục bộ:** package/namespace `vn.markread.local`; local releases113/114/115 và debug115 đã xác minh metadata. Local release certL khớp keystore; certD debug khácL. Điều này không đủ xác minh bản Play.
- **NOT VERIFIED:** app-signing và upload fingerprints từ Console; lineage/key upgrade nếu có; versionCode lớn nhất đã dùng; APK baseline thực từ Play; quyền dùng internal/closed track và gia hạn policy.
- **CHƯA ĐẠT cho normal Play submission:** target35 trong khi chính sách điện thoại hiện yêu cầu36. Không tự migration toolchain/SDK ở P4B; xem [version plan](P4B_VERSION_PLAN.md).
- **CHƯA PHÊ DUYỆT:** version1.2.0/code120; code phải lớn hơn baseline thật và mọi code cần vượt qua, chưa từng dùng trên Play.
- **PASS về cấu trúc artifact hiện có:** min26, không native `.so`/ABI-specific payload. DEX/resources không giới hạn ABI riêng, nhưng Android/WebView/OEM coverage vẫn cần thử; không gọi đây là chứng nhận mọi thiết bị.

Chỉ chạy khi baseline và candidate cùng appId, certificate phù hợp Android update model (hoặc rotation lineage hợp lệ), code tăng, SDK/ABI hỗ trợ thiết bị, SDK policy gate đã được giải quyết và người dùng duyệt P4C. Thiếu một yếu tố → ghi **NOT VERIFIED/BLOCKED**, không cài thử để dò trên thiết bị đang dùng.

## Hai đường kiểm thử, không trộn chứng cứ

**Luồng chính Google Play:** dùng AVD QA riêng có Play Store nếu môi trường/tài khoản cho phép; cài bản production hiện hành từ Play rồi nhận candidate qua internal/closed testing track được chủ tài khoản duyệt. Có thể dùng APK set do Play tạo, đã xác minh app-signing cert đúng, với đủ splits/ABI nếu đây là phương thức phân phối test được hỗ trợ. Upload AAB/APK ký bằng upload key **không** mặc nhiên là APK cài đè bản Play. Không dùng Internal App Sharing với cert riêng để chứng minh production-signature compatibility.

**Luồng phụ local/sideload:** có thể thử một APK dist đã xác minh certL → candidate ký cùngL khi code đã được duyệt tăng. Luồng này chỉ chứng minh update cho bản local đó, không đại diện update Google Play nếu cert khác. Không tạo candidate local ở P4B và không đổi applicationId để né xung đột.

Không dùng APK debug P4A làm bản thay thế cho Play/local-release baseline. Không ký QA instrumentation bằng debug key rồi cho rằng có thể instrument release khác cert; black-box UI/Android shell trên AVD QA đủ cho các bước bên dưới, không cần bật production WebView debugging hoặc sửa bridge.

## Chuẩn bị môi trường và fixture

1. Tạo/chọn đúng AVD QA, ghi tên/serial/API/WebView/launcher; kiểm tra app đang chạy và dirty trước mọi thay đổi. Không dùng5554 hoặc điện thoại người dùng. P4B không khởi động AVD.
2. Lưu hash/certificate/metadata của baseline và candidate, chứng minh nguồn Play/cert tương ứng; giữ APKs riêng, không ghi đè `dist/` cũ. APK split cần lưu đủ bộ và thứ tự/phương thức cài được xác minh.
3. Dùng thư mục UUID test riêng với Markdown tiếng Việt/emoji/inline+block LaTeX, thư mục con, file search/replace và CSS local có nội dung biết trước. Không sử dụng tài liệu cá nhân. Lưu SHA256 các file fixture ngoài app.
4. Không có baseline trong AVD mới thì chỉ cài vào AVD mới trống, sau khi xác định certificate/nguồn. Không uninstall app có sẵn hoặc clear data để chuẩn bị ca. Không khôi phục data giả bằng root/run-as để thay việc test retention thực.

## Trạng thái baseline phải ghi trước update

- Mở tree bằng SAF thật, vào file con; ghi root label, tập file/path, khả năng đọc và grant read/write thực nhận. Không nâng quyền ngoài picker.
- Chọn một theme không default, reader font/cỡ/leading/width, edit options và sort order; ghi các giá trị UI. Các ca12theme/custom CSS đầy đủ vẫn chạy trong regression riêng.
- Apply CSS test đã biết; thoát/mở Settings và đọc để xác nhận CSS đã lưu, không chỉ còn trong textarea chưa Apply. Ghi hash source CSS fixture, màu/font/selector quan sát được.
- Đọc/sửa Markdown tiếng Việt, Search/Replace, Undo/Redo, xuất bản sao và kiểm hash; đảm bảo original ngoài app không thay đổi. Hoàn nguyên hoặc xuất mọi draft cần giữ.
- Ghi tài liệu đang chọn, vị trí đọc/caret và thời điểm app rời foreground. Chỉ nhận đúng mức khôi phục phiên mà code hiện có cam kết.

## Thực hiện update — sau khi có duyệt

1. **Bắt buộc xử lý dirty trước:** draft là RAM, không autosave. Xuất bản sửa và xác minh nội dung trước update/installer có thể kết thúc process. Không kỳ vọng update giữ buffer Undo/caret/draft chưa xuất, không thử cập nhật lên phiên có nội dung chưa được bảo toàn. Đây là hợp đồng hiện có, không sửa kiến trúc persistence ở P4B.
2. Ưu tiên update qua Play test track cùng package đã đăng ký. Với luồng local phụ chỉ dùng cài đè `adb -s <QA_SERIAL> install -r <VERIFIED_CANDIDATE.apk>` sau preflight. Không `-d`, không bỏ verification, không uninstall/clear data khi bị từ chối.
3. Ghi exit code/kết quả Play, version thực sau cài, certificate APK delivered phù hợp cert/lineage đã xác minh. Nếu signature/version/policy không đúng, dừng ca và giữ baseline/data để điều tra.
4. Không lấy thông báo “Success” của installer làm chứng cứ tất cả dữ liệu còn nguyên; chạy các bước retention dưới đây.

## Kiểm tra sau update

- **App data/settings:** theme/font/cỡ/leading/width/options/sort giữ đúng giá trị đã ghi. Không tự gọi reset/migrate từ external fixture để làm PASS. Kiểm tra cold start và background/resume.
- **Custom CSS:** nội dung đã Apply còn nguyên và precedence giữ; source ngoài app không đổi. Có thể đổi/reset CSS qua UI test rồi phục hồi đúng fixture, không làm mất quyền tree.
- **SAF:** tree được phục hồi và đọc file con không cần cấp lại nếu grant hợp lệ còn tồn tại; thử rename Unicode, mở lại, export/save bản sao và hash. Không cam kết mọi provider giữ URI như local provider. Nếu bị revoke/move, phải báo lỗi và không thay working content/filename ngoài ý muốn.
- **Data integrity:** hash original Markdown/CSS và nội dung bản sao khớp expected; không có file bị ghi đè do UI Save vốn là “lưu bản sao”. Dirty/Undo sau Replace phải đúng trên nội dung đang thử.
- **Editor/IME:** Telex có dấu, sửa dấu/từ giữa câu, caret/selection, Backspace/Delete, clipboard, multiline, Search→Source, Undo/Redo sau Replace, mở/đóng IME. VNI chỉ nếu keyboard hỗ trợ; không gán lỗi app do không có layout VNI.
- **Reader/visual:**12theme và LaTeX contrast/default generated errors; màu tác giả/custom CSS vẫn được giữ. Toolbar/Settings/sidebar/search/dialog và Open Book/themed launcher hoạt động.
- **Back/lifecycle:** đóng overlay/IME, mode transition và dirty-exit warning; Home/resume giữ draft trong process theo hợp đồng. Session dưới10phút và expiry10phút theo policy; không giả đồng hồ hệ thống để tuyên bố đã đo boundary native.
- **Compatibility:** ưu tiên API35 đã có baseline, thêm API36 sau migration và min26/WebView100 khi có môi trường. Ghi riêng physical/OEM/read-only/cloud/SD/low-storage chưa thử.
- **Accessibility:** giữ semantics/ARIA/focus; TalkBack **NOT TESTED — accepted limitation**, không biến thành PASS hoặc blocker riêng.

## Evidence và quyết định

Mỗi ca lưu baseline/candidate SHA, delivered certificate, version trước/sau, exact AVD, thời điểm, expected/actual, screenshot/UI tree hoặc hash fixture, PASS/FAIL/NOT VERIFIED. Chỉ dữ liệu test; không lưu clipboard/tài liệu cá nhân hoặc keystore.

Acceptance nâng cấp: compatible appId/signing/code/SDK; không mất/sai persistent settings/CSS/SAF hoặc Markdown đã xuất; original không bị ghi đè; editor/Replace/Undo và Back cốt lõi đạt trên candidate thật. Một regression dữ liệu/signature phải dừng phát hành. Khi lỗi, giữ thiết bị/test data, xuất phần còn truy cập được, không downgrade cưỡng ép hoặc clear data để “sửa”. Rollback triển khai cần candidate tương thích có code cao hơn/Play rollback được hỗ trợ, không giả rằng APK code thấp luôn cài đè được.

**Kết quả P4B:** kế hoạch đã sẵn, **release-upgrade runtime NOT VERIFIED**; P4A chỉ chứng minh update debug→debug và R2 chỉ là regression/runtime của build debug, không thay phép thử release→Play update này.
