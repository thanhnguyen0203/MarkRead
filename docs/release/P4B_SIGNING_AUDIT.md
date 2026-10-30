> **Cập nhật phạm vi P4C —29/10/2026:** người dùng xác nhận KHÔNG phát hành Google Play; phân phối APK trực tiếp bằng release key local. Các điều kiện Console/upload key/target36 bên dưới là đánh giá lịch sử cho phạm vi Play, không chặn APK trực tiếp. P4C đã đối chiếu artifact GitHub thật, áp dụng1.2.0/code120 và kiểm nâng cấp release; xem [P4C_REPORT](P4C_REPORT.md). Không sửa lại evidence P4B cũ thành kết quả thử mới.

# P4B — Signing key audit

29/10/2026. **SIGNING BLOCKED cho bản cập nhật Google Play đã được xác minh.** Khóa cục bộ hoạt động và khớp APK release cục bộ; vai trò upload/app-signing trên Play còn **NOT VERIFIED**. Người dùng xác nhận kênh **Google Play App Signing** trong lượt P4B.

## Phạm vi và chứng chỉ công khai

Chỉ kiểm kê workspace MarkRead. Không quét ổ đĩa/tài khoản hệ thống hoặc đường dẫn ngoài dự án. Các APK final release tìm thấy là ba file trong ignored `dist/`; baseline P0 giữ một bản sao 1.1.5 trùng SHA. Các APK debug/snapshot/unsigned/helper trong build không được xem là bản Google Play đã phân phối. Không có APK tải từ Play hoặc public certificate Play được nhận diện trong tập artifact kiểm tra.

Chứng chỉ **L — local release**:

`52a8a4d97bf264d0d43914f71408f6ccdaf6622951c55246157239aae13c2b54`

Chứng chỉ **D — Gradle debug P4A/P4B**:

`32564670cdd48011aa5d82a79051054ca6a143eca0e03f27079b366f948134a3`

Hai giá trị là SHA-256 của **certificate công khai**, không phải password hoặc hash private key. Fingerprint APK/keystore trích bằng apksigner/JCA, không suy từ tên file hoặc subject certificate.

## APK đã kiểm tra

- `dist/MarkRead-Android-1.1.3.apk`: package `vn.markread.local`, name1.1.3/code113, non-debuggable, chữ ký v2 hợp lệ, certL. APK SHA `eb69d300d2d6bf343cfde43802996982f94c9df5d4a809c27c5d4aa380023eaf`.
- `dist/MarkRead-Android-1.1.4.apk`: cùng package, name1.1.4/code114, non-debuggable, v2 hợp lệ, certL. APK SHA `18f36262b682ddebf2fc5b4a5ba88ed554a77d6050b7ef9d45aaafd097c76763`.
- `dist/MarkRead-Android-1.1.5.apk`: cùng package, name1.1.5/code115, non-debuggable, v2 hợp lệ, certL. APK SHA `5a0ee4e950df4ca30963b0669337b7ab731f7b65c493be35cde9f3fad6eefa90`.
- `build/ui-redesign-baseline/workspace/dist/MarkRead-Android-1.1.5.apk`: byte-identical bản dist1.1.5, certL; không phải một release khác.
- `build/ui-p4a/MarkRead-P4A-debug.apk` và canonical debug đầu P4B: name1.1.5/code115, debuggable, v2 hợp lệ, certD. SHA `4b8ede97f832e0f97d8ad91970e20eb416a9a229d5d3ec54e991f9e96dd5a314`. P4B debug build lại có cùng SHA.

Tất cả APK trên min26/target35, không có native ABI payload. CertD khác certL: debug APK không là bản cập nhật dùng cùng signer cho các APK local-release đó. Không dùng debug làm upload/release key và không đề nghị uninstall để vượt signature conflict. [Evidence từng artifact](../../test-results/ui-p4b/ARTIFACT_AUDIT.json).

## Keystore hiện có

`private/markread-release.p12` và password file đi kèm đã tồn tại trước P4B, đều Git ignored; không thay đổi nội dung, alias hoặc tạo khóa khác.

- **PASS:** JDK17 tự nhận dạng **PKCS12**, đúng một private-key entry; alias của entry khớp alias trong Gradle/Python config hiện có. Không in alias/private key/password trong report hoặc command log mới.
- **PASS:** certSHA khớp L và cả ba local-release APK; RSA3072, certificate signature SHA256withRSA.
- **PASS:** hiệu lực **27/10/2026 04:34:29 UTC →14/03/2054 04:34:29 UTC**, `checkValidity()` đạt lúc audit.
- **PASS:** mở được private-key entry, ký challenge ngẫu nhiên trong RAM rồi verify bằng public certificate. Đây là chứng minh sử dụng được khóa; không ký APK hoặc export private-key bytes.
- **NOT VERIFIED:** certL có được Play đăng ký làm upload certificate hoặc app-signing certificate không; chưa có SHA256 Play Console để đối chiếu. Alias/subject giống tên ứng dụng không chứng minh điều này.
- **NOT VERIFIED:** Windows ACL/backup ngoại tuyến của keystore, mọi blob lịch sử Git và thủ tục recovery của tài khoản Play. Không thay ACL, di chuyển hoặc sao chép keystore để thử.

[Public key audit](../../test-results/ui-p4b/KEY_AUDIT.json). Password cũ chỉ được đọc vào bộ nhớ helper; không đi qua argv, stdout, report hoặc Git. Helper audit nằm trong ignored build; không nằm trong APK.

## Google Play: điều kiện còn thiếu

Theo [Android App Signing](https://developer.android.com/studio/publish/app-signing), upload key xác thực artifact gửi lên Play; Play dùng app-signing key cho APK cài trên thiết bị. Hai certificate có thể khác nhau. Không cần lấy private app-signing key do Google quản lý về máy để chuẩn bị upload.

Đã hỏi người dùng về **App signing key certificate SHA-256**, **Upload key certificate SHA-256** và versionCode lớn nhất các track; chưa nhận các giá trị ở thời điểm chốt báo cáo. Có thể lấy thông tin công khai trong Play Console →App signing. Chưa truy cập Play Console, không kết luận vai trò của khóa từ tài liệu README cũ.

Quyết định có điều kiện:

1. Upload fingerprint bằng L, key hợp lệ → có thể kết luận **SIGNING READY cho upload**, sau khi ghi evidence Console/package tương ứng. Delivered APK phải đối chiếu app-signing certificate riêng, gồm lineage nếu có rotation.
2. Upload fingerprint khác L → **SIGNING BLOCKED** cho khóa hiện có. Tìm bản backup **khóa upload đã đăng ký** hoặc xử lý upload-key reset bằng chủ tài khoản Play trong một bước được duyệt. Không tự tạo/reset/thay khóa ở P4B.
3. L chỉ khớp app-signing fingerprint nhưng khác upload fingerprint → không tự nhận L là upload key hợp lệ; cần đúng khóa upload/đăng ký tương ứng.
4. Delivered APK dùng cert khác L nhưng upload fingerprint khớp L → không phải tự thân lỗi; đây có thể là Play App Signing bình thường. Update dùng Play-signed candidate hoặc test track phù hợp, không sideload APK ký bằng upload key lên bản Play.
5. Không có Console evidence → giữ **SIGNING BLOCKED / NOT VERIFIED**. Các local-release APK vẫn xác minh được bằng L nhưng chưa đại diện bản người dùng nhận qua Play.

## Thay đổi an toàn trong P4B

- `build_apk.py`: bỏ nhánh tự sinh keystore/password. Thiếu key/password hoặc password rỗng sẽ dừng **trước compile, tạo output hoặc ghi renderer**; không tự tạo thư mục private. Năm test mới xác minh fail-closed và không sửa byte fixture. Không chạy pipeline legacy để tạo APK release; đường dẫn output của nó vẫn là1.1.5 và phải được xét lại trước dùng cho P4.
- `.gitignore`: thêm `*.p12`, `*.pfx`, `keystore.properties`, `signing.properties`; không dùng ignore thay việc kiểm tra file đã tracked.
- README: làm rõ lịch sử khóa local và gate Play, bỏ hướng dẫn hiện hành tự sinh khóa/cứ có private là đủ phát hành.
- **Không sửa** Gradle signingConfig thực tế khi chưa xác minh Play. Nó vẫn tự chọn localRelease nếu hai file cũ tồn tại; điều này chỉ là **config present**, không phải SIGNING READY. Không chạy `assembleRelease`/`bundleRelease` để phân phối dựa trên config đó.

## Phương án cấu hình có điều kiện cho P4C — chưa áp dụng

Sau khi xác minh đúng upload certificate, thay việc tự nhận một file private bất kỳ bằng cấu hình opt-in: đọc đường dẫn store, store password, key alias và key password từ process environment `MARKREAD_RELEASE_STORE_FILE`, `MARKREAD_RELEASE_STORE_PASSWORD`, `MARKREAD_RELEASE_KEY_ALIAS`, `MARKREAD_RELEASE_KEY_PASSWORD`; hoặc local `private/signing.properties` đã ignore. Không commit giá trị thật hoặc fallback về debug key. Không thêm file local chứa secret trong P4B.

Preflight release phải bắt buộc đủ giá trị, store tồn tại/đọc được, private-key entry đúng, cert còn hiệu lực và SHA khớp upload fingerprint đã xác minh độc lập. Chỉ khi đạt mới gán release signingConfig; thiếu/sai phải dừng release task, không âm thầm tạo output unsigned hoặc khóa khác. Debug vẫn build độc lập. Khi thiếu evidence Play, phương án này **chưa được nối vào Gradle**, không có signing configuration giả hoặc fingerprint placeholder đang được dùng.

Kiểm tra lại bằng công cụ sẵn có, password nhập an toàn trên máy; không gửi qua chat:

```powershell
# JDK17 keytool; các biến path/alias là cấu hình local, không commit.
$secure = Read-Host 'Keystore password' -AsSecureString
try {
    $env:MARKREAD_AUDIT_STORE_PASSWORD = [System.Net.NetworkCredential]::new('', $secure).Password
    & $keytool -list -v -storetype PKCS12 -keystore $storeFile `
      -storepass:env MARKREAD_AUDIT_STORE_PASSWORD
    if ($LASTEXITCODE -ne 0) { throw 'Keystore audit failed.' }
} finally {
    Remove-Item Env:MARKREAD_AUDIT_STORE_PASSWORD -ErrorAction SilentlyContinue
    $secure.Dispose()
}
```

`$keytool`/`$storeFile` phải được gán từ JDK/path local đã kiểm tra; không phải một cấu hình được script tự đoán. Chỉ xem public certificate/entry type; không export key. APK cũ có thể kiểm riêng bằng `apksigner verify --verbose --print-certs <APK>` theo [tài liệu công cụ](https://developer.android.com/tools/apksigner).

Không kết luận có thể cập nhật bản Google Play đang dùng khi hai fingerprint và versionCode Console còn thiếu. [Update plan](P4B_UPDATE_TEST_PLAN.md), [kết luận chung](P4B_REPORT.md).
