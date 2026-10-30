# P2F — MarkRead Responsive Layout & Typography

Ngày: **28/10/2026, Asia/Saigon**. Kiến trúc: Java Android + WebView + HTML/CSS/JavaScript. Hoàn tất phần triển khai P2F và kiểm chứng tự động/browser; các cổng Android thực tế bên dưới còn mở. **Dừng ở P2F.**

## 1. Đầu vào, phạm vi và baseline

Đã đọc tài liệu P0–P2E, [MASTER](../../design-system/markread/MASTER.md), [COMPONENTS](../../design-system/markread/COMPONENTS.md), [ACCESSIBILITY](../../design-system/markread/ACCESSIBILITY.md), [MOTION](../../design-system/markread/MOTION.md), [ICONS](../../design-system/markread/ICONS.md), [kế hoạch](IMPLEMENTATION_PLAN.md) và [checklist](REGRESSION_CHECKLIST.md). Áp dụng [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md): typography hierarchy, shrinkable children, long-token wrapping, viewport/layout và system controls. Tra cứu local `long token wrapping`; không thêm font hoặc tài nguyên mạng.

Git đầu vào ở HEAD `7fe84d0`, đã có nhiều thay đổi P2C/P2D/P2E chưa commit và tài liệu/asset/test chưa track. Không reset, stage hoặc commit; giữ nguyên cả file gốc ngoài phạm vi. Đã lập `build/ui-p2f/{git-before.txt,before-sha256.json,before-p2f.zip,ANALYSIS_BEFORE.md}` trước khi sửa ứng dụng.

Chạy mới baseline đầu vào: **907/907 PASS**, palette **2.220/2.220 PASS**. Renderer P2E đúng **13.260.933 bytes**, SHA-256 `12867a73b92b35a36cb5e18d50d71ea923a473a6f3f4e9542be2fbe23d833662`. Không dùng kết quả cũ thay cho lượt chạy này.

## 2. Bốn nhóm triển khai

### Nhóm 1 — Responsive shell

- Sidebar: drawer dưới **1024 CSS px**, tối đa320px và chừa48px ngoài drawer; sidebar cố định280px từ1024px. Chỉ điều kiện **chiều rộng** quyết định mode; thay đổi chiều cao do bàn phím không tự mở/đóng sidebar. Giữ state, isolation, đường Back/Escape, file hiện tại và focus logic P2B/C.
- Toolbar: một hàng khi workspace đủ680px, hai hàng compact112px khi hẹp hơn. Giữ tất cả nút, ID, handler, target48px, gap8px. Bỏ ảnh hưởng của breakpoint cũ821–909 gây hai hàng không cần thiết ở landscape. Không thêm hàng thứ ba hoặc menu thao tác mới.
- Outline: chỉ hiện trong mode đọc ở màn đủ1280px và cao600px; không đổi renderer, mục lục hay mode Split hiện có.
- Settings: dialog tối đa760px, cách viewport16px; panel là vùng cuộn có `min-height:0`. Desktop dùng nav200px + nội dung. Dưới720px hoặc cao dưới600px dùng một **HTML select native** với năm danh mục cũ, bên trên một panel chi tiết. Giá trị hiển thị bên ngoài select có thể wrap; select trong suốt vẫn là control thật có tên truy cập, lựa chọn và hit area đầy đủ. Chevron/trị hiển thị trang trí không lặp accessible name.
- `showSettingsSection()` dùng chung logic hiển thị cũ cho button và select; đồng bộ active/`aria-current`, option value và nhãn. Không lưu field mới. Khi resize làm đổi cách điều hướng, `:focus-within` giữ control đang focus hiển thị đến khi rời focus; không script di chuyển editor/caret.

Hai quyết định cụ thể hóa P1: dùng width-only cho sidebar, ưu tiên ràng buộc IME của yêu cầu P2F hơn điều kiện chiều cao dự kiến trong P1; dùng select native cho Settings compact để không tạo thêm popup/focus/Back model hoặc mở rộng thành redesign P3. Không thay đổi schema/lưu Settings.

Gate nhóm1: responsive114, Accessibility68, Keyboard68, Reading46 đạt; lưu9 ảnh cùng các điều kiện chụp trước/sau nhóm. Driver cũ được chuyển sang thao tác control danh mục đang hiển thị.

### Nhóm 2 — Typography và spacing

UI dùng font hệ thống offline, độc lập reader; role theo `rem`, root100%. Các token mới: `--mr-ui-font`, `--mr-ui-mono`, `--mr-type-body`, `--mr-type-label`, `--mr-type-caption`, `--mr-type-section`, `--mr-type-title`; spacing `--mr-space-{1,2,3,4,6}` và radius control10px/row12px/dialog20px tái dùng nhất quán.

- Body UI16/24, label/button14/20, caption/meta12/18, section18/24, title22/28 ở root100%. Weight400/500/600; tracking trung tính, chỉ title/brand có điều chỉnh nhẹ. File browser, menu, Settings, hint, status và guide cùng hierarchy.
- Source textarea16/26 monospace; CSS/export14/22 monospace. Không remount hoặc thay handler/editor model. Icon giữ24px, inline16px, stroke2, hit target48px từ P2E/B.
- Reader giữ **cả bốn font**, kể cả Merriweather nhúng offline; default18px, leading1.8, width860px và toàn bộ range/lưu lựa chọn cũ. Không nhân cỡ reader theo cỡ UI.
- Heading reader h1=1.8em, h2=1.4em, h3=1.2em; weight600, line-height1.35. Spacing paragraph/list tương đối cỡ chữ. Gutter20px ở320px,24px đến600px,48px khi rộng hơn; print vẫn padding0/max-width none. Giữ max-width do người dùng chọn.
- Hệ màu,12 theme, selected/disabled/focus và semantic tokens P2A giữ nguyên. Không đưa UI font vào stylesheet reader, không thêm font download.

Gate nhóm2: Typography36, Responsive114, Reading46, Icons61 đạt;9 ảnh được chụp để so với nhóm trước.

### Nhóm 3 — Overflow và adaptive controls

- Theme tiles dùng một hoặc hai cột tùy không gian/chữ; tối đa hai cột, label wrap, không ép chữ quá nhỏ. Fallback một cột nếu không hiểu công thức grid trong `@supports`.
- Font list có chiều cao tối đa50vh/dvh, cuộn riêng, label dài wrap; keyboard End vẫn đưa option cuối vào vùng nhìn thấy.
- Dialog header có thể tăng chiều cao theo chữ, body flex co được và cuộn; bỏ giả định header cố định110px. Giới hạn chiều cao có fallback `vh`, enhancement `dvh`; close button không bị co. Actions wrap, mô tả/label và controls có `min-width:0` phù hợp.
- Search: hàng tìm giữ input + hai nút48px. Ở màn hẹp, input thay thế chiếm một hàng riêng, hai thao tác thay ở hàng tiếp; màn rộng dùng cùng hàng. Panel cuộn riêng trong45vh/dvh. Đã sửa selector cũ `#findbar input` ép ô nhập còn100px. Không đổi search worker, keybindings hay replace logic.
- Tên file/folder wrap theo token dài. Giữ nguyên cây thực tế và thứ tự; chỉ ngừng tăng **thụt lề trình bày** sau cấp thứ ba để nhánh sâu còn chỗ đọc. Không cắt nhánh hoặc viết lại recursion.
- Pre/table/math đã có local overflow đúng: **giữ cơ chế đó**, không sửa parser/KaTeX/highlight. Kiểm chứng lại ở reader32px và đủ sáu chiều rộng; math vẫn `nowrap`, code giữ khoảng trắng, không có horizontal scroll toàn bài.

Không thêm global `overflow:hidden` hoặc `word-break:break-all`, resize listener/ResizeObserver, container-query dependency, safe-area padding hoặc Android inset owner thứ hai.

Gate nhóm3: Overflow146, Responsive114, Typography36, Reading46, Keyboard68 đạt. Bao gồm cây năm cấp/tên dài ở chữ200%, chọn file thực từ cây, source/caret/selection/undo/redo còn đúng sau reflow;9 ảnh nhóm3 lưu trong build.

### Nhóm 4 — Visual QA và tích hợp

Đã xem trực tiếp cặp Settings320px Light, reader393px Dark, landscape844×390, sidebar360px, search412px Sepia, Settings800×393 và typography393px ở200%. Xem contact sheet đủ12 theme, không phát hiện thêm lỗi cần mở rộng phạm vi. Chữ, alignment, target, radius, focus, selected/disabled tiếp tục qua bộ test P2A–E. Không thêm animation hoặc sửa icon ở nhóm này.

## 3. File thay đổi, so với đầu vào P2E

Source ứng dụng chỉ bốn file:

- [app.css](../../web/src/app.css): ba khối P2F cuối file; layout, typography, overflow/fallback.
- [paper.css](../../web/src/paper.css): khối metrics reader cuối file.
- [shell.html](../../web/src/shell.html): select danh mục, ID panel, class hàng replace; giữ ID/semantics/handlers cũ.
- [app.js](../../web/src/app.js): đổi media query sidebar và dùng chung selection danh mục; không sửa editor/file/render/bridge.

Generated: [Android index.html](../../app/src/main/assets/index.html), đồng bộ byte với ignored `web/dist/MarkRead.html`.

Test mới: [layout-helpers.cjs](../../web/tests/layout-helpers.cjs), [responsive-ui.cjs](../../web/tests/responsive-ui.cjs), [typography-ui.cjs](../../web/tests/typography-ui.cjs), [overflow-ui.cjs](../../web/tests/overflow-ui.cjs). Helper không phải dependency/runtime ứng dụng và không được cộng thành một test.

Chín driver cũ đổi action để chọn danh mục responsive: `accessibility-ui`, `foundations-ui`, `icons-ui`, `keyboard-ui`, `native-ui`, `reading-ui`, `revision-ui`, `session-ui`, `ui` trong `web/tests/`. Giữ nguyên số assertion từng suite. Hai assertion thu hẹp về đúng font control: Revision chỉ cấm native select trong section Typography; Accessibility đếm selected option trong `#fontOptions`, vì Settings category nay cũng có option hợp lệ. Không bỏ kiểm tra dữ liệu/chức năng để đạt baseline.

Thêm báo cáo này và [bằng chứng P2F](../../test-results/ui-p2f/). `build/ui-p2f/integrity.json` xác nhận chỉ15 đường dẫn đã có thay đổi so với snapshot, bao gồm hai bundle và chín driver; không mất file.68 file native/theme/bridge/icon/dependency/tài liệu được kiểm tra hash giữ nguyên. Diff so với HEAD còn chứa công việc giai đoạn trước, không được quy tất cả cho P2F.

## 4. Kiểm thử cuối

[RESULTS.json](../../test-results/ui-p2f/RESULTS.json) lưu số đếm; raw logs trong `build/ui-p2f/{before,after}`. Không cộng lại các smoke test từng nhóm.

- **907 kế thừa PASS,0 FAIL:** Node132; browser592; JVM158 (Policy69, SessionPolicy7, NativeUiPolicy82); APK validation25.
- Browser592: UI54, Revision62, Reading46, Native simulation27, Session17, Startup53, Foundations27, Accessibility68, Keyboard68, Keyboard-native simulation16, Native-compatibility simulation23, Icons61, Icon-states70.
- **296 mới PASS,0 FAIL:** Responsive114 + Typography36 + Overflow146. Tổng cuối **1.203 PASS,0 FAIL**.
- **Palette2.220 PASS,0 FAIL**, đếm riêng; đủ Dark, Light, Sepia, OLED, Tokyo Night/Light, Blue Gray, Nord, Dracula, Rosé Pine, Forest, Gruvbox. Test render cũng kiểm tra type roles cả12 theme và interaction/icon state trên12 theme.
- **8 xác minh artifact riêng đạt:** bundle đồng nhất;68 protected files; hai APK ký cũ nguyên hash; APK không thêm/bớt entry; renderer packaged đúng source; các entry khác gồm DEX/resources/notices đồng nhất; syntax39 JS/build/test files; parse hai CSS. `git diff --check` đạt.

Ma trận responsive:320×568,360×800,393×852,412×915,600×960,800×1280 và568×320,800×360,852×393,915×412,960×600,1280×800. Font UI mô phỏng100/150/200% tại320×568,393×852,800×393,1280×800; reader tối đa32px ở320/360/393/412/600/800. Kiểm tra height-only350px giữ drawer/filter focus/caret; source và CSS textarea giữ node, selection/draft sau resize. Đây là **CSS viewport/root-font simulation**, không phải IME hoặc fontScale Android.

Custom CSS: giữ thứ tự style cuối cùng; override gutter/max-width/h1/paragraph vẫn thắng base reader. Không sửa sanitizer, font/theme storage/defaults hoặc native appearance; custom CSS vẫn có thể tự tạo layout khó dùng nếu người dùng yêu cầu như vậy. Không vô hiệu hóa override bằng `!important` mới.

Lỗi trung gian đã xử lý: ô replace còn100px do specificity cũ; assertion selected-option trước đây đếm cả select danh mục mới. Một số lượt setup copy workspace thiếu bundle/ready-script, không chạy được suite; bổ sung đúng generated fixture rồi chạy lại đạt. Các lượt lỗi setup/chẩn đoán không được tính PASS và không che lỗi ứng dụng. Log kết quả cuối nằm ở `after`; nguyên nhân này không đòi sửa native hoặc renderer.

Lệnh tái hiện với toolchain đã có:

```powershell
node web/build.mjs
Copy-Item web/dist/MarkRead.html app/src/main/assets/index.html
node --test web/tests/*.test.mjs
# NODE_PATH = runtime local đã chứa Playwright; MARKREAD_CHROMIUM = Chrome local.
node web/tests/responsive-ui.cjs
node web/tests/typography-ui.cjs
node web/tests/overflow-ui.cjs
# Chạy đủ13 suite browser kế thừa kể trên; native-compatibility cần ready-script
# sinh từ NativeUiPolicyTest, hoặc trỏ MARKREAD_READY_SCRIPT đến output đó.
```

Lượt này chạy browser tests trong workspace copy để không ghi đè ảnh/log P2A–E. Không thêm Playwright vào package/dependency. Fixture/undo là hành vi browser thực; MessagePort vẫn chỉ mô phỏng host Android.

## 5. Screenshot và điều kiện chụp

**9 ảnh trước +9 sau**, tên file khớp nhau trong [before](../../test-results/ui-p2f/before/manifest.json) / [after](../../test-results/ui-p2f/after/manifest.json):

1. 320×568 / Light / Settings Typography /100%.
2. 360×800 / Dark / sidebar mở /100%.
3. 393×852 / Dark / reader /100%.
4. 412×915 / Sepia / find “đọc”, kết quả đã sẵn sàng, input đang focus /100%.
5. 600×960 / Light / Settings CSS /100%.
6. 800×393 / Dark / Settings Editing /100%.
7. 844×390 / Dark / reader landscape /100%.
8. 800×1280 / Light / reader tablet /100%.
9. 393×852 / Dark / Settings Typography /root UI200%, reader18px.

Ví dụ đối chiếu: [Settings trước](../../test-results/ui-p2f/before/320x568-light-typography-1x.png) / [sau](../../test-results/ui-p2f/after/320x568-light-typography-1x.png); [landscape trước](../../test-results/ui-p2f/before/844x390-dark-reader-1x.png) / [sau](../../test-results/ui-p2f/after/844x390-dark-reader-1x.png); [chữ200%](../../test-results/ui-p2f/after/393x852-dark-typography-2x.png).

Thêm12 ảnh Settings Appearance393×680,100%, đủ12 theme: [manifest](../../test-results/ui-p2f/themes/manifest.json), [contact sheet](../../test-results/ui-p2f/themes-contact.png). Ảnh stage1/2/3 trong ignored `build/ui-p2f/group{1,2,3}/screenshots/` phục vụ gate từng nhóm; không trộn vào bộ trước/sau cuối.

[Provenance](../../test-results/ui-p2f/CAPTURE_ENVIRONMENT.json): Chromium156.0.8078.49 Windows qua Playwright; DPR1, desktop CSS viewport, `isMobile:false`, `hasTouch:false`, reduced-motion, native-channel gỡ để chạy browser mode. Cùng fixture Markdown Việt từ `layout-helpers.cjs`, Mermaid tắt. Không giả lập Android bằng screenshot này; các browser suite kế thừa có touch/host simulation riêng nhưng cũng không phải thiết bị thật.

## 6. Android build và integrity

ECJ Java8/API35, D8 min26, AAPT2 compile/link, zipalign/check,158 JVM và25 APK checks đạt. Unsigned verification APK ở `build/ui-p2f/after/native/aligned.apk`; **chưa ký/cài/phát hành APK P2F**. Hai APK ký sẵn trong dist không thay đổi; P2C-test cũ không chứa P2D–F.

Đã thử `./gradlew.bat --offline assembleDebug`: môi trường mặc định trả9009 vì JAVA_HOME/PATH thiếu Java. Thử tiếp với JDK17 local và GRADLE_USER_HOME trong workspace: wrapper thiếu distribution8.9 nên vẫn cần bootstrap ZIP, dừng với `SocketException: Permission denied: getsockopt` trong môi trường chặn mạng. Lượt thử đặt proxy localhost để tránh tải dependency ra mạng; không tải/cài distribution/SDK/dependency mới. Log `after/{gradle-assembleDebug.log,gradle-local-jdk.log}`. **Chưa đạt Gradle assembleDebug**; compile/package trực tiếp không thay thế kết quả đó.

HTML:13.260.933→**13.272.195 bytes**, tăng11.262 bytes (~0,085%). Hai bundle cuối cùng cùng SHA-256 **`dd43198eec05a7ea72b5d00958042d5ac444fd1851a9f0cc3a59b5c323f58c11`**. Unsigned APK cùng pipeline:7.143.365→7.145.728 bytes, tăng2.363 bytes (~0,033%). Entry renderer nén tăng đúng2.363 bytes; tất cả entry còn lại nguyên byte.

Không đổi Java, NativeUiPolicy, Manifest/resources, bridge, grants/SAF, lifecycle/recovery, build configuration, dependency lockfiles,23 SVG/provenance/licenses hay tài liệu P0–P2E.

## 7. Renderer, hiệu năng và giới hạn còn mở

Không sửa parse/render/search worker/syntax highlight/KaTeX, debounce, iframe lifecycle, composition guard, textarea undo, autosave hoặc file logic. Không thêm observer/timer/resize handler/animation runtime. Chỉ CSS layout/metrics và một control Settings cùng đường chọn panel cũ; không thêm node cho từng đoạn Markdown. Chưa benchmark tài liệu5MiB/5.000 file trên Android; không tuyên bố cải thiện CPU/latency từ ảnh hoặc số byte.

Cơ chế cũ vẫn khôi phục **pixel scroll** khi render lại cùng tài liệu; thay font/gutter/viewport có thể đổi đoạn văn nằm tại pixel đó. Không thêm semantic-anchor restoration vì cần thay renderer/editor ngoài phạm vi. Tests Reading kiểm chứng đường giữ scroll hiện có; không hứa bảo toàn chính xác cùng từ sau mọi reflow.

Chưa có emulator/device/adb khả dụng. **Chưa xác minh** Android WebView100/current, TalkBack/accessibility tree native, bàn phím cứng, IME tiếng Việt/composition thực, OEM fontScale/display scaling/DPR, cutout/gesture/IME insets, lifecycle/recovery thực và SAF provider/grant/rename/export. UI rem200% không chứng minh Android SP/fontScale; reader pixel-size preference vẫn là cơ chế người dùng đang có. Native select popup cần kiểm chứng trên WebView100; CSS có fallback nhưng lần chạy browser này là Chromium156.

Ở cực hẹp/chữ lớn/landscape, nhiều control nằm dưới vùng cuộn local; chúng phải cuộn đến được, không cần giảm chữ. Toolbar vẫn hai hàng trên điện thoại để giữ target48px; không đánh đổi bằng nút nhỏ. Full tên file còn trong danh sách/accessible name/rename; title toolbar tiếp tục ellipsis như trước. Tên dài và cây sâu đã có test riêng, không hạ giới hạn scan32 cấp.

## 8. Rollback và các bước sau

Rollback **riêng P2F**: khôi phục bốn source, chín driver và Android asset liệt kê ở mục3 từ `build/ui-p2f/before-p2f.zip`; bỏ bốn test/helper mới nếu không giữ test lịch sử. Có thể giữ report/screenshots làm bằng chứng. Rebuild/copy renderer, chạy lại907 +palette; bundle phải trở về hash `12867a73...`. Không reset về HEAD, không thay Java/P2C–E, keys/APK, file gốc không liên quan hoặc xóa toàn bộ test-results.

Đề xuất P3, **chưa triển khai**: redesign information architecture Settings nếu cần nhiều setting hơn; overflow toolbar một hàng có phân cấp thao tác rõ; semantic reader anchor khi reflow với phân tích caret/IME đầy đủ; native fontScale metadata có calibration; long-document profiling trên Android trước khi cân nhắc virtualization. Không thay editor chỉ để phục vụ bố cục.

Điều kiện chuyển P2G:

- Người dùng duyệt kết quả/ảnh P2F và cấp phạm vi P2G; không tự chuyển.
- Giải quyết hoặc chấp nhận rõ giới hạn Gradle và các cổng thiết bị; chạy smoke Android cho six widths/orientation, bàn phím/font/display scaling, IME Việt, caret/undo/scroll, TalkBack, SAF và lifecycle/insets.
- Không có regression nghiêm trọng ở907 cũ/296 mới,12 theme, custom CSS,23 SVG; giữ mọi hạn chế P2D/E chưa được kiểm chứng.
- Mọi motion tương lai tuân thủ reduced-motion/cancel/final state, có kiểm thử độc lập; P2F không tích hợp Motion.
