# P2D — Native Android Compatibility & Fallback

**27/10/2026 · MarkRead 1.1.5 / 115 · Java Android + WebView, HTML/CSS/JS.**

Đã triển khai P2D trong native shell; **735/735 kiểm tra tự động đạt, 0 fail**, palette **2.220/2.220**. Đã compile Java/API35, tạo DEX và đóng gói tài nguyên/APK kiểm chứng bằng toolchain local. **Chưa xác minh tương thích runtime trên Android thật/emulator.** Gradle đã thử nhưng wrapper dừng trước build vì môi trường Java chưa cấu hình. Chưa chuyển P2E.

## 1. Đầu vào, baseline và phạm vi

- Đối chiếu P0 tại [AUDIT](AUDIT.md), [FILE_MAP](FILE_MAP.md), [BASELINE](BASELINE.md), [REGRESSION_CHECKLIST](REGRESSION_CHECKLIST.md); P1 [MASTER](../../design-system/markread/MASTER.md), [COMPONENTS](../../design-system/markread/COMPONENTS.md), [ACCESSIBILITY](../../design-system/markread/ACCESSIBILITY.md), MOTION, ICONS và [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md); các báo cáo P2A/P2B/[P2C](P2C_REPORT.md).
- Dùng [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md), Quick Reference accessibility/touch/error recovery và tra cứu local `Android error recovery theme --domain ux`. Áp dụng hướng lỗi rõ nguyên nhân, có đường tiếp tục/thoát, chữ tương phản, native control48dp/sp. Không áp stack Compose/React hoặc tạo lại Design System.
- P2D xử lý chính **G8 / A05, A14, A15** của P0/P1; cutout/target native liên quan G4. Không coi15 finding đã được giải quyết hết: font scaling toàn app, layout/copy/icons/motion và kiểm chứng Android vẫn theo các giai đoạn riêng.
- Git đầu vào HEAD `7fe84d0` (`feat(ui): complete P2B accessibility improvements`), đã có thay đổi P2C tracked và module/test/tài liệu untracked. Kế thừa nguyên trạng. File gốc không rõ nguồn gốc đã ghi ở P2C cũng giữ nguyên hash. Không stage, commit, reset hoặc dọn file người dùng.
- **Chạy lại trước sửa:630/630 đạt.** Snapshot48 file tại `build/ui-p2d/before-p2d.zip`, inventory `before-sha256.json`, trạng thái Git `git-before.txt`, log trong `before/`; phân tích trước sửa `ANALYSIS_BEFORE.md`. Các bằng chứng này nằm trong ignored build.
- minSdk26 (Android8), compile/target35, Java8; WebView tối thiểu100. Manifest giữ `adjustResize`, configChanges và Back opt-out hiện có. Không đổi version, dependency, preference schema hoặc bridge API.

## 2. Vấn đề xác minh và thay đổi

### Theme và native controls

Fallback WebView cũ trước đây luôn dùng chữ trắng: trên saved Light background trắng, contrast là1:1. Native AlertDialog luôn kế thừa Activity Material tối, kể cả khi app đang dùng theme sáng.

- Thêm `NativeUiPolicy.Theme` cho đủ12 ID hiện có, ánh xạ background/surface/text/accent và light/dark từ hệ token P2A. Fixture test lấy trực tiếp từ `themes.js` và `resolvedThemes`, không chỉ so hai bảng expected viết tay.
- Window/root/WebView tiếp tục dùng đúng background cũ; dialog dùng Material light/dark theo palette, message/title khi resource platform khả dụng và button được tô màu đọc được. Material theme vẫn là fallback cho title trên OEM không cung cấp `alertTitle`.
- Native fallback có title22sp, body/button16sp, padding24dp, gap8dp, nút tối thiểu48dp, nhãn có thể xuống dòng và màn hình cuộn. Dùng Button/TextView native, giữ feedback/focus platform; pane/heading accessibility chỉ gọi từ API28. Bản26–27 vẫn có text/role native.
- API30+ dùng `WindowInsetsController` cho màu icon system bars; API26–29 giữ legacy flags. Áp dụng lại sau khi root attach nếu controller chưa sẵn sàng. Dialog/fallback hiện hữu được cập nhật màu khi nhận theme trễ.
- Không đổi cách lưu/khôi phục theme. Native chỉ theo theme ID; **custom CSS vẫn chỉ ảnh hưởng reader**. Không lấy arbitrary CSS để suy ra màu system bars/dialog. Khi palette web thay đổi tương lai, phải cập nhật mapping native và chạy fixture12 theme.

Android có thể áp quy tắc riêng lên status/navigation bar ở target35. Màu nền launch window trong `styles.xml` vẫn graphite như baseline; không tuyên bố đã loại mọi flash do splash/launch transition của OS. Cách dùng appearance API dựa trên [WindowInsetsController](https://developer.android.com/reference/android/view/WindowInsetsController).

### Insets, keyboard và viewport

- Root vẫn là nơi duy nhất đặt padding native. API30+ thêm `displayCutout()` vào union `systemBars() | ime()`; `getInsets()` lấy mức inset lớn nhất theo cạnh của union, không cộng ba loại. Xem [WindowInsets](https://developer.android.com/reference/android/view/WindowInsets).
- API26–29 giữ nhánh systemWindowInsets cũ. Không đổi decor policy của nhánh này khi chưa có phép đo thiết bị.
- Giữ `adjustResize`, visualViewport/scroll correction P2C; không thêm CSS safe-area/keyboard padding, không đặt caret/selection hoặc focus lại editor khi resize/resume.
- Đây là thay đổi source có lý do kỹ thuật; chưa chứng minh không jump/double padding/khoảng trống trên mọi OS, keyboard và chế độ navigation. Các ca này thuộc native QA bắt buộc ở mục7.

### Back

Trước đây thiếu `markReadBack` được coi là `exit`; kết quả null/khác hợp đồng bị bỏ qua, callback không phản hồi không có đường phục hồi.

- Giữ ba kết quả **handled / dirty / exit** và thứ tự UI của P2C: đang composition/rename busy → popup của lớp hiện tại → HTML dialog → inline editor → navigator → drawer → find → read mode → dirty/exit. OS vẫn sở hữu dismiss IME; chưa đổi thành lịch sử trang web.
- Chỉ `exit` chính xác mới kết thúc trực tiếp. `dirty` giữ ba lựa chọn Ở lại / Lưu bài đang mở / Thoát bỏ sửa; Save vẫn gọi hàm xuất bản sao hiện có, không tự đóng app hoặc lưu các draft khác.
- Thiếu JS, kết quả không hợp lệ hoặc không phản hồi3s hiện native confirmation **Ở lại / Đóng MarkRead**, cảnh báo không kiểm tra được draft. Không tự bỏ sửa.
- Chống bấm Back trùng, kết quả cũ sau pause/recreate/destroy và dialog lặp. Không dùng `WebView.goBack()`.
- Giữ `enableOnBackInvokedCallback=false` và `onBackPressed` trên target35; đây là cơ chế tương thích hiện tại. [Tài liệu Android](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture) mô tả opt-out; không tuyên bố đã triển khai predictive Back hoặc tương thích thay đổi target36. Nâng target cần đánh giá riêng.

### Native fallback và bridge readiness

Lỗi constructor/configuration WebView, local asset/channel setup trước đây chưa có recovery native. Startup thiếu handshake có thể giữ app pending; toast HTML nằm trong UI chưa hiển thị. Renderer-gone destroy view nhưng còn giữ `Activity.web` tham chiếu view đã hỏng.

- Thêm fallback native cho provider quá cũ, lỗi khởi tạo, lỗi tải main frame/local asset, channel setup exception, startup chưa hoàn tất và renderer-gone. Chỉ xử lý lỗi main frame; không biến tài nguyên Markdown cố ý bị chặn thành lỗi toàn app.
- Startup watchdog chỉ lấy **một mẫu sau22s foreground**, kiểm tra hai hàm sẵn có `markReadBack/markReadSave`, `#app`, startup marker và aria-busy. Chờ callback tối đa1,5s. Không thêm op bridge, telemetry, timer polling tài liệu hay tự reload.
- Với startup chậm có **Tiếp tục chờ**, **Khởi động lại giao diện**, **Đóng MarkRead**. Chờ giữ nguyên WebView và heap; chỉ khi người dùng chọn chờ mới rearm phép kiểm tra. Restore vẫn giữ timeout120s cũ; watchdog không cắt request đó.
- Khởi động lại là thao tác người dùng rõ ràng, có cảnh báo **bỏ các bản sửa chưa xuất trong RAM**. Không khởi động lại khi picker đang mở. Lỗi restore/file recoverable vẫn dùng toast/controls sẵn có để chọn lại quyền, không bắt người dùng reload app.
- Khi fallback phủ UI, WebView bị loại khỏi accessibility tree và native panel nhận focus; ẩn panel khôi phục thuộc tính accessibility cũ, không tự focus textarea hay đặt selection.
- `disposeWebView` gỡ view, đóng port, xóa tham chiếu hiện tại và hủy callback/timer. Nonce được chụp bất biến theo page. Callback thuộc view/page cũ không được phủ recovery lên view mới. Tuân theo [onRenderProcessGone](https://developer.android.com/reference/android/webkit/WebViewClient): view đã mất renderer không được tái sử dụng. Không thêm crash hook vào bản app.
- Readiness marker chỉ xác minh startup hoàn tất, không kiểm tra mọi lỗi JS sau startup hoặc sức khỏe toàn bộ renderer. Back có đường lỗi riêng; native watchdog không thay thế error handling hiện có.

### Lifecycle và SAF

- `onPause` hủy watchdog/probe/Back pending nhưng giữ live WebView; `onResume` chỉ kiểm tra startup chưa ready. PageState generation/ticket vô hiệu hóa callback cũ. `onDestroy` đóng dialog/port, dọn timer/export buffer và WebView. `onStart/onStop`, ngưỡng10 phút và picker/config-change exclusion giữ nguyên.
- Với renderer/manual recovery trong cùng Activity, giữ metadata `DocumentStore` đã restore thay vì chạy lại session-expiry từ cờ recency lúc khởi tạo Activity. Không giả đây là phục hồi JS heap: source chưa xuất, undo và view state RAM của renderer đã mất vẫn không khôi phục được.
- Nhánh persisted tree sai provider/không còn read grant trước đây có thể trả bộ rỗng im lặng và giữ metadata cũ nếu restore trước đó chỉ hoàn tất một phần. Nay clear snapshot metadata cùng cleanup preference/grant vốn có, trả SecurityException đã được ánh xạ thành hướng dẫn chọn lại thư mục. Không xóa file vật lý hoặc cấp quyền mới.
- `FileNotFoundException` được chuyển thành thông báo tệp/thư mục không còn tồn tại/không đọc được và chọn lại bằng system picker; không đưa URI provider trong thông báo này. SecurityException giữ hướng dẫn cấp lại quyền. Lỗi ghi cụ thể tiếp tục hiển thị; lỗi rỗng có câu mặc định.
- Thêm guard `port == nativePort` trước khi mở save picker từ callback export đã xếp hàng, tránh page cũ mở picker trên page mới. Picker đã mở vẫn theo luồng hiện có; không đổi phần ghi output stream.
- Giữ ACTION_OPEN_DOCUMENT/TREE/CREATE_DOCUMENT, MIME/local-only/caps, opaque IDs, persistable flags theo quyền picker trả về, rename và export bản sao. Không tự mở picker khi chưa có thao tác người dùng; cancel/scan failure giữ bộ tệp cũ. Không sửa `DocumentStore`, `Policy` hoặc thuật toán file I/O.

## 3. Security audit và phần cố ý giữ nguyên

- JavaScript/DOM storage cần cho renderer/settings; vẫn bật. Không `addJavascriptInterface`; chỉ MessagePort với page/origin/nonce và giới hạn command sẵn có. Không thêm bridge op/quyền file.
- File/content URL access, file-to-file/universal access, mixed content, network load, geolocation, cookies, popup permission đều tiếp tục bị chặn theo cấu hình hiện có. Navigation vẫn giới hạn entry URL và about frame được phép; Markdown không trở thành WebView history.
- Manifest **zero permissions**, backup/debug/cleartext đều tắt; WebView debugging tắt. CSP/hash, sandbox reader không chạy script, thư viện/font offline và license được kiểm tra trong APK validation.
- Không thêm analytics, request runtime hoặc recovery server. Đây là kiểm tra source/packaging và hồi quy, không phải kết luận penetration test trên thiết bị.
- Giữ nguyên toàn bộ web production source/asset so với đầu vào P2D:12 theme, custom CSS, font, Markdown/render/source spans, search/replace, source/inline/IME/composition/undo P2C, tree/prev-next, tên file, draft RAM và nội dung chưa lưu.
- Chưa sửa native textZoom100/scaling contract, Settings layout, icons/copy/motion, Android instrumentation cũ, persistence hoặc undo xuyên process. Không thêm WebView.saveState để tuyên bố phục hồi draft.

## 4. Danh sách file P2D

1. **Sửa** [MainActivity.java](../../app/src/main/java/vn/markread/local/MainActivity.java): native theme/dialog/fallback, cutout, Back/lifecycle guards và xử lý lỗi SAF nêu trên.
2. **Mới** [NativeUiPolicy.java](../../app/src/main/java/vn/markread/local/NativeUiPolicy.java): palette, Back result/error mapping, readiness expression, PageState thuần Java.
3. **Mới** [NativeUiPolicyTest.java](../../tests/NativeUiPolicyTest.java):82 JVM policy/contrast/fixture/state checks.
4. **Mới** [native-ui-check.mjs](../../tests/native-ui-check.mjs): tạo fixture từ web, compile/chạy JVM test và xuất đúng readiness expression để browser kiểm tra; không download hay thêm dependency.
5. **Mới** [native-compatibility-ui.cjs](../../web/tests/native-compatibility-ui.cjs):23 renderer/MessagePort failure and recovery checks.
6. Báo cáo này.

So inventory trước P2D, **chỉ MainActivity.java trong các file có sẵn thay đổi**; các file mới được liệt kê riêng. P0/P1/P2A/P2B/P2C, Manifest/Gradle/resources, dependency/lockfile và APK ký sẵn không đổi.

## 5. Kết quả kiểm thử

**630 kế thừa chạy lại trước/sau, đều đạt:**

- P0:439; P2A:39; P2B:68; P2C:84.
- Node91. Browser suites: UI54, Revision62, Reading46, simulated Native27, Session17, Startup53, Foundations27, Accessibility68, Keyboard68, Keyboard-native simulation16.
- JVM Policy69, SessionPolicy7; APK validation25. Không đổi assertion hay số test kế thừa trong P2D.

**105 mới, đều đạt:**

- JVM NativeUiPolicy82: đủ12 ID/mapping theo fixture web; contrast text trên nền/panel và button label; malformed Back không exit; lỗi provider/regrant; PageState pause/resume/ready/recreate/dispose/destroy và stale probe.
- Browser host simulation23: thiếu/sai nonce rồi handshake trễ; dùng readiness script thật xuất từ Java; restore bị thu hồi quyền nhưng UI vẫn mở được; retry chọn scope; missing file, folder selection/rename/save failure, picker/save cancel, export Unicode đúng byte, custom CSS và draft còn nguyên. Context mới chỉ restore original source/settings, không nhận nhầm RAM draft là dữ liệu persisted.
- **Tổng735 PASS,0 FAIL.** Palette checker **2.220 PASS,0 FAIL**, đếm riêng; không cộng lại48 palette checks thuộc JVM82.

**Build và bundle:**

- `npm run build`: đạt. Android asset và `web/dist/MarkRead.html` cùng13.233.316 bytes, SHA-256 `8e90032a4afc44a82d8c2e5032cf7a562b314c207e4f3994ceb321e1bd119e89`, đúng bundle P2C.
- `node --check`:27 web source/test files và runner mới; CSS parse app.css/paper.css đạt.
- ECJ Java8 với android.jar API35, JVM tests, D8 min26, AAPT2 compile/link, zipalign/check: đạt. APK kiểm chứng không ký tại `build/ui-p2d/after/native/aligned.apk` qua25/25 validation, chứa renderer đúng hash, DEX/resources và zero permissions.
- **Gradle `assembleDebug` chưa chạy được:** đã gọi `.\gradlew.bat --offline assembleDebug`, wrapper trả9009 vì `JAVA_HOME` chưa đặt và Java không có trên PATH. Có JDK17 local để gọi ECJ/javac trực tiếp; Gradle8.9 distribution cache và SDK đầy đủ chưa cấu hình. Không tải/cài toolchain. Compile/package bằng ECJ/D8/AAPT2 không được gọi là Gradle build thành công.
- Verify chữ ký APK release có sẵn đạt. Không ký, cài hoặc phát hành APK P2D. APK release cũ giữ SHA-256 `5a0ee4e950df4ca30963b0669337b7ab731f7b65c493be35cde9f3fad6eefa90`; APK P2C-test giữ `2ee8b2bd430bf88e093b63c35998b8724892742fa1a32b4ae5e697fb185bd7e5`.
- Bằng chứng: `build/ui-p2d/RESULTS.json`, `before/`, `after/`, `palette-results.json`, `native-ui-check.log`. Browser chạy trong bản sao workspace để không ghi đè ảnh/log P2A–P2C. `git diff --check` đạt; inventory bảo toàn các file kế thừa.

Chạy lại test mới từ repo root với JDK và Playwright/Chrome có sẵn:

```powershell
node tests/native-ui-check.mjs
# Cấu hình NODE_PATH / MARKREAD_CHROMIUM theo runtime Playwright đã có trên máy.
node web/tests/native-compatibility-ui.cjs
```

Runner JVM dùng JAVA_HOME nếu có, tiếp đến JDK bundled hoặc PATH; không cài công cụ. Browser mặc định đọc `build/ui-p2d/ready-script.js`; có thể chỉ định `MARKREAD_READY_SCRIPT` khi đổi thư mục bằng chứng.

## 6. Rủi ro dữ liệu và giới hạn kiểm chứng

- **Không có adb/emulator/device khả dụng.** Chưa chạy Activity thật, native fallback/dialog/render-process failure, OS Back/gesture/IME, ContentResolver/grants/picker, rotation/recreation, lock/home/return hoặc process death trên Android. Không đưa forced renderer crash vào release.
- JVM82 chạy policy thuần Java, không thực thi Android View/Handler/Activity. Browser23 và các native-facing suites dùng MessagePort host giả lập; không chứng minh quyền SAF thật, queued picker guard, padding native, native focus hay hành vi lifecycle của OS.
- RAM draft/undo/selection/scroll chỉ tồn tại trong live JS heap theo contract hiện tại. Configuration changes được Manifest nhận thường giữ WebView, nhưng Activity/process recreation hoặc renderer chết vẫn có thể mất chúng. Không thêm autosave, serial hóa undo, thay đổi ngưỡng10 phút hoặc khẳng định restore mọi state.
- Manual restart/Close có thể bỏ RAM draft; UI cảnh báo trước hành động. Export đã gửi cho Android và lỗi write giữa chừng vẫn có semantics provider hiện tại; P2D không thêm atomic-write/rollback file. Hãy lưu bản sao trước khi thử lỗi/lifecycle.
- Timeout22s có thể ngắn với máy yếu/tài liệu lớn; Tiếp tục chờ giữ heap và request cũ. Chưa benchmark5MiB/5.000 file trên Android; không thêm polling khi app đã ready.
- Native button ripple/focus, OEM title resource, label ở font lớn, system bar contrast/enforcement, legacy26–29 insets và WebView100 còn phải đo trên thiết bị. Chưa tuyên bố TalkBack, font scaling200% hay IME tiếng Việt đã đạt chỉ từ source/SP và test Chromium.

## 7. Rollback và điều kiện chuyển P2E

Rollback riêng P2D: khôi phục **MainActivity.java** từ `build/ui-p2d/before-p2d.zip`; bỏ bốn file source/test mới ở mục4 (NativeUiPolicy, NativeUiPolicyTest, native-ui-check, native-compatibility-ui). Báo cáo có thể giữ làm lịch sử. Chạy lại build/native validation và baseline630. Không khôi phục toàn bộ repo từ HEAD vì P2C và các file kế thừa còn chưa commit. Web bundle phải tiếp tục có hash P2C `8e90032a...`; APK ký sẵn giữ nguyên.

Điều kiện review/chuyển P2E:

- Chủ dự án duyệt diff P2D, fallback có cảnh báo/chờ và semantics Back không phản hồi;735/palette2220 tiếp tục đạt.
- Trước nghiệm thu **Android compatibility**, chạy smoke trên API26/29 và30/35, WebView100/current, gesture và3-button, portrait/landscape/cutout, bàn phím mở/đóng, source/inline và composition tiếng Việt, native dialog48dp/font max/TalkBack. Xác nhận insets không kép và không lộ nội dung sau fallback.
- Thử Activity recreation/home/lock/process restart theo policy10 phút, session token và picker exclusion; xác nhận RAM draft chỉ mất ở boundary đã công bố. Kiểm thử provider quá cũ/missing/local asset/channel/renderer failure bằng môi trường test riêng, không thêm crash hook vào app.
- Thử SAF folder/subfolder/standalone, cancel/regrant/revoke/deleted/moved file, rename read-only, export write failure và picker đang mở khi renderer thay đổi. Xác nhận file gốc không bị P2D tự sửa/thu hồi ngoài contract.
- Cấu hình môi trường rồi chạy Gradle assembleDebug; nếu đóng APK test native, ký/verify bằng key phù hợp và chạy smoke artifact đó. APK P2C có sẵn chưa chứa thay đổi Java P2D.

**Hoàn tất phần triển khai và kiểm chứng local P2D; chờ review và native QA. Dừng tại đây, không triển khai P2E–P2G.**
