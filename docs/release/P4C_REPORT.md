# P4C — Signed APK Release & Upgrade Validation

29/10/2026 · **READY FOR P4D** trong phạm vi **APK release phân phối trực tiếp**. Ký, build và nâng cấp release trên AVD QA đều đạt. **Chưa upload hoặc tạo GitHub Release; không triển khai P4D.**

## Phạm vi và phiên bản

Người dùng xác nhận lại **KHÔNG Google Play**. Đã bổ sung banner lên năm tài liệu P4B để phân biệt: những blocker Console/upload key/target36 trước đó chỉ áp dụng giả định Play lịch sử, không chặn APK local. Không xóa hoặc biến evidence cũ thành kết quả mới. Giữ target/compile35 phù hợp pipeline/API35 đang kiểm, min26; không tự nâng AGP/Gradle/JDK.

Đã đọc P4A/P4B/readiness và cấu hình thực; Git có thay đổi P3/P4A/P4B chưa commit. Snapshot176inputs ở ignored `build/ui-p4c/before`, loại private credentials; không reset/stage/commit hoặc đụng dữ liệu người dùng.

**Chính thức cho artifact này:** versionName **1.2.0**, versionCode **120**, applicationId/namespace **`vn.markread.local`**. Đồng bộ Gradle, Manifest, package/lock metadata, About/Help trong renderer, validator/naming và tài liệu hiện hành. Không mass-replace version trong báo cáo lịch sử.

Qua connector GitHub read-only và HTTPS download, đã kiểm cả2release hiện có: [v1.1.5](https://github.com/thanhnguyen0203/MarkRead/releases/tag/v1.1.5) và [v1.1.6](https://github.com/thanhnguyen0203/MarkRead/releases/tag/v1.1.6). Digest APK khớp metadata GitHub; **cả hai APK có compiled code115/name1.1.5**, tagv1.1.6 không phải code116. Cùng các APK local113/114/115, max code được tìm thấy ở nguồn phân phối chính thức là115;120 cao hơn. Không tuyên bố đã kiểm một bản gửi riêng ngoài các nguồn người dùng/project có bằng chứng.

[GitHub evidence](../../test-results/ui-p4c/GITHUB_RELEASES.json), [APK cũ](../../test-results/ui-p4c/OLD_ARTIFACTS.json).

## Artifact cuối

- [MarkRead-v1.2.0.apk](../../dist/releases/v1.2.0/MarkRead-v1.2.0.apk)
- [MarkRead-v1.2.0.sha256](../../dist/releases/v1.2.0/MarkRead-v1.2.0.sha256)
- [RELEASE_METADATA.json](../../dist/releases/v1.2.0/RELEASE_METADATA.json)
- [CHANGELOG.md](../../dist/releases/v1.2.0/CHANGELOG.md), nguồn [release notes](RELEASE_NOTES_1.2.0.md)

APK **7184639bytes**. SHA256:

`a1ffba49a0e48008ba04e63b20baa35cfeaa2f69e8a0b8e844aa60a2743f5995`

Canonical Gradle candidate ở `app/build/outputs/apk/release/app-release.apk`; bản phân phối là copy exact, tạo sau khi mọi gate đạt, không ghi đè APK dist cũ. Metadata của APK thực cài trên AVD có cùng SHA. [Artifact evidence](../../test-results/ui-p4c/ARTIFACTS.json).

## Signing và cấu hình an toàn

Certificate SHA256 mới/cũ:

`52a8a4d97bf264d0d43914f71408f6ccdaf6622951c55246157239aae13c2b54`

**SIGNING READY cho APK trực tiếp đã kiểm:** PKCS12/RSA3072 hiện có, đúng private-key entry, chứng chỉ còn hiệu lực, challenge ký/verify đạt và khớp APK local lẫn2asset GitHub. Không tạo khóa khác, không dùng debug certificate. Fingerprint trên là chứng chỉ công khai, không phải private key/password.

- `app/build.gradle.kts` đọc credential từ environment hoặc local ignored `private/signing.properties`; file local chỉ chứa alias và repository-relative paths tới store/password file cũ, không chép password vào source.
- JCA kiểm private-key entry, thời hạn certificate và SHA pin công khai trong `gradle/release-certificate.sha256` trước gán signingConfig. `preReleaseBuild` phụ thuộc `verifyReleaseSigning`: thiếu/sai material sẽ **SIGNING BLOCKED**, không tạo khóa hoặc unsigned fallback.
-2negative tests missing-store/wrong-alias đều từ chối đúng và không đổi APK đã build. Password không qua command-line/log; không có key material trong Git-visible files/APK/release folder theo scan đã thực hiện.
- Gradle8.9, AGP8.7.3, JDK17, Java8 source/target; minify=false, shrinkResources=false, release debuggable=false. Không dependency/framework/analytics/network API mới.

## Build và các lỗi môi trường/lint đã giải quyết

Lệnh cuối:

```powershell
.\scripts\Build-AndroidRelease.ps1 -Offline -RerunTasks
```

**BUILD SUCCESSFUL in35s**,44tasks executed; có `verifyReleaseSigning`, `lintVitalRelease`, `assembleRelease`. Wrapper release mới dùng cùng cơ chế chọn JDK/SDK/cache/process env và Wrapper Gradle như script debug, không đổi compiler/build pipeline sang công cụ khác.

Lần offline đầu thiếu lint-gradle31.7.3 trong cache. Cho Gradle tải đúng thành phần **build tool** của AGP đã pin qua repository có sẵn, không thêm dependency app hay nâng version. Sau đó lintVitalRelease phát hiện HardcodedDebugMode trong Manifest cũ. Đã bỏ `android:debuggable="false"` ở source Manifest, để build variant quản lý và giữ release.isDebuggable=false; compiled APK kiểm thực non-debuggable. Không tắt lint, tạo lint baseline để giấu lỗi, disable SSL hoặc bỏ task. Build cuối hoàn toàn offline đạt.

Sandbox từng gặp network10013 và account1909; lệnh cần thiết chạy ngoài sandbox qua quyền môi trường. Helper từng gặp encoding/selector/async observation issues; được sửa riêng trong QA, không sửa editor/bridge để làm test qua. Giữ raw logs; không nhận các attempt đó là build/runtime PASS cuối.

## Kiểm thử và bảo toàn dữ liệu

- **2383/2383 kế thừa PASS:** Node132 + browser1969 + JVM171 + baseline APK25 + launcher81 + legacy signing guard5. Đủ12theme/custom CSS,23Lucide, renderer/editor/search/Replace/Undo, responsive/motion/accessibility/focus và native policies. Không bỏ test.
- **2/2 Gradle signing negative tests mới PASS** → tổng **2385/2385**,0fail. Không cộng palette/APK/runtime trùng vào tổng này.
- **Palette2220/2220**, **release APK18/18**;25security checks kế thừa chạy thêm trên APK signed cuối cũng đạt. Những assertion expected version được đổi có chủ đích115/1.1.5→120/1.2.0; source debug check chấp nhận absence/false theo variant, compiled APK vẫn bắt buộc non-debuggable. Không giảm số lượng.
- **Packaging PASS:** apksigner signature/certificate/v2, zipalign/CRC, metadata/SDK/MainActivity, zero permissions/INTERNET, backup/cleartext disabled, renderer CSP/iframe/offline font/notices exact. Không QA helper, key/password hoặc dữ liệu fixture trong APK. AAPT release optimize rút ngắn filenames nên kiểm launcher qua resource graph: foreground/background/monochrome, normal/round adaptive và10PNG fallback tồn tại, path/sizes đúng; không tự coi filename ngắn là resource bị mất. R8/resource shrinking vẫn tắt.
- **Native upgrade44/44 PASS:** AVD mới5558, release thực115→120 bằng install-r, UID10209 giữ nguyên. Theme/font/size/leading/width/CSS native JSON và persisted SAF URI/read/write exact; file chính/con/bản lưu mở lại đúng, original/bản lưu trước không đổi hash. Search/Replace Undo/Redo, Android input/native transaction, export mới, Back và cold relaunch đạt. [Chi tiết](P4C_UPDATE_VALIDATION.md).
- **NOT TESTED:** máy thật/API26/OEM/provider read-only/cloud/SD/low-storage, mọi IME và FPS; P4C không lặp Gboard Telex/VNI sâu. Evidence R2 vẫn là lịch sử, không gán là thử mới trên release1.2.0. TalkBack **NOT TESTED — accepted limitation**, giữ semantic/ARIA/focus, không là blocker riêng.

Các file gốc ngoài app chỉ là fixture UUID. Không dùng dữ liệu cá nhân, không uninstall/clear data/force downgrade, không cài lên5554 hoặc thiết bị thật. Dữ liệu cần giữ được export trước update; không hứa RAM draft/Undo/caret qua installer. Fixture cuối sạch, temp options được trả lại, AVD5558 đóng; app/data giữ lại cho review.

Evidence: [RESULTS](../../test-results/ui-p4c/RESULTS.json), [APK18](../../test-results/ui-p4c/APK_CHECK.json), [packaging](../../test-results/ui-p4c/PACKAGING.json), [signing guards](../../test-results/ui-p4c/SIGNING_GUARDS.json), [secret scan](../../test-results/ui-p4c/SECRET_SCAN.json), [raw attempts](../../test-results/ui-p4c/RAW_QA_ATTEMPTS.json), [suite/build logs](../../test-results/ui-p4c/suites/).

## File thay đổi và phạm vi

- `app/build.gradle.kts`: version/signing preflight, giữ SDK/buildType behavior đã nêu; `gradle/release-certificate.sha256` mới là public pin.
- `app/src/main/AndroidManifest.xml`: version120/1.2.0, bỏ hardcoded debug flag để variant quản lý; không tăng permission/SDK/đổi identity.
- `web/package.json`, lock metadata và `web/src/shell.html`: chỉ version; generated WebView asset/dist đồng bộ. Java, renderer/editor JS, UI CSS,23Lucide và launcher source giữ hash P4B.
- `scripts/Build-AndroidRelease.ps1` mới, `tests/test_gradle_release_signing.py` mới; `tests/validate_apk.py` nhận candidate/report path để không ghi đè dist cũ và expected metadata mới. `build_apk.py` đổi tên output legacy thành1.2.0, không chạy pipeline legacy để tạo artifact này.
- README/hướng dẫn/root CHANGELOG, banner năm tài liệu P4B, release notes và ba báo cáo/checklist P4C. Local `private/signing.properties` ignored; không commit secret/config máy cá nhân.
- `test-results/ui-p4c/` chỉ public metadata/snapshot fixture/evidence. QA source/build/instrumentation APK nằm ở ignored `build/ui-p4c/`, không phân phối; helper riêng có cùng cert để quan sát release non-debuggable, không nằm trong production APK.

[Scope so với snapshot P4C](../../test-results/ui-p4c/SCOPE.json). Không stage/commit/push hoặc thay tài liệu P0/P1/P4A.

## Rollback và bước tiếp

Rollback **source** bằng snapshot `build/ui-p4c/before/workspace` cho đúng file P4C, bỏ wrapper/pin/test mới nếu cần; không reset HEAD hoặc xóa công việc P3/P4A/P4B. Giữ khóa cũ và APK cũ, không ghi đè. Chưa publish nên có thể giữ candidate local và chờ bản sửa khác trước P4D.

Sau khi120 đã cài, không cam kết có thể cài ngược115 bằng update thông thường. Không uninstall/clear data hoặc ép downgrade để gọi là rollback an toàn. Nếu cần phục hồi behavior sau phân phối, chuẩn bị bản sửa dùng **cùng certificate và code>120**, xuất dữ liệu trước và thử retention lại; không đổi appId. Source/schema persistence ở P4C không đổi nhưng vẫn phải kiểm candidate rollback riêng.

**P4D:** người dùng review APK/checksum/report, kiểm tra thiết bị dùng hàng ngày nếu muốn, chốt tag/title/body/assets và cho phép publish ở lượt riêng. READY FOR P4D không cấp quyền tự upload. Không Google Play Console/upload key/target36 gate trong phạm vi trực tiếp này.
