> **Cập nhật phạm vi P4C —29/10/2026:** người dùng xác nhận KHÔNG phát hành Google Play; phân phối APK trực tiếp bằng release key local. Các điều kiện Console/upload key/target36 bên dưới là đánh giá lịch sử cho phạm vi Play, không chặn APK trực tiếp. P4C đã đối chiếu artifact GitHub thật, áp dụng1.2.0/code120 và kiểm nâng cấp release; xem [P4C_REPORT](P4C_REPORT.md). Không sửa lại evidence P4B cũ thành kết quả thử mới.

# P4B — Versioning, Signing & Release Configuration

29/10/2026 · **NOT READY** để tạo bản cập nhật Google Play thông thường. P4B đã hoàn tất phần chuẩn bị/kiểm thử; còn **SIGNING BLOCKED cho Play vì thiếu evidence certificate** và **target API gate chưa đạt**. Không tự chuyển P4C/P4D.

## Kết luận chính

- **PASS cục bộ:** keystore hiện có sử dụng được, certificate khớp cả ba APK local release1.1.3/113,1.1.4/114,1.1.5/115. Khóa không bị thay hoặc sinh mới.
- **SIGNING BLOCKED / NOT VERIFIED cho Google Play:** người dùng đã xác nhận Play App Signing; chưa có upload/app-signing SHA256 từ Console hoặc delivered APK xác minh nguồn Play. Chưa có versionCode lớn nhất đã dùng trên các track. Không lấy các APK dist cục bộ làm bằng chứng thay thế.
- **Normal Play submission target gate chưa đạt:** hiện target35. [Chính sách Google Play](https://support.google.com/googleplay/android-developer/answer/11926878) yêu cầu update ứng dụng điện thoại target36 từ31/08/2026. Gia hạn/ngoại lệ riêng tài khoản **NOT VERIFIED**; không coi target35 đủ cho update vì app cũ có thể vẫn được phân phối.
- **Đề xuất, chưa duyệt:** versionName **1.2.0**, code **120** chỉ nếu chưa dùng và lớn hơn mọi code cần vượt trên Play; nếu không, lấy giá trị lớn hơn rồi duyệt. Thực tế vẫn **1.1.5 /115** ở tất cả source/compiled metadata hiện tại.

Đây không phải lỗi regression của UI P4A hoặc kết luận khóa local sai. Gate P3F-R2 “READY FOR P4” vẫn là gate chất lượng phần mềm trước đó, không chứng nhận quyền ký/submit Google Play.

## Đầu vào và bảo toàn workspace

Đã đọc P4A icon report, P3F-R remediation/readiness/known issues và P3F-R2 readiness, MASTER/Design System, Android Build Gate, README/CHANGELOG/hướng dẫn, Gradle/Manifest và pipeline Python. Kiểm tra Git status/diff trước sửa; snapshot158 input vào ignored `build/ui-p4b/before`, không chép private credentials vào snapshot. Có sẵn các thay đổi P3/P4A chưa commit; không stage/reset/commit hay ghi đè chúng.

P4A được xác minh bằng renderer SHA, icon source/export checks, Gradle debug APK hash/cert/metadata và kết quả launcher API35 lịch sử. P4B chạy lại đầy đủ regression/icon/palette; không lặp native launcher/IME/SAF hoặc nâng cấp release. Không quét ngoài workspace, đọc/cài/dừng emulator5554 hoặc điện thoại người dùng.

## Metadata và signing

Hiện tại applicationId/namespace **`vn.markread.local`**, name1.1.5/code115, min26/target35/compile35; Java8 source/target, JDK17, Gradle8.9/AGP8.7.3. Có debug/release, không flavor/applicationId suffix. Commit tên1.1.6 trong Git không đổi metadata Gradle115 và không có APK1.1.6 được nhận diện; version dựa vào compiled artifact.

Public certificate SHA256:

- **Local release/keystore:** `52a8a4d97bf264d0d43914f71408f6ccdaf6622951c55246157239aae13c2b54`.
- **Gradle debug:** `32564670cdd48011aa5d82a79051054ca6a143eca0e03f27079b366f948134a3`.
- **Play app signing / upload:** **NOT VERIFIED**, chưa cung cấp; không gán hai SHA cục bộ vào hai vai trò này theo suy đoán.

Keystore tự nhận dạngPKCS12, một private-key entry/alias khớp cấu hình cũ, RSA3072/SHA256withRSA, hiệu lực27/10/2026→14/03/2054. Challenge ký/verify trong RAM đạt; không ký APK release để thử khóa. [Signing audit và quyết định theo từng trường hợp](P4B_SIGNING_AUDIT.md).

Google Play dùng upload certificate để xác thực artifact nộp, app-signing certificate cho APK delivered; chúng có thể khác. Vì vậy không kết luận có thể cài APK ký bằng upload key lên bản Play chỉ dựa vào việc upload key hợp lệ. [Nguồn Android](https://developer.android.com/studio/publish/app-signing).

## Release build configuration đã kiểm tra thực tế

Gradle init-task QA đọc metadata công khai mà không in path/alias/password signing, sau đó chạy các task merge/compile release:

```powershell
.\gradlew.bat --offline --no-daemon --console=plain `
  -I build/ui-p4b/inspect.gradle :app:p4bInspectRelease `
  :app:processReleaseMainManifest :app:mergeReleaseAssets `
  :app:processReleaseResources :app:compileReleaseJavaWithJavac
```

**BUILD SUCCESSFUL**,18tasks, lần chốt7s (1executed/17up-to-date sau compile trước đó). Không gọi `assembleRelease`, `bundleRelease` hoặc release signing task; không có release APK mới.

- **PASS:** release debuggable=false; minify=false; shrinkResources=false;0ProGuard rule files. Không tự bật R8, shrinking hoặc thêm rules/framework.
- **PASS:** Java source/target1.8, declared release runtime dependencies0; dependency versions và repositories không đổi. Các thư viện Markdown/CSS/KaTeX/Mermaid/font vẫn được bundle trong WebView như trước.
- **PASS:** merged release Manifest package/version đúng115/1.1.5, zero uses-permission, không INTERNET; allowBackup=false, fullBackupContent=false, dataExtractionRules chặn backup/transfer; usesCleartextTraffic=false. Không đổi appId/MainActivity/SDK/signing config.
- **PASS:** merged release assets có renderer và third-party notices đúng byte source. Các resource launcher Open Book/API26/33 compile được; không lược SVG, CSS, JS, KaTeX hay font offline.
- **CONFIG PRESENT, chưa xác minh Play:** Gradle hiện tạo localRelease khi hai file private cũ tồn tại. Cấu hình đó không kiểm fingerprint Play và khi thiếu file có thể để release unsigned; không nhận một kết quả assemble unsigned là release-ready. Không sửa config thật thành một identity chưa xác minh. Phương án env/local opt-in và fail-closed trước release được nêu trong signing audit, **chưa áp dụng**.

[Cấu hình Gradle thực](../../test-results/ui-p4b/RELEASE_CONFIGURATION.json), [merged release checks](../../test-results/ui-p4b/RELEASE_MERGE_CHECK.json). Đây là xác minh inputs merge/compile, không phải kiểm định một APK release mới.

## Security/privacy và packaging

Source Java không đổi; kiểm tra vẫn thấy WebView debugging=false, direct file/content access và file-URL universal access=false, blockNetworkLoads=true, mixed content never allow, intercept chỉ synthetic trusted origin; external navigation bị chặn. Bridge vẫn bounded trusted WebMessagePort, không addJavascriptInterface. Reader sandbox không chạy script, CSPconnect-src none, cookie/geolocation/file chooser WebView bị hạn chế; file thật qua SAF picker và scope/opaque IDs.

Merged manifest không tăng quyền, giữ backup/cleartext disabled. Debug APK/source/merged release assets không chứa signing key/password path payload, QA helper hoặc file cá nhân trong asset; fonts/licenses/notices đúng byte. Không thêm analytics/telemetry/network dependency hoặc thay chính sách dữ liệu. Chưa nộp Data Safety/store declarations, chưa truy cập Play Console.

[Secret scan](../../test-results/ui-p4b/SECRET_SCAN.json): không phát hiện password local thật, bản sao keystore hoặc PEM private-key marker trong các file Git-visible đã quét; private vẫn ignored, Git history theo tên keyfile không thấy entry. Phạm vi không phải forensic mọi blob hoặc chứng nhận không tồn tại bất kỳ token/secret nào. Không công bố password/private key/digest keystore trong evidence. Windows ACL và backup riêng chưa được kiểm định.

## Thay đổi thực hiện

Chỉ ba file có sẵn đổi so với snapshot đầu P4B:

1. **`build_apk.py`**: bỏ tự sinh khóa/password; thiếu material hợp lệ về sự tồn tại/password rỗng thì fail-closed trước compile/asset/output mutation. Không chạy builder này để ký APK, không đổi output/version hardcode của nó trong P4B.
2. **`.gitignore`**: thêm p12/pfx/local signing properties để tránh đưa signing material mới vào Git. Không dùng ignore để che file đã tracked.
3. **`README.md`**: phân biệt signing local và Google Play, cập nhật hành vi không tạo khóa, dẫn gate P4B thay hướng dẫn phát hành vô điều kiện.

Mới: `tests/test_release_signing_guard.py` với5test; năm tài liệu P4B ở phần dưới; `test-results/ui-p4b/` chứa public certificate/metadata/results/log evidence. Helper audit/init Gradle/log thô chỉ ở ignored build. **Không đổi** `app/build.gradle.kts`, Manifest, Java, WebView asset/source,23Lucide, launcher, appearance/CSS schema, editor/SAF, dependencies, version hoặc file P0–P4A. [Scope](../../test-results/ui-p4b/SCOPE.json).

## Kết quả kiểm thử

- **2297/2297 regression PASS:** Node132 + browser1969 + JVM171 + baseline APK25. Bao gồm12theme/custom CSS,23Lucide offline, reader/editor/search/Replace/Undo, responsive/motion, keyboard/focus/semantic và native policy/simulation. Các suite chạy trên bản source/asset không đổi; không nhận simulation là runtime Android.
- **81/81 launcher PASS:** parity nguồn/vector/XML, safe zone, monochrome, references/density/PNG và contrast giữ nguyên.
- **5/5 test mới PASS:** thiếu private directory/key/password, password rỗng và existing-material guard; không tạo khóa, không chạy compile/sign subprocess hoặc sửa byte fixture. Không lấy fixture dummy làm bằng chứng crypto; crypto được kiểm riêng trên khóa thật bằng challenge.
- **Tổng2378 kế thừa +5 mới =2383/2383 PASS**,0fail. Palette **2220/2220**, debug APK **18/18** là gates riêng, không cộng vào tổng2383.
- **assembleDebug PASS:** `scripts/Build-AndroidDebug.ps1 -Offline -RerunTasks`,14s,31tasks executed. APK7639333bytes, SHA `4b8ede97f832e0f97d8ad91970e20eb416a9a229d5d3ec54e991f9e96dd5a314`, **byte-identical P4A**, signerD. Renderer13313023bytes/SHA `9be329e41e942ed481f375d1e2e84738cebedb8a696ea6b9d16fee1dc109df68` và webdist/source/APK exact.
- **apksigner/aapt2 PASS:** ba local-release và debug/baseline copies liên quan; cert/versions/signature v2/metadata được kiểm. Không dùng debug APK18 để tuyên bố đã kiểm một release mới.
- **NOT VERIFIED:** update từ bản Play, Console fingerprints/MAX code/extension, API36 migration, Play-delivered APK/cert lineage. Không cài hoặc clear data/uninstall ở P4B.
- **NOT TESTED ở P4B:** native IME/SAF/TalkBack/physical device; kế thừa evidence R2/P4A trong đúng phạm vi lịch sử. TalkBack vẫn **NOT TESTED — accepted limitation**, không chặn riêng P4C.

Windows đã báo `CreateProcessWithLogonW1909` cho tài khoản sandbox. Các lệnh kiểm thử/build cần thiết chạy ngoài sandbox qua quyền môi trường đã cho phép; không sửa account/SSL/proxy hoặc security để bỏ qua. Wrapper `powershell.exe5` từng biến warning javac ở stderr thành NativeCommandError và ghi log UTF16; đã xử lý adapter/encoding, dùng shell chính cho build cuối. Các lần đó không quy thành lỗi Java/app và không xóa evidence. Build cuối thật thành công, không tăng timeout hoặc thay compiler/SDK.

[Kết quả tổng](../../test-results/ui-p4b/RESULTS.json), [APK18](../../test-results/ui-p4b/APK_CHECK.json), [artifact certificates](../../test-results/ui-p4b/ARTIFACT_AUDIT.json), [artifact hashes](../../test-results/ui-p4b/ARTIFACTS.json), [suite/build logs](../../test-results/ui-p4b/suites/).

## Năm tài liệu đầu ra

- [P4B_REPORT.md](P4B_REPORT.md): gate, config, scope, kiểm thử, rollback.
- [P4B_SIGNING_AUDIT.md](P4B_SIGNING_AUDIT.md): fingerprints, key proof, vai trò Play và phương án signing có điều kiện.
- [P4B_VERSION_PLAN.md](P4B_VERSION_PLAN.md): bảng hiện tại/đề xuất, rule versionCode và vị trí cần đồng bộ.
- [P4B_UPDATE_TEST_PLAN.md](P4B_UPDATE_TEST_PLAN.md): Play/local update paths và ca retention/settings/CSS/SAF/editor.
- [CHANGELOG_DRAFT.md](CHANGELOG_DRAFT.md): bản nháp tiếng Việt dựa trên tính năng P0–P4A đã kiểm tra, chưa được phát hành.

## Việc cần hoàn tất trước/trong P4C được duyệt

1. Lấy public App signing/Upload fingerprints + MAX code từ đúng app Console, đối chiếu với keyL và artifact thực; nếu lệch, dùng đúng backup/upload-key recovery được chủ tài khoản duyệt, không tự thay khóa.
2. Giải quyết targetAPI36 qua migration SDK/toolchain được duyệt và regression/runtime phù hợp, hoặc xác minh ngoại lệ/gia hạn còn hiệu lực, đúng app. Chưa có cơ sở submit target35 thông thường.
3. Duyệt versionName/code cụ thể; đồng bộ Gradle/Manifest/package/About/test/artifact naming mà không sửa báo cáo lịch sử hoặc ghi đè APK dist cũ.
4. Chỉ sau khi identity được xác minh mới nối env/local signing config có preflight vào Gradle. Chọn AAB/format theo kênh Play đã xác minh; không gọi APK ký upload là delivered APK và không tạo GitHub Release.
5. Build candidate được duyệt, xác minh packaging/cert và chạy update plan trên AVD QA riêng/Play test track có ủy quyền. Chứng minh retention bằng baseline/candidate thật, không dùng install Success hoặc byte-equal debug để suy ra.
6. Rà changelog/installation notes/Play metadata/privacy declarations dựa trên SDK/code/cert và runtime thực cuối. Giữ giới hạn provider, Undo deprecated và coverage thiết bị; không tái mở TalkBack như blocker riêng.

## Rollback

Khôi phục riêng `build_apk.py`, `.gitignore`, README từ `build/ui-p4b/before/workspace`; bỏ file test guard và năm tài liệu/evidence P4B nếu muốn. Không reset HEAD vì sẽ mất công việc P3/P4A chưa commit. Không đụng private/keystore, APK dist cũ hoặc app data. Lưu ý rollback builder sẽ trả lại hành vi tự sinh khóa nguy hiểm khi thiếu key; giữ guard là lựa chọn an toàn hơn. Không có runtime app/schema/version/signing-key change phải migrate ngược.

**Dừng tại P4B.** Không phát hành APK/AAB, không upload Play/GitHub và không thực hiện P4C/P4D. Kết luận **NOT READY** cho release update hiện tại; các phần kiểm thử đạt không làm mất hai gate bên ngoài còn thiếu.
