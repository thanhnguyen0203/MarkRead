# P2F-GATE — Android build environment

**28/10/2026 · kết quả: build gate đạt.** Gradle Wrapper đã tạo APK debug từ mã nguồn P2F hiện tại; build lại offline với `--rerun-tasks` cũng đạt. **Chưa có kết quả Android runtime** vì `adb devices -l` không có thiết bị/emulator. Dừng ở build gate, không triển khai P2G.

## 1. Cấu hình thực tế đã xác minh

- [Wrapper](../../gradle/wrapper/gradle-wrapper.properties): **Gradle8.9**, URL HTTPS chính thức giữ nguyên. Wrapper JAR SHA-256 `498495120a03b9a6ab5d155f5de3c8f0d986a449153702fb80fc80e134484f17`, khớp bản8.9 trên [bảng checksum Gradle](https://gradle.org/release-checksums/).
- [build.gradle.kts](../../build.gradle.kts): **AGP8.7.3**, không đổi. [Tài liệu compatibility chính thức](https://developer.android.com/build/releases/agp-8-7-0-release-notes) xác nhận dòng8.7 dùng Gradle8.9, JDK17 và SDK tối đa35; Build Tools mặc định34.0.0.
- JDK sẵn có: **Temurin17.0.20.1+1**, chạy trực tiếp `java.exe -version` đạt. Không tải/nâng JDK. Java app vẫn Java8 source/target; `.gradle.kts` chỉ là build DSL, không chuyển ứng dụng sang Kotlin.
- [app/build.gradle.kts](../../app/build.gradle.kts): compile/targetSDK35, minSDK26, applicationId `vn.markread.local`, version1.1.5/code115; giữ nguyên.
- [settings.gradle.kts](../../settings.gradle.kts): `google()`, `mavenCentral()`, `gradlePluginPortal()` giữ nguyên. Không thêm mirror hoặc repository khác.
- SDK sau khắc phục: `toolchain/android-sdk/`, Platform35 revision2/base SDK, Build Tools34.0.0, Command-line Tools12.0, Platform Tools37.0.1. Cài bằng SDK Manager chính thức, không đổi compileSdk/targetSdk hoặc pin AGP.
- Chưa có `local.properties`; không cần tạo. JAVA_HOME, ANDROID_HOME/ANDROID_SDK_ROOT, GRADLE_USER_HOME và ANDROID_USER_HOME được đặt theo process khi build. Không ghi biến môi trường toàn hệ thống hoặc đường dẫn máy cá nhân vào source.

## 2. Nguyên nhân — phân biệt từng lớp lỗi

**JDK / JAVA_HOME:** ban đầu JAVA_HOME chưa đặt, PATH không tìm được `java`. Wrapper trả9009 trước khi có thể chạy Java. Đây là thiếu cấu hình shell; JDK17 đã tồn tại và dùng được. Chọn JDK local khắc phục lớp lỗi này.

**Gradle distribution/cache:** chưa có Gradle8.9 trong cache dùng cho build. Thư mục thử P2F chỉ còn `.part`/`.lck`, không có distribution đã giải nén hợp lệ. Không có bằng chứng ZIP hỏng hoặc Wrapper JAR bị sửa. `--offline` dành cho dependency resolution không tự cung cấp ZIP bootstrap của Wrapper; có thể vẫn yêu cầu tải khi cache trống.

**Mạng/sandbox:** thử mới `curl.exe --head --location ...` trong sandbox trả exit6: `Could not resolve host: services.gradle.org`. Cùng URL khi chạy qua cơ chế cho phép ngoài sandbox theo phạm vi build trả307→302→**200**, tới Gradle distribution chính thức. Sau đó tải đủ ZIP và xác minh checksum thành công. Vì vậy lỗi quan sát được là hạn chế network/process của sandbox, không chứng minh mạng Windows bên ngoài bị hỏng.

**Loopback:** sau khi đã đủ cache/SDK, `assembleDebug --offline --no-daemon --rerun-tasks` trong sandbox còn thất bại với `SocketException: Permission denied: getsockopt` ở `TcpOutgoingConnector.connectToDaemon`. Gradle vẫn fork single-use daemon để đáp ứng JVM args `-Xmx2g`, kể cả `--no-daemon`. Chạy lại ngoài sandbox đạt16 giây, hoàn toàn offline. Đây là loopback client→daemon bị chặn, độc lập với truy cập Internet.

**Proxy:** phiên kiểm tra mới không có HTTP_PROXY/HTTPS_PROXY/ALL_PROXY/JAVA_OPTS/GRADLE_OPTS hoặc proxy trong cấu hình Gradle dự án; user Gradle home ban đầu chưa tồn tại. Lượt P2F trước chủ động đặt proxy localhost:9 để tránh ra mạng khi thử bootstrap; đó không phải cấu hình proxy lâu dài của máy. Gate không dùng proxy này và không thêm proxy/credential vào repository.

**SSL và timeout:** HTTPS qua curl và dependency resolution của JVM Gradle đều thành công khi được phép chạy ngoài sandbox. Không thấy `SSLHandshakeException`, `PKIX` hoặc timeout trong các lượt build thành công. Không sửa truststore, không dùng `curl -k`, HTTP thay HTTPS, SDK `--no_https`, hoặc tắt certificate validation. Không tăng timeout để che lỗi socket/DNS.

**SDK:** ANDROID_HOME/ANDROID_SDK_ROOT ban đầu chưa đặt, không có SDK root chuẩn. Toolchain cũ có `android.jar` ở `toolchain/platform/android-35-ext15` và Build Tools35 ở `toolchain/build-tools/android-15`, phù hợp pipeline ECJ/D8 thủ công nhưng chưa có bố cục `platforms/android-35`/`build-tools/34.0.0` cho Gradle. Tạo SDK root riêng bằng SDK Manager đã khắc phục; giữ nguyên các công cụ cũ và các gói mà baseline đang sử dụng.

**Cấu hình dự án:** không phát hiện bất tương thích Gradle/AGP/JDK/SDK. Không sửa build scripts `.kts`, Java, Manifest, UI hoặc logic file để làm build qua. Note deprecated API từ javac ở MainActivity là cảnh báo hiện có; không mở rộng sang sửa API trong gate này.

## 3. Khắc phục đã thực hiện

1. Tải `https://services.gradle.org/distributions/gradle-8.9-bin.zip` bằng curl HTTPS, theo redirect do nguồn chính thức cung cấp. Không dùng mirror bên thứ ba.
2. Lấy `.zip.sha256` từ cùng dịch vụ và đối chiếu thêm [checksum reference chính thức](https://gradle.org/release-checksums/). File136.114.148 bytes khớp SHA-256 **`d725d707bfabd4dfdc958c624003b3c80accc03f7037b5122c4b1d0ef15cecab`** trước khi giải nén/chạy.
3. Bổ sung đúng hash này vào `distributionSha256Sum` của Wrapper, theo [cơ chế verification chính thức](https://docs.gradle.org/current/userguide/gradle_wrapper.html#sec:verification). Không đổi `distributionUrl` hoặc JAR/script Wrapper. Lưu ý Wrapper kiểm checksum khi bootstrap distribution mới; cache đã dùng cần quản lý riêng. Trong gate ZIP đã được kiểm thủ công trước cả direct Gradle và Wrapper.
4. Giải nén dưới ignored `toolchain/gradle/`; seed ZIP đã xác minh vào `.gradle/user-home/wrapper/dists/gradle-8.9-bin/90cnw93cvbtalezasaz0blq0a/`. Wrapper `--offline --version` xác nhận8.9/JDK17.
5. Tải Command-line Tools12.0 từ `dl.google.com`, kiểm SHA-1 theo manifest SDK Google trước khi giải nén; ghi thêm SHA-256 thực tế trong download evidence. SDK Manager cài Platform35/Build Tools34.0.0/platform-tools và chấp nhận license SDK cần thiết vào SDK local. Gradle ZIP được kiểm **SHA-256**, không thay bằng SHA-1.
6. Đặt environment theo phiên, tải AGP8.7.3 cùng dependency build qua các repository đã có; chạy Wrapper assembleDebug. Sau đó chạy lại toàn bộ task offline thành công.
7. Thêm [Build-AndroidDebug.ps1](../../scripts/Build-AndroidDebug.ps1) để tái hiện lựa chọn JDK/SDK/cache mà không hardcode đường dẫn máy. Script nhận tham số hoặc đọc env, fallback toolchain local; kiểm component cần thiết, gọi Wrapper, kiểm APK tồn tại và in hash. Environment được trả lại giá trị cũ trong `finally`.

Các thay đổi cần review: **Wrapper properties** thêm một dòng checksum; **script PowerShell mới**; **báo cáo này**; các JSON bằng chứng trong `test-results/android-build-gate/`. Source UI/Java/test và toàn bộ tài liệu P0–P2F giữ nguyên hash so với đầu gate. Không stage/commit hoặc ghi đè công việc giai đoạn trước.

SDK, Gradle ZIP/cache, build outputs, license cache, debug keystore và raw logs đều nằm dưới `toolchain/`, `.gradle/`, `build/`, `app/build/` đã được Git ignore. Không thêm `sdk.dir`, `org.gradle.java.home`, password/proxy hoặc đường dẫn tài khoản vào file track. Debug key ở ignored `build/android-build-gate/android-user/`; không đưa vào APK/source hoặc thay khóa release.

## 4. Các lệnh đã chạy và kết quả

Các biến `$repoRoot`, `$sdkRoot`, `$jdkRoot` dưới đây được suy ra từ workspace local; không phải giá trị cần commit. Raw logs nằm trong ignored `build/android-build-gate/`.

```powershell
# Kiểm kê + kiểm mạng trong/ngoài sandbox; không bỏ certificate validation.
git status --short
Get-FileHash gradle/wrapper/gradle-wrapper.jar -Algorithm SHA256
curl.exe --head --location --connect-timeout 10 --max-time 35 `
  https://services.gradle.org/distributions/gradle-8.9-bin.zip

# Download chính thức và Get-FileHash SHA256 trước khi dùng ZIP.
curl.exe --fail --location --silent --show-error --connect-timeout 15 `
  --max-time 300 --retry 2 --output toolchain/gradle-8.9-bin.zip `
  https://services.gradle.org/distributions/gradle-8.9-bin.zip
curl.exe --fail --location --silent --show-error `
  --output build/android-build-gate/gradle-8.9-bin.zip.sha256 `
  https://services.gradle.org/distributions/gradle-8.9-bin.zip.sha256
```

Sau khi đặt env local, các lệnh build đã thực thi:

```powershell
.\gradlew.bat --offline --version
.\gradlew.bat --no-daemon --console=plain --stacktrace assembleDebug
& .\scripts\Build-AndroidDebug.ps1 -Offline -RerunTasks
```

- Lượt build đầu ngoài sandbox: **BUILD SUCCESSFUL in1m51s;31 actionable tasks,31 executed**. Log `assembleDebug-first.log`.
- Lượt offline trong sandbox: lỗi kết nối daemon; log `assembleDebug-offline.log`. Không coi đây là lỗi build source hoặc cache thiếu dependency.
- Lượt offline qua script, ngoài sandbox: **BUILD SUCCESSFUL in16s;31 actionable tasks,31 executed**. Log `assembleDebug-offline-local.log`. APK hash trùng lượt đầu, không chỉ báo UP-TO-DATE với APK cũ.
- `apksigner verify --verbose --print-certs` và `zipalign -c 4` đạt. Merged debug manifest thực tế có `debuggable=true`; source manifest/release không bị chỉnh. `allowBackup=false`, `usesCleartextTraffic=false`, không thêm permission.

## 5. APK debug thực tế

[app/build/outputs/apk/debug/app-debug.apk](../../app/build/outputs/apk/debug/app-debug.apk)

- Variant: **debug**, ký Android Debug certificate, signature scheme v2 được xác minh.
- Dung lượng: **7.595.498 bytes**.
- SHA-256: **`4ccc28bdffa4e539f48b80e994aa76eab1b3046336f90d61d49ced86a3e4a373`**.
- applicationId `vn.markread.local`, version1.1.5/code115, min26/target35/compile35, launcher MainActivity,0 permission.
- Renderer trong APK nguyên byte với P2F source asset, SHA-256 `dd43198eec05a7ea72b5d00958042d5ac444fd1851a9f0cc3a59b5c323f58c11`; notices/license được gói đủ. Không phải APK unsigned từ pipeline ECJ của giai đoạn trước.

Certificate debug SHA-256 `32564670cdd48011aa5d82a79051054ca6a143eca0e03f27079b366f948134a3`, khác certificate APK release đã có. APK dùng cùng applicationId nên **không thể giả định cài đè bản release**. Nếu máy đang có bản ký release, dùng thiết bị/profile/emulator thử nghiệm phù hợp hoặc tự quyết định cách chuyển sau khi bảo toàn dữ liệu. Gate chưa cài/uninstall/xóa dữ liệu ứng dụng nào. Không đổi suffix/version/key để né lỗi chữ ký.

## 6. Regression và kiểm chứng APK

Chạy lại mới trên source P2F hiện tại trong workspace copy riêng, không ghi đè ảnh/log P2F:

- **1.203/1.203 PASS,0 FAIL:** Node132; browser888; JVM158; APK baseline25.
- Browser888 gồm907-baseline browser592 và P2F mới296: UI54, Revision62, Reading46, Native simulation27, Session17, Startup53, Foundations27, Accessibility68, Keyboard68, Keyboard-native16, Native-compatibility23, Icons61, Icon-states70, Responsive114, Typography36, Overflow146.
- JVM158 = Policy69 +SessionPolicy7 +NativeUiPolicy82. Generator fixture cũng in assertion nhưng không được cộng lặp.
- **Palette2.220/2.220 PASS**, đủ12 theme, đếm riêng. Custom CSS, editor focus/selection/undo, theme/icon và responsive thuộc các suite trên.
- **18 kiểm chứng riêng trên APK Gradle debug PASS**, đếm ngoài1.203: artifact/AGP metadata, ID/version/SDK, debuggable/launcher,0 permission, backup/cleartext flags, signature/alignment/CRC, renderer/notices/DEX, không gói secret, CSP hash/sandbox/network deny và font offline.
- APK25 trong baseline vẫn dùng verification pipeline cũ để giữ phép so sánh; không tráo nó với APK debug rồi báo tương đương. APK debug thực tế có18 kiểm riêng nêu trên.
- Kiểm hash đầu/cuối: chỉ Wrapper properties đổi trong các file đã có; UI, Java, Manifest, build scripts `.kts`, dependency files, tests, docs cũ, screenshots P2F và APK ký cũ giữ nguyên. `git diff --check` đạt.

Một assertion trong checker APK mới ban đầu chờ format `0x0`; AAPT2 SDK34 in boolean `=false`. Đã chỉnh parser checker để đọc đúng output và chạy lại18/18; không sửa Manifest hoặc hạ điều kiện bảo mật.

Bằng chứng gọn, không chứa đường dẫn tài khoản/credential: [RESULTS](../../test-results/android-build-gate/RESULTS.json), [APK checks](../../test-results/android-build-gate/debug-apk-checks.json), [integrity](../../test-results/android-build-gate/integrity.json), [downloads](../../test-results/android-build-gate/downloads.json). Raw suite logs trong `build/android-build-gate/regression/`; build/device logs ở thư mục cha.

## 7. PowerShell để tự build trên máy hiện tại

Mở PowerShell bình thường tại **thư mục gốc repository**, nơi có `gradlew.bat`:

```powershell
# Cache và SDK đã cài trong gate: không cần mạng cho lần này.
& .\scripts\Build-AndroidDebug.ps1 -Offline

# Bắt buộc chạy lại task nếu cần kiểm tra build từ source hiện tại.
& .\scripts\Build-AndroidDebug.ps1 -Offline -RerunTasks

Get-Item .\app\build\outputs\apk\debug\app-debug.apk
Get-FileHash .\app\build\outputs\apk\debug\app-debug.apk -Algorithm SHA256
```

Nếu cần dùng JDK/SDK riêng, truyền `-JavaHome`, `-SdkRoot`, `-GradleUserHome` với đường dẫn local; không ghi các giá trị đó vào source. Bỏ `-Offline` khi cache dependency thực sự chưa có và mạng được phép. Script không nâng phiên bản hoặc tự cài SDK.

Nếu chính sách PowerShell không cho chạy script, có thể dùng lệnh trực tiếp thay vì hạ execution policy:

```powershell
$repoRoot = (Get-Location).Path
$jdk = Get-ChildItem .\toolchain\jdk -Directory -Filter 'jdk-17*' |
  Sort-Object Name -Descending | Select-Object -First 1
if (-not $jdk) { throw 'Chọn JDK17 đã cài bằng JAVA_HOME.' }
$env:JAVA_HOME = $jdk.FullName
$env:ANDROID_HOME = (Resolve-Path .\toolchain\android-sdk).Path
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:ANDROID_USER_HOME = Join-Path $repoRoot 'build/android-build-gate/android-user'
$env:GRADLE_USER_HOME = Join-Path $repoRoot '.gradle/user-home'
.\gradlew.bat --offline --no-daemon --console=plain assembleDebug
if ($LASTEXITCODE -ne 0) { throw 'assembleDebug thất bại; xem lỗi gốc phía trên.' }
```

Các env trên chỉ áp dụng phiên PowerShell; không có `setx`, global proxy hoặc truststore change. Trong Codex sandbox, nếu vẫn lỗi socket dù offline, cần cho phép **lệnh build ngoài sandbox** qua cơ chế quyền của môi trường, hoặc chạy block trên trong PowerShell ngoài Codex; không sửa UI/Gradle version để vượt hạn chế OS.

Nếu chuyển sang máy sạch, cần cài JDK17 và SDK trước. Với Command-line Tools12.0 đã tải/kiểm trong toolchain, đặt JAVA_HOME hợp lệ rồi chạy:

```powershell
$sdkRoot = Join-Path (Get-Location) 'toolchain/android-sdk'
& .\toolchain\android-sdk\cmdline-tools\12.0\bin\sdkmanager.bat `
  "--sdk_root=$sdkRoot" 'platforms;android-35' 'build-tools;34.0.0' 'platform-tools'
if ($LASTEXITCODE -ne 0) { throw 'SDK installation failed.' }
```

Đọc/chấp nhận license được SDK Manager hiển thị. Cú pháp package và SDK root theo [SDK Manager chính thức](https://developer.android.com/tools/sdkmanager). Gate chọn bản tool cụ thể đã kiểm chứng với JDK17, không chạy update-all hoặc chuyển toolchain mới.

Nếu phải tải ZIP Gradle thủ công trên máy khác, dùng hai URL ở mục4 rồi **dừng ngay nếu hash không khớp**:

```powershell
$expected = (Get-Content .\build\android-build-gate\gradle-8.9-bin.zip.sha256 -Raw).Trim()
$pinned = 'd725d707bfabd4dfdc958c624003b3c80accc03f7037b5122c4b1d0ef15cecab'
$actual = (Get-FileHash .\toolchain\gradle-8.9-bin.zip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($expected -ne $pinned -or $actual -ne $pinned) { throw 'Gradle SHA-256 mismatch; không giải nén/chạy.' }
$cacheDir = Join-Path (Get-Location) '.gradle/user-home/wrapper/dists/gradle-8.9-bin/90cnw93cvbtalezasaz0blq0a'
New-Item -ItemType Directory -Force $cacheDir | Out-Null
Copy-Item .\toolchain\gradle-8.9-bin.zip (Join-Path $cacheDir 'gradle-8.9-bin.zip')
# Wrapper tự kiểm/giải nén khi bootstrap cache mới.
& .\scripts\Build-AndroidDebug.ps1
```

Mạng doanh nghiệp: chỉ cấu hình proxy/CA theo hướng dẫn quản trị viên trong cấu hình user local nếu thực sự cần; không commit credential và không tắt SSL. Lượt gate này không cần các thao tác đó.

## 8. Kiểm thử còn thiếu và cổng P2G

`adb devices -l` đã chạy bằng Platform Tools chính thức: danh sách trống. Không tìm thấy emulator/system image trong SDK local hoặc trên PATH; không tự tải image lớn/tạo thiết bị mới để mở rộng bước này.

**Chưa thực hiện:** cài/khởi động APK, đọc Markdown, Settings, editor/caret/undo,12 theme trên WebView Android, SAF grants/đọc/đổi tên/xuất/thu hồi, TalkBack, IME Việt, display/font scaling, orientation/insets và lifecycle/recovery thực. Browser/MessagePort và kiểm APK không thay thế các ca đó. Đây là phần còn lại của smoke gate P2D–F; không tuyên bố đã kiểm thử thiết bị thật.

Khi có thiết bị thử đã cho phép USB debugging, kiểm tra trước bằng `toolchain/android-sdk/platform-tools/adb.exe devices -l`. Chỉ cài APK khi đã xác định đúng thiết bị và khả năng tương thích chữ ký. Không uninstall bản đang dùng để tự giải quyết signature mismatch.

**Build environment không còn chặn P2G**, nhưng chỉ triển khai P2G sau khi người dùng duyệt và quyết định cổng Android runtime còn mở. Không thêm animation/Motion dependency ở lượt này. Có thể rollback riêng phần repository bằng cách bỏ dòng checksum và script mới; không cần reset repo, thay UI, xóa SDK/cache hoặc đụng keys/APK release. Giữ checksum là lựa chọn bảo mật phù hợp nếu tiếp tục dùng8.9.
