# MarkRead — baseline source, build và kiểm thử

Ghi nhận ngày **27/10/2026, Asia/Saigon** trước mọi thay đổi UI. Báo cáo này phân biệt việc chạy mới với bằng chứng lịch sử; không lấy số kiểm tra cũ cộng lại.

## 1. Mốc kiểm toán

- Repository: `C:\AI\MarkRead`.
- HEAD: `a41a13a5e0e437a83fcd89b6f193292b5fdda9b1`.
- Commit subject: `Update v1.1.6`; thời gian commit `2026-10-27T14:19:47+07:00`.
- Working tree trước audit: sạch (`git status --porcelain=v1` không có dòng nào).
- Mã phiên bản thật trong `app/build.gradle.kts`, manifest, package web, general UI và Python output: **versionName1.1.5 / versionCode115**. Không tự nâng version theo tên commit.
- Package: `vn.markread.local`; minSdk26, compile/target35; runtime yêu cầu WebView100+.
- Đã lưu SHA-256 của 335 tracked file ban đầu vào ignored `build/ui-redesign-baseline/tracked-before.json` để kiểm tra không sửa source sau khi tạo tài liệu.

Chỉ bốn file Markdown trong `docs/ui-redesign/` là deliverable của lượt này. Source/UI, manifest, dependencies, lockfile, test gốc, APK hiện có và báo cáo lịch sử được giữ nguyên. Công cụ đo, bản sao test/build, log và ảnh mới nằm dưới ignored `build/ui-redesign-baseline/`; không phải dependency hay tính năng ứng dụng mới.

## 2. Môi trường đã dùng

- Windows / PowerShell.
- Node.js24.15.0, npm11.12.1, Python3.14.4.
- JDK có sẵn: `toolchain/jdk/jdk-17.0.20.1+1/`, Temurin17.0.20.1+1; `java`/`javac` chưa nằm trên PATH và JAVA_HOME chưa được cấu hình trong phiên kiểm tra. Dùng đường dẫn JDK tuyệt đối cho kiểm chứng native.
- ECJ có sẵn `toolchain/ecj.jar`; API35 `android.jar`; Windows build tools ở `toolchain/build-tools/android-15/` gồm AAPT2/D8/zipalign/apksigner.
- Dependencies web đã có trong `web/node_modules/`; **không npm install/npm ci**, không cập nhật package/lockfile, không tải công cụ.
- Playwright dùng bản có sẵn trong runtime của Codex qua NODE_PATH: `<user-home>\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules`.
- Google Chrome tại `C:\Program Files\Google\Chrome\Application\chrome.exe`; phiên bản browser chạy probe156.0.8078.48. Không thêm Playwright vào package dự án.
- Không tìm thấy SDK/emulator/adb sẵn ở các vị trí môi trường kiểm tra; không dựng hoặc cài emulator, không cài APK lên điện thoại.

## 3. Quy trình build thực tế

### Renderer web

Lệnh chuẩn từ thư mục `web/` là `npm run build` → `node build.mjs`. Esbuild bundle ES module app và Blob worker; nối Mermaid, inline KaTeX CSS/font và hai Merriweather WOFF2; tính CSP script hash rồi thay placeholder vào shell.

Đầu ra `web/dist/MarkRead.html` là một HTML tự chứa. Builder còn tạo `web/.openai/hosting.json` cho QA. Bản Android dùng bản copy ở `app/src/main/assets/index.html`. Không sửa tay bundle này; thay source thì phải rebuild/copy và xác minh CSP.

Lượt audit đã copy `web/src`, `fonts`, `tests`, build/package files và **các package đã cài sẵn** sang `build/ui-redesign-baseline/workspace/`, sau đó chạy chính `node build.mjs` ở bản sao. Không dùng symlink/junction: việc tạo junction trong sandbox bị từ chối nên dùng copy bình thường. Không cần escalation hay thêm package.

**Kết quả:** build thành công; HTML sinh ra **13.209.034 bytes**, SHA-256 `ffbe73dfd33846de368ff2207c1ac766bda2d530d6a1cf495fba10ec5dacc359`, trùng byte với `web/dist/MarkRead.html` có sẵn và `app/src/main/assets/index.html` gốc.

### Android bằng Gradle

Cấu hình: Gradle8.9 / Android Gradle Plugin8.7.3, AndroidX=false, một module `:app`, Java source/target8 nhưng host build JDK17. Không có Android UI dependency/Compose. Gradle dùng asset renderer đã check in; không có task npm liên kết tự động.

Lệnh được README hướng dẫn: `gradlew.bat assembleRelease` trên Windows (hoặc `./gradlew assembleRelease`). Signing config chỉ tạo khi có hai file private cần thiết; không có chúng Gradle release có thể không phải APK đã ký sẵn để cài/cập nhật.

**Chưa chạy Gradle assembleRelease trong lượt audit.** Không có Gradle distribution cache ở vị trí mặc định đã kiểm tra, môi trường SDK/JAVA_HOME chưa được cấu hình; chạy wrapper có thể khởi động tải distribution/plugin. Không tải/install để lấp khoảng trống và không coi pipeline ECJ là bằng chứng Gradle assembleRelease đã đạt.

### Android bằng Python/SDK

`build_apk.py` làm các bước:

1. Nếu có `web/node_modules`, chạy renderer build và copy đè asset Android.
2. ECJ compile Java production với API35, source8.
3. Đóng classes.jar → D8 release/min-api26 → classes.dex.
4. AAPT2 compile resources/link manifest-assets; thêm DEX.
5. Zipalign; ký bằng PKCS12; verify certificate/signature; kiểm tra alignment; xuất `dist/MarkRead-Android-1.1.5.apk` và báo cáo chữ ký.

Nếu thiếu key, script có nhánh tự sinh key/password mới. Vì audit không được thay asset/artifact/khóa, **không chạy trực tiếp `python build_apk.py` trong checkout gốc**.

Thay vào đó `build/ui-redesign-baseline/verify-native.py` gọi đúng các công cụ/phương án compile/package của script, với output riêng:

- ECJ Java compile production: **PASS**.
- D8 release/min-api26: **PASS**.
- AAPT2 compile/link: **PASS**.
- Đóng DEX vào APK chưa ký, zipalign và zipalign check: **PASS**.
- Không tạo hoặc dùng key riêng, không ký release mới, không ghi đè APK hiện có. Đây là kiểm chứng compile/package, không phải lần phát hành mới.

Các script tải `toolchain/fetch_tools.py`/`fetch_emulator.py` hiện trỏ gói Linux. `build_apk.py` có xử lý `.exe` trên Windows; instrumentation builder và emulator runner chưa đồng nhất Windows. Ghi nhận, không sửa trong audit UI.

## 4. Kết quả chạy mới

**Tổng 439 kiểm tra đạt**, không fail/skip được tính vào tổng:

- JavaScript unit (`npm test` từ `web/`): **79/79**. Log `build/ui-redesign-baseline/web-unit.log`.
- Browser UI (`web/tests/ui.cjs`): **54**. Log `ui.log`.
- Revision UI (`revision-ui.cjs`): **62**. Log `revision-ui.log`. Tên dòng summary cũ vẫn ghi1.1.3, không phải phiên bản artifact được thử.
- Reading UI (`reading-ui.cjs`): **46**. Log `reading-ui.log`.
- Simulated native UI (`native-ui.cjs`): **27**. Log `native-ui.log`.
- Session UI (`session-ui.cjs`): **17**. Log `session-ui.log`.
- Startup UI (`startup-ui.cjs`): **53**. Log `startup-ui.log`.
- JVM Policy (`tests/PolicyTest.java`): **69**. Log `PolicyTest.log`.
- JVM SessionPolicy (`tests/SessionPolicyTest.java`): **7**. Log `SessionPolicyTest.log`.
- APK validation (`tests/validate_apk.py`, chỉ đổi đích ghi report trong bản thực thi tạm): **25**. Log `apk-validation.log`.

Tất cả tên log ngắn bên trên thuộc `build/ui-redesign-baseline/`. Sáu UI suite chạy **script nguyên bản được copy**, dùng renderer đã build/copy có checksum trùng gốc, fixtures/screenshots ở workspace tạm. Tests có route fulfillment cho trang local; các native suite mô phỏng MessagePort host, không chạy ContentResolver hoặc lifecycle Android thật.

Các Browser UI suite còn bỏ meta `native-channel` để kích hoạt nhánh browser. HTML generated nguyên bản vẫn hướng đến native host; không tuyên bố việc mở trực tiếp file HTML trong browser là một bản web độc lập hoạt động. Timeout trước khi nhận native handshake chưa được các suite startup hiện tại phủ, xem AUDIT A15.

Compile/package, signature verification và các phép đo audit riêng không cộng thành assertions để làm tăng tổng439. Tổng này cũng không bao gồm số kiểm tra lịch sử386/247 trong báo cáo cũ.

### Lệnh tái hiện phần đã chạy

Các lệnh dưới dùng dependencies/công cụ sẵn có. Không chạy lệnh build gốc ghi đè source asset nếu mục đích chỉ tái kiểm toán.

```powershell
# Tại C:\AI\MarkRead\web: chỉ đọc source, ghi stdout tùy đích log
npm test

# Tại C:\AI\MarkRead\build\ui-redesign-baseline\workspace\web
node build.mjs

# Tại C:\AI\MarkRead\build\ui-redesign-baseline\workspace
$env:NODE_PATH = '<user-home>\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:MARKREAD_CHROMIUM = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node web/tests/ui.cjs
node web/tests/revision-ui.cjs
node web/tests/reading-ui.cjs
node web/tests/native-ui.cjs
node web/tests/session-ui.cjs
node web/tests/startup-ui.cjs

# Tại C:\AI\MarkRead: harness kiểm chứng chỉ ghi vào build/ui-redesign-baseline
python build/ui-redesign-baseline/verify-native.py
node build/ui-redesign-baseline/audit-probe.cjs
```

Thư mục `build/` bị Git ignore, harness/log không đi kèm commit tài liệu. Khi cần tạo lại workspace trên máy khác: copy `web/src`, `web/fonts`, `web/tests`, `web/build.mjs`, package/lockfile và package đã cài; copy `app/src`, `tests`, APK baseline tới đúng cấu trúc tương đối trước khi chạy. Không copy `private/`. Các bước native có thể chạy trực tiếp bằng công cụ tương đương mô tả ở mục3; harness tạm không phải dependency của dự án.

## 5. Artifact hiện có, chữ ký và tính đồng nhất

`dist/MarkRead-Android-1.1.5.apk` được kiểm tra tại thời điểm audit:

- Kích thước: **7.136.088 bytes**.
- SHA-256: **`5a0ee4e950df4ca30963b0669337b7ab731f7b65c493be35cde9f3fad6eefa90`**.
- Version compiled:1.1.5/115; package/min/target/launcher đúng cấu hình.
- Asset trong APK khớp asset renderer gốc; ZIP CRC và DEX hợp lệ.
- Signature verification APK hiện có: **PASS**, v2/v3 hợp lệ, một signer.
- Certificate SHA-256 công khai: `52a8a4d97bf264d0d43914f71408f6ccdaf6622951c55246157239aae13c2b54`.
- Manifest source/compiled yêu cầu **0 uses-permission**; không Internet/storage permission. Backup/debug/cleartext tắt; không khóa/password trong APK.
- CSP script hash khớp; font offline/notices có trong APK; reader không được chạy scripts; WebView direct file/content/network tắt; persist tree dùng cờ picker trả về.

Đây là APK **startup-fix rebuild**, khớp `test-results/1.1.5/startup/VALIDATION.md`. `test-results/1.1.5/VALIDATION.md` cấp cha mô tả APK1.1.5 trước đó (7.131.992 bytes, SHA bắt đầu7a5622), nên không dùng checksum cấp cha cho file hiện tại. Không tạo APK phát hành mới hoặc hứa khả năng cập nhật từ mọi bản cài khác chỉ dựa số phiên bản; còn phụ thuộc chứng thư bản đã cài.

## 6. Bằng chứng đo UI bổ sung

`build/ui-redesign-baseline/audit-probe.json` lưu browser/version, kích thước, contrast12 theme, focus/semantics và responsive. `audit-probe.cjs` chỉ chạy trên bản sao, không sửa app. Đã kiểm tra các viewport320×568,360×800,390×844,600×960,844×390,1280×800; không ghi nhận body tràn ngang trong các ca đó.

Các bằng chứng nổi bật:

- Mobile Tab đầu vào nút Mở đang ngoài màn hình; drawer mở không chuyển focus hoặc inert main.
- Shift+Tab ở editor vẫn thêm hai space; rename field không có focus outline/shadow.
- Accessibility tree file row hiện là listitem; help dialog chưa có accessible name; block hợp nhất không focusable.
- Target mobile toolbar34×42 CSSpx, menu32×32, gỡ20×22; chưa quy đổi thành dp trên thiết bị.
- Các tỷ lệ màu và phạm vi kết luận chi tiết ở AUDIT A07; không có custom CSS trong phép đo.
- Reduced motion còn animation startup150ms; toolbar giảm chuyển động đã được Reading suite xác nhận.

Ảnh mới đã xem trực tiếp:

- `build/ui-redesign-baseline/audit-sidebar-390.png` — drawer sau khi transition hoàn tất.
- `build/ui-redesign-baseline/audit-font-light-390.png` — cài đặt font Light, menu mở, các range.
- `build/ui-redesign-baseline/audit-settings-landscape.png` — cài đặt ở844×390, có cuộn nội dung.

Các ảnh suite mới nằm dưới `build/ui-redesign-baseline/workspace/test-results/1.1.5/` và `browser/`. Không ghi đè ảnh lịch sử trong `qa/` hoặc `test-results/` gốc.

## 7. Khoảng trống và vấn đề có sẵn — không tự sửa

- **Chưa thử Android thật/emulator:** SAF tree read/write/persistence/rename thật, provider-returned URI mới, lifecycle10 phút, process kill/doze, native dialogs, WebView100 tối thiểu, TalkBack, system font/display size, cutout/gesture/IME tiếng Việt. Chromium viewport resize không thay thế keyboard Android.
- **Instrumentation không còn khớp UI:** `ProbeInstrumentation.java` còn kỳ vọng3 switch (hiện2), không có `#modeToggle` (hiện có), và tham chiếu `#editMode/#readMode/.inline-tools` đã bỏ. Có thể fail trước khi đến các ca SAF. Không coi probe hiện tại là baseline xanh; cần cập nhật riêng trước vòng Android validation.
- **Harness emulator cũ:** `run_emulator_tests.py` dùng executable Linux, `os.killpg`, đường baseline cũ, install output1.1.3 và có uninstall package. Không chạy trên máy/người dùng đang chứa dữ liệu thật; không sửa để ép chạy trong audit.
- **Gradle chưa được chứng minh:** chưa thực thi Gradle wrapper/assembleRelease ở môi trường này; compile/package ECJ thành công không phủ plugin/task graph Gradle.
- **Báo cáo/nhãn phiên bản chưa thống nhất:** commit1.1.6 nhưng cấu hình1.1.5; `test-results/README.md` còn gọi1.1.4 là hiện tại; nội dung demo/help và summary test có nhãn cũ. Ghi nhận để duyệt, không chỉnh ngoài bốn tài liệu.
- **Test xanh chưa phủ accessibility:** test hiện có không bắt A01–A14; vài test còn ràng buộc visual cũ như bỏ focus outline đổi tên. Chỉ cập nhật ràng buộc thị giác sau khi phương án được duyệt; giữ assertions dữ liệu/security.
- **Không đánh giá bảo mật dependency toàn diện:** đã kiểm tra giới hạn/cấu hình liên quan hợp đồng UI và APK; không chạy npm audit mạng, không kết luận thư viện hiện không có lỗ hổng.

## 8. Kiểm tra đóng lượt audit

Đã đối chiếu SHA-256 của **335 tracked file** với snapshot ban đầu: **0 file thay đổi**. Git chỉ ghi nhận thư mục tài liệu mới, gồm đúng **bốn file** yêu cầu. `git diff --check` đạt; kiểm tra riêng nội dung file chưa tracked cũng đạt (UTF-8, newline cuối, không trailing whitespace, các link Markdown nội bộ tồn tại). Kết quả máy đọc ở `build/ui-redesign-baseline/integrity-summary.json`.

Chưa có thay đổi UI hoặc dependency nào để duyệt triển khai; người dùng đang duyệt kết quả và nhóm công việc trong [AUDIT.md](AUDIT.md).
