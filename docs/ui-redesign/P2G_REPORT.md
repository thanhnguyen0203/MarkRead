# P2G — Quiet Ink motion & micro-interactions

**28/10/2026 · hoàn tất triển khai P2G, dừng trước P3.** Java Android + WebView + HTML/CSS/JavaScript; không thêm dependency, Motion JS, framework, gesture hoặc preference mới. Android runtime vẫn **chưa được xác minh**.

## 1. Đầu vào và phạm vi

Đối chiếu tài liệu P0–P2F đã đọc trong phiên làm việc, đặc biệt [MASTER](../../design-system/markread/MASTER.md), [COMPONENTS](../../design-system/markread/COMPONENTS.md), [MOTION](../../design-system/markread/MOTION.md), [ACCESSIBILITY](../../design-system/markread/ACCESSIBILITY.md), [P2F](P2F_REPORT.md), [Build Gate](ANDROID_BUILD_GATE.md) và [kế hoạch](IMPLEMENTATION_PLAN.md). Giải quyết phần motion G7/A13 cùng feedback A10, header A11 và cờ reduced motion native từng được dự kiến trong G8. Không triển khai lại typography/scaling hoặc redesign Settings.

Sử dụng [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md), Quick Reference animation/accessibility/performance và tra cứu local `reduced motion interruption`: trạng thái/focus tức thì, ít vùng chuyển động, hủy an toàn và không scroll-jacking. Không áp preset/framework/Phosphor thay23 Lucide hiện có.

Git đầu vào ở HEAD `7fe84d0`, có công việc P2C–F/Build Gate chưa commit và nhiều file untracked. Đã lưu trạng thái, inventory452 file và `build/ui-p2g/before-p2g.zip`; không reset, stage, commit hoặc dọn file người dùng. **Chạy mới trước sửa:1.203/1.203 PASS, palette2.220/2.220 PASS.** Renderer đầu vào khớp P2F `dd43198e...`; APK debug đầu vào `4ccc28bd...` được giữ trong snapshot và `build/ui-p2g/before/MarkRead-P2F-debug.apk`.

## 2. Motion system đã áp dụng

Token khai báo một chỗ trong CSS; WAAPI đọc duration/easing từ token, không duy trì một bảng thời gian khác:

- `none=0ms`, `press=80ms`, `fast=120ms`, `standard=160ms`, `enter=200ms`, `drawer=240ms`, `exit=140ms`, `drawer-exit=180ms`, `popover-exit=80ms` dưới prefix `--mr-motion-*`.
- `--mr-ease-standard:cubic-bezier(.2,0,0,1)`, enter `(0,0,.2,1)`, exit `(.4,0,1,1)`.
- Menu/section/find dịch4px; dialog8px; toast8px; drawer theo chiều rộng thực. Không scale chữ, icon hoặc iframe. Không dùng spring vì không có gesture cần spring.
- Tách **trạng thái nghiệp vụ** khỏi **trang trí**: hidden/open, expanded/selected/checked, focus, busy và kết quả file không chờ animation. Controller chỉ giữ một animation WAAPI trên mỗi surface; animation cũ bị cancel khi thay thế. Finish/cancel callback chỉ dọn reference, không đóng UI hoặc sửa dữ liệu.
- Không tween width/height/padding/font; không transition toàn viewport/Markdown. Các rule mới chỉ liệt kê property cụ thể. CSS legacy còn trong file nhưng bị cascade mới ghi đè ở các component đã chuẩn hóa.

### Nhóm 1 — Controls và startup

Button dùng tint80ms khi nhấn, release/hover120ms; hover vẫn chỉ fine pointer. Không thêm class pressed hoặc handler thay thế click: browser sở hữu `:active`, release/touchCancel/keyboard theo native behavior. Selected và disabled giữ semantics/style cũ; disabled không animate. Focus outline hiện ngay, không nằm trong transition property.

Switch track/thumb và chevron160ms. Checked/expanded thay đổi ngay; glyph/stroke/target không đổi. Folder vẫn details/summary; không animate hàng loạt file/paragraph.

Startup status giữ **800ms**, chuyển từ CSS keyframe sang timer nghiệp vụ và visibility tĩnh. Reduced motion không làm status mất hoặc hiện sớm, không phụ thuộc `animationend`. Timer được hủy khi startup hoàn tất; handshake/search/session/toast deadlines giữ nguyên. Nếu bundle không khởi chạy, recovery vẫn dựa vào watchdog native hiện có; không thêm script bootstrap hoặc timeout recovery mới.

Gate nhóm1:46 kiểm tra mới, Keyboard68, Icon-states70, Reading46 đạt. Thiếu manifest icon trong workspace test đầu tiên là lỗi setup copy; bổ sung fixture rồi chạy lại, không sửa asset để né kiểm tra.

### Nhóm 2 — Surfaces, drawer, feedback và theme

- Settings/help/export/rename: `showModal()` và focus có hiệu lực ngay, enter opacity + translateY8px/200ms. Input/keydown/compositionstart hủy trang trí trên ancestor để không tiếp tục di chuyển field đang nhập. Native cancel/Back vẫn đóng thật ngay.
- Settings category: chỉ panel mới enter120ms/4px; panel cũ hidden ngay và hủy effect cũ. Không reparent field, thêm route hoặc thay category select native của P2F. Settings vẫn content-sized như P2F; không tween chiều cao khi nội dung panel khác nhau.
- Open/mode/font menus: enter120ms/4px, roving focus và ARIA đồng bộ ngay kể cả mở bằng ArrowDown. `bindPopup` thêm callback trang trí tùy chọn; mọi binding cũ vẫn dùng cùng logic.
- Drawer: enter CSS240ms, exit WAAPI180ms từ vị trí hiện tại; scrim160/120ms. Khi đóng, main được giải phóng và focus trả ngay, sidebar bị isolate/inert hoặc fallback tabindex/ARIA ngay. Chỉ hình ảnh sidebar tiếp tục exit; không còn role modal hoặc target nhận pointer. Breakpoint đổi sẽ settle/cancel chuyển động và trả trạng thái fixed/drawer thật.
- Search/Replace: panel enter120ms/4px, focus vào input ngay; không animate count/match/caret hoặc worker. Đóng vẫn tức thì. Reader reflow do panel mở giữ cơ chế P2F; không tween layout.
- Context menu/long-press file hiện tại mở **rename dialog**, nên được hưởng enter của rename. Không tạo context-menu mới hoặc đổi550ms long press. Fix một guard close-event của rename: close event cũ không được xóa target của dialog vừa mở lại; kiểm tra rapid cancel→F2→submit đạt.
- Toast: enter200ms/8px, exit140ms; thông báo vẫn4.5s, repeated feedback đặt lại timer cũ, không steal focus. Busy icon rename vẫn tĩnh, không thêm spinner quay vô hạn/snackbar mới.
- Theme: shell/reader palette tiếp tục đổi **atomic** theo pipeline cũ. Color transition trên control tạm bị tắt trong hai paint frame khi commit palette; selected check cung cấp feedback120ms. Rapid theme chọn kết quả cuối, không tween các cặp foreground/background giữa12 palette, không crossfade toàn bài hoặc thêm render chỉ để animation.

**Quyết định exit có chủ đích:** dialog/menu/find đóng thật ngay; phản hồi đóng menu nằm ở chevron, không giữ popup invisible hoặc delay focus/Back. [MOTION §3](../../design-system/markread/MOTION.md) cho phép dialog “close tức thì nếu cơ chế closing ảnh hưởng Back/keyboard”. Baseline cũng yêu cầu `.isHidden()`/Back đồng bộ. Token popover-exit80ms được khai báo nhưng không cưỡng bức áp vào hidden popup. Không tạo DOM clone/snapshot của input hoặc trì hoãn native close chỉ để có fade-out. Drawer/scrim/toast có exit thật vì không cần giữ modal trap hoặc semantic state mở.

Gate nhóm2: surface suite ban đầu96; hoàn thiện cleanup/pagehide nâng lên98. Accessibility68, Keyboard68, Reading46, Responsive114 đạt. Phát hiện trì hoãn CSS visibility làm lộ sidebar ở breakpoint: đã thay bằng visual exit WAAPI cho thao tác đóng chủ động, đóng breakpoint vẫn hidden tức thì. Không sửa assertion của test cũ.

### Nhóm 3 — Reduced motion và native adapter

Kết quả là **media query OR native flag**, không dùng native false để ghi đè media true. Tắt CSS animation/transition, smooth scroll và auto-hide header; UI hiện ngay ở state cuối. Giảm motion khi đang mở UI cancel effect đang chạy; không reload reader, đổi focus, text selection hoặc draft. Pagehide/visibility hidden dọn WAAPI và frame commit theme. Không rAF loop khi idle từ module mới.

Android đọc `Settings.Global.ANIMATOR_DURATION_SCALE` lúc tạo page và return/onResume;0 yêu cầu tắt motion. API là setting float, default1 theo [Android reference](https://developer.android.com/reference/android/provider/Settings.Global#ANIMATOR_DURATION_SCALE). Không ghi setting, xin permission, lưu appearance hoặc poll nền. Lỗi đọc dùng media-query fallback.

`MotionPolicy` chỉ tạo boolean literal: startup root attribute trước first paint và event host→page khi resume. Chỉ evaluate trên trusted page; không thêm MessagePort operation/JavaScriptInterface hoặc API file. Thêm một call vào onResume để đồng bộ cờ, không đổi PageState, nonce, recovery, session, URI/grants hoặc navigation lifecycle policy.

Iframe nhận cùng cờ lúc dựng HTML/onload và update trực tiếp khi preference đổi; giữ nguyên document/textarea đang sống. Custom CSS vẫn ở cuối stylesheet. Reduced rules dùng `!important` cho animation/transition/smooth scroll nhằm tắt chuyển động; không ép lại font/màu/gutter của user. CSS tùy biến có selector/`!important` mạnh hơn cần review riêng, không tự xóa CSS người dùng.

Pure JVM13 kiểm tra policy/script, browser kiểm tra mọi tổ hợp native/media và chạy chính script do Java xuất. Đây là **mô phỏng adapter**, không phải đã chạy `Settings.Global`/WebView trên Android thật. Gate nhóm3: reduced suite48 ban đầu, bổ sung live media interruption thành52; Startup53, Keyboard-native16, Native-compatibility23, Reading46 đạt.

### Nhóm 4 — Tích hợp, focus guard và visual QA

Ca kiểm tra cuối tái hiện toolbar bị auto-hide khi vẫn có keyboard focus trên nút. Đã thêm một điều kiện eligibility `:focus-visible` để giữ header hiện; không đổi offset/scroller/progress algorithm hoặc thêm time-based easing cho scroll. Ca mới làm reduced suite cuối thành**53**. Chạy lại regression và build trên bundle cuối sau fix, không lấy lượt1.412 trước đó làm kết quả cuối.

Xem ảnh Settings enter, drawer enter/exit,12 theme và typography200%; giữ layout/type/icon P2F. Không sửa thêm bố cục hoặc hiệu ứng từ kết quả ảnh. Không animate native select popup, OS SAF picker, native AlertDialog hoặc nội dung Markdown.

## 3. File sửa và tạo

Production có sẵn:

- [app.css](../../web/src/app.css): tokens, control feedback, reduced rules, drawer/scrim/toast cascade.
- [app.js](../../web/src/app.js): gọi controller/showDialog, popup/category/find hooks, startup timer, drawer isolation, atomic theme, reduced relay/header guard và guard rename-close cũ.
- [keyboard.js](../../web/src/keyboard.js): optional callback của bindPopup; không đổi key/IME logic.
- [shell.html](../../web/src/shell.html): startup native boolean và status visibility; giữ IDs/event targets.
- [paper.css](../../web/src/paper.css): chỉ reduced-motion rules, không đổi reader metrics.
- [MainActivity.java](../../app/src/main/java/vn/markread/local/MainActivity.java): read-only setting, startup substitution và resume notification.

Production mới: [motion.js](../../web/src/motion.js), [MotionPolicy.java](../../app/src/main/java/vn/markread/local/MotionPolicy.java).

Tests mới: [motion-controls-ui.cjs](../../web/tests/motion-controls-ui.cjs), [motion-surfaces-ui.cjs](../../web/tests/motion-surfaces-ui.cjs), [motion-reduced-ui.cjs](../../web/tests/motion-reduced-ui.cjs), [MotionPolicyTest.java](../../tests/MotionPolicyTest.java).

Generated: [Android index.html](../../app/src/main/assets/index.html), ignored web/dist bundle và debug APK. Thêm báo cáo này, [bằng chứng P2G](../../test-results/ui-p2g/).443 file đầu vào còn lại giữ nguyên hash; mọi test kế thừa, tài liệu P0–P2F/Build Gate, build scripts/version/dependencies/Manifest/resources,23 SVG/registry/licenses và APK release/P2C giữ nguyên. Diff so với HEAD vẫn chứa công việc cũ; không quy các thay đổi đó cho P2G.

## 4. Kết quả kiểm thử cuối

[RESULTS.json](../../test-results/ui-p2g/RESULTS.json), raw logs `build/ui-p2g/{before,group1,group2,group3,after}`:

- **1.203 kế thừa PASS,0 FAIL**, không sửa file test/assertion kế thừa: Node132 +browser888 +JVM158 +APK baseline25.
- **210 mới PASS,0 FAIL**: Controls46 +Surfaces98 +Reduced/keyboard-header53 +JVM MotionPolicy13.
- **Tổng1.413 PASS,0 FAIL**. Không cộng lại smoke từng nhóm, fixture-generator assertions, hoặc diagnostic thất bại đã sửa.
- **Palette2.220 PASS,0 FAIL**, đếm riêng; đủ12 theme. Icon suites61/70 và Node icon subset nằm trong baseline, xác minh23 SVG offline/stroke/geometry/accessibility names.
- **18 kiểm chứng APK Gradle debug đạt**, đếm ngoài1.413: variant/ID/version/SDK, debuggable, launcher, permissions, backup/cleartext, signature/alignment/CRC, renderer/notices/DEX/no secrets, CSP/sandbox/font offline.
- Syntax43 JS/build/test files; parse app.css/paper.css đạt; renderer web/Android byte-identical; `git diff --check` đạt. Không thêm/sửa package hoặc lockfile.

Các ca mới bao gồm12 theme press/release/focus, native touchCancel, disabled, startup800ms dưới cả hai media preferences; rapid dialog/menu/category/drawer/rename/theme/toast; Escape/focus restoration, breakpoint, không WAAPI/không native inert; pagehide, preference đổi khi đang enter; editor node/caret/selection/scroll/draft và custom CSS; header dưới wheel với keyboard focus.

Diagnostic đã xử lý: drawer visibility/a11y ở breakpoint; stale rename close; header keyboard focus. Các kiểm tra timeline dùng polling trạng thái kết thúc thay vì giả định wall-clock240ms luôn tương đương200ms animation khi browser đang chịu tải. Hai setup/checker issue (thiếu icon manifest; kiểm fallback không lọc visibility) được sửa trong harness mới; không hạ test cũ hoặc thay semantics để báo PASS.

Để chạy test mới, dùng JDK/Playwright/Chrome local đã có, không thêm dependency vào project:

```powershell
New-Item -ItemType Directory -Force build/ui-p2g/policy-classes | Out-Null
$jdk = Get-ChildItem toolchain/jdk -Directory -Filter 'jdk-17*' |
  Sort-Object Name -Descending | Select-Object -First 1
& "$($jdk.FullName)/bin/javac.exe" -encoding UTF-8 -d build/ui-p2g/policy-classes `
  app/src/main/java/vn/markread/local/MotionPolicy.java tests/MotionPolicyTest.java
& "$($jdk.FullName)/bin/java.exe" -cp build/ui-p2g/policy-classes `
  vn.markread.local.MotionPolicyTest build/ui-p2g/motion-scripts.json
# NODE_PATH/MARKREAD_CHROMIUM trỏ Playwright và Chrome local.
node web/tests/motion-controls-ui.cjs
node web/tests/motion-surfaces-ui.cjs
node web/tests/motion-reduced-ui.cjs
```

## 5. APK và build

Đã chạy [Build-AndroidDebug.ps1](../../scripts/Build-AndroidDebug.ps1) `-Offline -RerunTasks` ngoài sandbox theo Build Gate. Bundle cuối: **BUILD SUCCESSFUL in28s,31 actionable tasks,31 executed**. Không đổi Gradle8.9/AGP8.7.3/JDK17 hoặc dùng pipeline thủ công thay kết quả Gradle.

[APK debug P2G thực tế](../../app/build/outputs/apk/debug/app-debug.apk):

- **7.598.666 bytes**; SHA-256 **`689a3c58c0112c770970df7f8e124203a7b76567ba2e1e61d1822864f7788f22`**.
- applicationId `vn.markread.local`, version1.1.5/code115, min26/target35/compile35, debug certificate cũ của Build Gate, signature v2/alignment được xác minh. Không giả đây là APK ký release hoặc mặc định cài đè bản release khác certificate.
- Renderer **13.279.607 bytes**, SHA-256 **`1d1a55efcb320e64c38f5a5a0b8ea28847b99c00a72bc4087606893e7d9c74e6`**. So với P2F tăng7.412 bytes (~0,056%); APK tăng3.168 bytes (~0,042%).
- Không thêm/bớt ZIP entry. Chỉ `classes2.dex` và `assets/index.html` đổi so với APK P2F; native policy/adapter là thay đổi DEX có chủ đích. Manifest/resources/notices và các entry khác giữ nguyên. Credentials không gói vào APK.

## 6. Visual evidence và giới hạn đo

[Capture environment](../../test-results/ui-p2g/CAPTURE_ENVIRONMENT.json): Windows Chromium156.0.8078.49/Playwright, DPR1, CSS viewport, desktop mode, Mermaid tắt, native-channel gỡ cho browser branch. Không phải screenshot Android.

- 9 trước + 9 sau: 320×568 Light Typography; 360×800 Dark sidebar; 393×852 Dark reader; 412×915 Sepia search; 600×960 Light CSS; 800×393 Dark Editing; 844×390 Dark landscape; 800×1280 Light reader; 393×852 Dark Typography/root text200%. Cùng source fixture/settings; reduced-motion để so layout ở state cuối. [Before manifest](../../test-results/ui-p2g/before/manifest.json), [After manifest](../../test-results/ui-p2g/after/manifest.json).
- 12 theme 393×680/static: [contact sheet](../../test-results/ui-p2g/themes-contact.png).
- 9 mốc motion 393×852/Dark/no-preference: Settings 0/80/200ms, drawer enter 0/120/240ms, drawer exit 0/90/180ms. [Contact sheet](../../test-results/ui-p2g/motion-frames-contact.png), [manifest/state](../../test-results/ui-p2g/motion-frames/manifest.json). Animation được **pause và đặt currentTime** có chủ đích để kiểm tra hình ảnh; đây không phải video realtime/FPS benchmark.

Không có tuyên bố60 FPS, p95 input latency hoặc long-task budget Android đã đạt. Chưa profile tài liệu gần5MiB/5.000 file trên thiết bị. Module không quét block/list mỗi frame, không observer mới, không animation Mermaid/paragraph, không scale iframe; chỉ Map các surface đang animate và hai rAF commit palette. ResizeObserver/progress/scroll geometry cũ giữ nguyên; không tuyên bố đã tối ưu reflow margin-bottom của header.

## 7. Còn thiếu, rủi ro và rollback

`adb devices -l` chạy lại: **danh sách trống**. Chưa cài/chạy APK, chưa Android WebView100/current, TalkBack, IME Việt thật, native animator scale0, density/font/display scaling, lifecycle/recovery hoặc SAF provider/grants/rename/export trên thiết bị. Pure JVM và browser host-event/CDP simulations không thay thế các ca này. Không cài/uninstall/xóa dữ liệu app người dùng.

Fallback: thiếu/không dùng được WAAPI thì state vẫn đúng và UI tĩnh; native setting không đọc được thì dùng media query; native false không đảo ngược media true. Reduced state không được persist. Android đọc cờ lúc mở/return, không theo dõi liên tục setting khi app đang foreground. Cần kiểm tra mapping OS/OEM và hành vi event thực trước khi coi reduced native đã nghiệm thu trên Android.

Settings/search còn reflow theo kích thước nội dung/layout P2F; P2G chỉ tránh thêm layout tween. Pixel-scroll restoration và mọi hạn chế fontScale/custom CSS/P2D–F vẫn giữ; không hứa semantic reading anchor sau mọi reflow. Dialog/menu/find exit tức thì là lựa chọn focus/Back an toàn đã nêu, không thêm snapshot của field/source để che việc đóng.

Rollback riêng P2G: khôi phục sáu production file có sẵn ở mục3 và Android generated asset từ `build/ui-p2g/before-p2g.zip`; bỏ motion.js/MotionPolicy.java và bốn test mới nếu không giữ test lịch sử. Có thể giữ report/evidence. Rebuild renderer/copy asset, chạy lại1.203 +palette; hash renderer phải về `dd43198e...`. Có APK debug P2F nguyên bản trong snapshot/backup, không cần ký release hoặc đụng khóa. Không reset repo về HEAD vì sẽ mất P2C–F/Build Gate chưa commit.

P2G dừng để người dùng đánh giá. Cổng Android runtime còn mở; **không tự triển khai P3**, không biến các cải tiến header geometry/Settings/fontScale/long-document profiling thành scope ngầm của lượt này.
