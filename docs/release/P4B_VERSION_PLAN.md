> **Cập nhật phạm vi P4C —29/10/2026:** người dùng xác nhận KHÔNG phát hành Google Play; phân phối APK trực tiếp bằng release key local. Các điều kiện Console/upload key/target36 bên dưới là đánh giá lịch sử cho phạm vi Play, không chặn APK trực tiếp. P4C đã đối chiếu artifact GitHub thật, áp dụng1.2.0/code120 và kiểm nâng cấp release; xem [P4C_REPORT](P4C_REPORT.md). Không sửa lại evidence P4B cũ thành kết quả thử mới.

# P4B — Version plan

29/10/2026. **Đề xuất, CHƯA PHÊ DUYỆT.** Không thay versionName/versionCode trong P4B. Kênh đã xác nhận: Google Play App Signing; metadata production thực tế trên Play chưa được cung cấp.

## Bảng so sánh

| Mốc | versionName | versionCode | Signer | Kết luận metadata |
| --- | --- | --- | --- | --- |
| Local release mới nhất trong workspace | 1.1.5 | 115 | CertL | apksigner/aapt2 đã xác minh; chưa nhận diện là artifact đang phân phối trên Play |
| Debug P4A, debug build P4B | 1.1.5 | 115 | CertD | APK test, không dùng làm release update cho certL hoặc Play |
| Bản kế tiếp đề xuất | 1.2.0 | 120 nếu chưa từng dùng và lớn hơn mọi code Play | Đúng upload key đã xác minh, Play ký bản cài | Chưa được gán vào source/build |

ApplicationId và namespace hiện tại đều **`vn.markread.local`**, giữ nguyên. Cả source Manifest và Gradle đang1.1.5/code115, minSdk26, targetSdk35, compileSdk35, Java8 source/target. Release không debuggable, không minify/resource shrink; debug mặc định khác chữ ký. Chi tiết certificateL/D trong [signing audit](P4B_SIGNING_AUDIT.md).

Các artifact dist cũ thật có113/114/115 theo đúng name1.1.3/1.1.4/1.1.5. Git commit `a41a13a` mang tên “Update v1.1.6” nhưng `app/build.gradle.kts` ở commit đó vẫn1.1.5/115; chưa tìm thấy release APK1.1.6 trong phạm vi kiểm kê. Không đổi lịch sử hoặc coi tên commit là bằng chứng đã phát hành version116. Chưa quét đường dẫn ngoài workspace.

## Lý do đề xuất1.2.0

P0→P4A mang lại hệ giao diện Quiet Ink, Settings/Library/Reader/Search redesign, responsive/motion/icons và các bản sửa Undo/LaTeX/IME đã có regression/runtime evidence. Đây là đợt nâng cấp trải nghiệm rõ rệt, giữ kiến trúc/hợp đồng dữ liệu; minor1.2.0 dễ truyền đạt hơn một patch1.1.x. Dự án trước đây tăng1.1.3→1.1.4→1.1.5; không có quy tắc bắt buộc phải dùng1.2.0. Người dùng chưa chấp thuận số này.

Đề xuất code **120** tiếp nối quy ước số nguyên113/114/115, có khoảng cách với các bản patch cục bộ. Trước P4C phải lấy **MAX_PLAY_VERSION_CODE** trên production/testing/draft/history. Quy tắc phê duyệt: code mới chưa từng dùng, lớn hơn code của mọi bản cần nâng cấp và không tái sử dụng trên Play; nếu120 không đủ, đề xuất `max(120, MAX_PLAY_VERSION_CODE + 1)` và xin duyệt giá trị cụ thể. Không thể xác nhận120 lớn hơn bản *đang phân phối trên Play* khi MAX còn **NOT VERIFIED**. [Quy tắc Android versioning](https://developer.android.com/studio/publish/versioning).

## Gate SDK riêng cho Google Play

Tại ngày29/10/2026, [chính sách chính thức](https://support.google.com/googleplay/android-developer/answer/11926878) yêu cầu app/update Android điện thoại targetAPI36 từ31/08/2026; tài liệu nêu khả năng xin gia hạn đến01/11/2026. Không có evidence tài khoản MarkRead được gia hạn/miễn trừ. Việc target35 đủ cho sự hiện diện của một app cũ không có nghĩa đủ cho **gửi bản cập nhật mới**.

**Normal Play update target gate: chưa đạt.** Không tự đổi min/target/compileSdk, AGP8.7.3, Gradle8.9 hoặc JDK17 ở P4B. Build Gate chỉ chứng minh bộ35/8.7.3/8.9 hoạt động; không chứng nhận API36. Cần một bước migration được duyệt: kiểm tra hỗ trợ toolchain cho compile/target36 và thay đổi runtime Android16, rồi chạy lại editor/IME/insets/Back/lifecycle/SAF cùng regression. Hoặc xác minh một ngoại lệ/gia hạn thực tế còn hiệu lực và đúng app qua Play Console trước submission; không coi đây là phương án lâu dài sau hạn.

## Những nơi cần đồng bộ khi P4C được duyệt

- `app/build.gradle.kts`: versionName/versionCode là metadata Gradle authoritative.
- `app/src/main/AndroidManifest.xml`: hiện có bản sao version/uses-sdk cho pipeline legacy; đồng bộ nếu tiếp tục duy trì, không để build hai đường ra hai metadata.
- `web/package.json`, lockfile version metadata nếu có, `web/src/shell.html` dòng thông tin app; build renderer, xác minh CSP và Android asset. Không thay UI ở P4B.
- `build_apk.py` output hardcode1.1.5 và `tests/validate_apk.py` expected metadata/output; không ghi đè artifact dist cũ. Ưu tiên pipeline Gradle được review cho P4.
- README/hướng dẫn/changelog/artifact manifest/tests phải thể hiện đúng **version đã duyệt**, không dùng giá trị đề xuất như thể đã phát hành. Evidence P0–P4A là lịch sử, không mass-replace version trong báo cáo cũ.

Trước thay số, chốt signer/channel/MAX code/SDK gate và kế hoạch update không mất dữ liệu. Không có APK hoặc AAB1.2.0 được tạo trong P4B.
