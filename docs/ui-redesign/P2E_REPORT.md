# P2E — MarkRead Lucide Icon System

**28/10/2026 · Quiet Ink · MarkRead1.1.5 /115 · hoàn tất triển khai local, chờ review.**

Đã chuyển icon chức năng web sang **23 Lucide SVG tĩnh**, không thêm dependency/framework hoặc request runtime. **907/907 kiểm tra tự động đạt**:735 kế thừa +172 mới; palette **2.220/2.220**. Đã đóng gói APK kiểm chứng không ký bằng ECJ/D8/AAPT2; chưa có Gradle build thành công hoặc thử Android thật. Dừng trước P2F.

## 1. Đầu vào và baseline

- Đối chiếu [AUDIT](AUDIT.md), [FILE_MAP](FILE_MAP.md), [BASELINE](BASELINE.md), [REGRESSION_CHECKLIST](REGRESSION_CHECKLIST.md), P1 [MASTER](../../design-system/markread/MASTER.md), [COMPONENTS](../../design-system/markread/COMPONENTS.md), [ICONS](../../design-system/markread/ICONS.md), [ACCESSIBILITY](../../design-system/markread/ACCESSIBILITY.md), [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md) và các báo cáo P2A–[P2D](P2D_REPORT.md). Phạm vi chính G6/A12 về icon, giữ G1/G3 focus/semantics và target P2B.
- Áp dụng [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md), Quick Reference icon-context, labels, contrast, focus, touch và consistency. Hai truy vấn local về decorative icon/accessible label trả kết quả quá rộng/khác icon cần dùng; không dùng chúng làm bằng chứng chọn asset. Quyết định cụ thể dựa vào P1, Quick Reference và SVG chính thức đã đọc/kiểm tra. Yêu cầu Lucide của người dùng ưu tiên hơn gợi ý Phosphor/React trong skill.
- Kiến trúc giữ **Java Android + WebView, HTML/CSS/JavaScript thuần**. Không sửa Java/bridge/SAF, renderer Markdown, source spans, font/theme/preferences hoặc motion.
- Git đầu vào HEAD `7fe84d0`, có P2C/P2D tracked/untracked kế thừa. Snapshot `build/ui-p2e/before-p2e.zip`, hash inventory `before-sha256.json`, `git-before.txt` và `ANALYSIS_BEFORE.md` được tạo trước sửa. Không reset, stage/commit hoặc dọn file chưa rõ nguồn gốc.
- **Chạy mới trước sửa:735/735 đạt**, palette2220 đạt. Gồm P0:439, P2A:39, P2B:68, P2C:84, P2D:105. Bundle đầu vào khớp P2C/P2D `8e90032a4afc44a82d8c2e5032cf7a562b314c207e4f3994ceb321e1bd119e89`.

## 2. Inventory và mapping cuối cùng

Mỗi mục ghi **cũ → Lucide → vị trí → state/ưu tiên**. Control tương tác tiếp tục có default, pressed, keyboard focus/focus-visible và disabled khi thực sự vô hiệu; selected/expanded chỉ theo state thật. Glyph trang trí không tự có selected hoặc handler.

1. `☰` → **menu** → `#menu`; expanded theo drawer, focus/pressed; **cao**.
2. Folder SVG1.7 → **folder-open** → `#openMenu`, `#openFolder`; primary/on-accent hoặc menu foreground, expanded của trigger; **cao**.
3. Document SVG1.7 → **file-text** → `#openFiles`; menu item mặc định/pressed/focus; **cao**.
4. Chevron SVG1.7 / text-only khối trước → **chevron-left** → `#prevFile`, `#blockPrevious`; disabled tại biên hoặc khi đang sửa khối; **cao**.
5. Chevron SVG1.7 / text-only khối sau → **chevron-right** → `#nextFile`, `#blockNext`; disabled theo trạng thái điều hướng thật; **cao**.
6. Search SVG1.7 và `⌕` → **search** → `#findToggle`24px, filter decoration16px; expanded ở nút tìm, input giữ accessible label riêng; **cao**.
7. Download SVG1.7 / export link text-only → **download** → `#download`, `#exportLink`; focus/pressed, giữ nghĩa **lưu bản sao Markdown**, không hứa ghi đè nguồn; **cao**.
8. Gear19px/1.7 → **settings** → `#settings`; mở dialog như cũ; **cao**.
9. Ba chấm fill → **ellipsis-vertical** → `#modeToggle`; expanded/menu, tên theo mode hoặc công cụ unified; **cao**.
10. `⇅` → **arrow-up-down** → `#sortOrder`; `aria-pressed`/màu selected theo descending thật; **cao**.
11. `×`, text-only đóng/hủy → **x** → drawer, find, bốn dialog close, `#forget`, block cancel/close; nhãn riêng giữ nghĩa từng thao tác, Gỡ tệp không là Trash; **cao**.
12. `✓`, text-only Hoàn tất → **check** → theme/font/mode selection và `#blockEdit` khi đang sửa; check24px, aria-pressed/selected/checked hoặc label Hoàn tất vẫn do control sở hữu; **cao**.
13. Chevron SVG1.7/native disclosure marker → **chevron-down** → Mở/font24px và folder summary16px; expanded/open, giữ native details/summary; **vừa**.
14. `↑` → **arrow-up** → `#findPrev`; disabled/kết quả trước, khác điều hướng tệp; **cao**.
15. `↓` → **arrow-down** → `#findNext`; disabled/kết quả sau; **cao**.
16. Nhãn Đọc → thêm **book-open** → menu `[data-mode=read]`; giữ visible label và menuitemradio/checked; **vừa**.
17. Nhãn Nguồn → thêm **code-xml** → menu `[data-mode=edit]`; giữ visible label và checked; **vừa**.
18. Nhãn Chia đôi → thêm **columns-2** → menu `[data-mode=split]`; giữ breakpoint/checked hiện có; **vừa**.
19. Nhãn chọn/sửa khối, đổi tên → thêm **pencil** → `#chooseBlock`, `#blockEdit`, `#renameSubmit`; chuyển sang check khi hoàn tất khối hoặc loader trong rename busy; **vừa**.
20. Nhãn Sao chép → thêm **copy** → `#copyExport`; giữ clipboard/select fallback và feedback; **vừa**.
21. Nhãn Hướng dẫn → thêm **info** → `#help`; không gán Info cho mọi toast vốn có thể báo lỗi; **phụ**.
22. Error text-only → thêm **triangle-alert**16px → cạnh `#findError`, `#renameError`; chỉ hiện khi error text không rỗng, semantic error color, text/role alert vẫn nguyên; **cao**.
23. Busy text-only → thêm **loader-circle** → startup status16px, rename submit24px; theo trạng thái loading có sẵn, **glyph tĩnh**, không thêm spinner animation hoặc timer; **vừa**.

**Cố ý giữ nguyên:** brand `mr`, launcher sách Android, MD/TXT/extension metadata, `Aa`/`.*` cùng nhãn Hoa/thường/Regex, dấu draft có accessible name và progress/switch/checkbox native. Settings category buttons, CSS controls, replace actions, toast/feedback thuần chữ không bị gắn icon tùy tiện. Mermaid/SVG do tài liệu sinh và icon OS/SAF/native fallback thuộc lớp khác; không chuyển chúng thành Lucide.

## 3. Kiến trúc asset, nguồn và license

- Pin **Lucide0.468.0**, commit **`f12b0de177fbc2a6795e99be065887e72b237123`**. Cả23 tên P1 tồn tại ở revision này, không dùng alias phỏng đoán. [SVG nguồn](https://github.com/lucide-icons/lucide/tree/f12b0de177fbc2a6795e99be065887e72b237123/icons) được copy nguyên byte vào `web/icons/lucide/`.
- [manifest.json](../../web/icons/manifest.json) ghi tên, file, URL revision, SHA-256/bytes và nguồn license. Pin cố định phục vụ reproducibility, không tuyên bố đây là release Lucide mới nhất.
- `.gitattributes` trong riêng `web/icons/` giữ nguyên byte SVG/license khi Git checkout trên Windows; tránh `core.autocrlf=true` đổi LF thành CRLF làm sai upstream SHA. Không thay Git config toàn repo. Kiểm tra notice dạng text chấp nhận LF/CRLF tương đương.
- [icon-registry.mjs](../../web/icon-registry.mjs) chạy **build-time**, kiểm hash, viewBox24, kích thước24, fill none, currentColor, stroke2/round và whitelist hình học. Reject script, href/use, event/style/id, nested/empty/malformed SVG hoặc hash lệch. Đây là validator hẹp cho subset tin cậy, **không phải sanitizer để nhập SVG người dùng**.
- Builder mở rộng `__ICON_name__` ở shell và dùng loader text `.svg` có sẵn của esbuild cho các import SVG tường minh. Placeholder không giải quyết được làm build fail. Không npm install, runtime createIcons scanner, sprite ID, external use, icon font, fetch hoặc CDN. Hướng static SVG phù hợp [Lucide Static](https://lucide.dev/guide/static).
- [icon-markup.js](../../web/src/icon-markup.js) chỉ chấp nhận tên trong registry, thêm `.mr-icon`, `data-icon`, `aria-hidden=true`, `focusable=false`. [icons.js](../../web/src/icons.js) tạo các decoration động từ SVG đã review. Tên file/tài liệu/user CSS không được chèn vào SVG markup; tên thư mục và label vẫn dùng text node/textContent.
- License nguyên bản [Lucide ISC](../../web/icons/LICENSE-lucide) và [Feather MIT](../../web/icons/LICENSE-feather) có hash/source trong manifest. Feather notice lấy từ v4.29.2, commit `1b002399e8758fb2bccea4d07312dc9e0f43dcb8`, giữ đúng copyright/permission nguồn. Lucide có các icon kế thừa Feather như [trang license chính thức](https://lucide.dev/license) ghi nhận.
- Hai notice đầy đủ có trong comment của HTML tự chứa và được **append** vào Android `THIRD_PARTY_NOTICES.txt`; phần notices cũ bảo toàn nguyên byte. APK chỉ chứa HTML/notices như trước, không chép thêm whole library hoặc raw SVG directory vào assets.
- Mạng chỉ dùng khi vendoring nguồn/giấy phép trong development. Build tiếp theo và runtime dùng file local; không có kiểm tra update hoặc tải icon khi mở app.

## 4. Styling, migration và giữ hành vi

- Token mới: `--mr-icon-size:24px`, `--mr-icon-size-inline:16px`, `--mr-icon-stroke:2`. ViewBox luôn24×24, width/height bằng nhau, `flex:none`, stroke currentColor, round caps/joins. Decoration inline16 là ngoại lệ P1 có chủ đích; không thu nhỏ nút chính.
- SVG kế thừa token foreground từ control; selected/error/disabled theo P2A và palette hiện tại. Không hardcode màu glyph, đổi stroke/scale khi press, gradient/glow/shadow icon hoặc animation mới. Open-chevron transition cũ và reduced-motion hiện có giữ nguyên; disclosure folder đổi góc tức thì theo native open state.
- Target48 CSSpx của P2B được giữ, không hit-slop chồng lấn. Icon được căn giữa; icon–label gap8. Không dùng kích thước SVG để thay đổi native density hay suy luận dp từ DPR.
- Menu mode tăng min-width156→224px, có max-width theo viewport để chứa icon24 + nhãn + check24. Đây là chỉnh fit cục bộ của component; header/sidebar/Settings layout, breakpoints và thứ tự DOM không được thiết kế lại.
- `setIconLabel` chỉ cập nhật glyph/nhãn con khi thực sự đổi. Button, ID, listener, role, disabled/busy, focus và input/editor node được giữ. Không thêm event handler vào SVG; pointer đi tới control, không tạo nested interactive elements.
- Thực hiện theo tám nhóm: toolbar → sidebar → file browser → Settings → search → reader/editor controls → dialogs/context menu → startup/error. Mỗi nhóm build và chạy lại các assertions liên quan trước nhóm kế tiếp; log `stage1`–`stage8` trong `build/ui-p2e/`. Assertions lặp giữa các stage **không cộng thêm** vào tổng test mới.
- Hướng dẫn chỉ đổi các tham chiếu glyph đã thay (☰, ⇅, ‹/›, ↓, ×, ⋮) thành tên control thật. Không xử lý các lỗi copy/TXT/version khác của P0 trong P2E.

## 5. File thay đổi và dependency

**Bảy file có sẵn thay đổi so với đầu vào P2E:**

- [shell.html](../../web/src/shell.html): icon placeholders, label/check wrappers, decoration cạnh errors và tham chiếu icon trong hướng dẫn; giữ ID/names/roles.
- [app.css](../../web/src/app.css): token/icon geometry, căn giữa/gap, check/disclosure/error styling và fit menu.
- [app.js](../../web/src/app.js): import helper, theme check/folder chevron, presentation của label đổi tên và sửa/hoàn tất khối. Không đổi handler logic, read/write/export/source/mode/session policy.
- [build.mjs](../../web/build.mjs): load/verify subset, expand shell SVG/license và loader text SVG. CSP vẫn do builder tính từ script cuối.
- [revision-ui.cjs](../../web/tests/revision-ui.cjs): chỉ sửa tọa độ một thao tác click ngoài popup; xem mục6.
- [Android index.html](../../app/src/main/assets/index.html): generated renderer mới, không sửa tay. `web/dist/MarkRead.html` ignored cũng đồng bộ byte.
- [THIRD_PARTY_NOTICES.txt](../../app/src/main/assets/THIRD_PARTY_NOTICES.txt): append nguồn/version/ISC/MIT; không xóa notice cũ.

**File mới:**27 file trong `web/icons/` (23 SVG +manifest +2 licenses +gitattributes); ba module `web/icon-registry.mjs`, `web/src/icon-markup.js`, `web/src/icons.js`; ba test `icons.test.mjs`, `icons-ui.cjs`, `icon-states-ui.cjs`; báo cáo này. Mapping từng SVG có trong manifest và mục2.

**Dependency thêm:0.** Package/lockfile, Java/P2D, bridge, Manifest/Gradle/resources/launcher, paper.css/keyboard/tokens/themes/preferences/core/workspace/search/native modules, P0/P1/P2A–P2D và hai APK ký sẵn giữ nguyên hash. DEX trước/sau P2E cũng khớp byte. Git diff với HEAD vẫn chứa thay đổi P2C/P2D kế thừa; dùng snapshot P2E để phân biệt.

## 6. Kiểm thử và offline packaging

**735 kế thừa, chạy mới trước và sau, đều đạt:**

- Node cũ91; browser UI54, Revision62, Reading46, Native simulation27, Session17, Startup53, Foundations27, Accessibility68, Keyboard68, Keyboard-native simulation16, P2D compatibility simulation23.
- JVM Policy69, SessionPolicy7, NativeUiPolicy82; APK validation25.
- Lượt tích hợp đầu có timeout ở Revision: test click tâm h1 để đóng menu, nay tâm h1 bị menu icon rộng hơn phủ lên. Đã đổi **chỉ action** thành click gần góc trái h1, một điểm thực sự ngoài popup. Giữ assertion “reader tap dismisses toolbar menu”,62 assertions và toàn bộ test dữ liệu. Không force click, bỏ test hoặc thay handler để vượt test. Chạy lại Revision và các suite kế tiếp đều đạt; log timeout ban đầu được giữ riêng.

**172 mới, đều đạt:**

- [icons.test.mjs](../../web/tests/icons.test.mjs):**41** Node cases — đúng23 tên/revision/hash/imports, root/style/decoration, tên không hợp lệ,12 SVG không an toàn/không tương thích, license packaging. Node tổng **132=91+41**.
- [icons-ui.cjs](../../web/tests/icons-ui.cjs):**61** browser assertions — đủ các nhóm UI,24/16px, names/aria-hidden/focusable, default/pressed/release/focus/disabled/selected, sort/menu/folder/font/search/error, block label transitions, dialog/context-menu và exact export. Đủ23 tên xuất hiện với SVG không rỗng, không IDs/links/scripts, không requests icon ngoài mạng.
- [icon-states-ui.cjs](../../web/tests/icon-states-ui.cjs):**70** assertions — selected/currentColor/default/primary/disabled/focus/pressed trên cả12 theme; glyph24 giữa target48 ở320×568,360×800,390×844,600×960,844×390,1280×800; không overlap/body overflow. Render proof cả23 SVG có geometry bounds khác0. Icon không đi vào reader/source.
- Suite states có **MessagePort host simulation** cho rename pending→error→retry→success: loader tĩnh/label/disabled/aria-busy đúng; trả pencil trên cùng button, mỗi submit chỉ có một request, source giữ nguyên. Đây không phải ContentResolver hay SAF thật.
- **Tổng cuối:907 PASS,0 FAIL.** Palette checker **2.220 PASS,0 FAIL**, đủ12 theme, đếm riêng. Không cộng stage smoke lặp, số cặp màu nội bộ hoặc các assertion con lần nữa.

**Build/artifact:**

- Renderer build đạt; JS syntax34 file và CSS parse app.css/paper.css đạt. CSP script hash/reader sandbox/network deny/font offline tiếp tục qua25 APK validations.
- ECJ Java8/API35, D8 min26, AAPT2 compile/link, zipalign/check đạt. APK **không ký** ở `build/ui-p2e/after/native/aligned.apk`; không gọi build/sign release hoặc thay file `dist/`.
- **7 kiểm tra artifact bổ sung đạt**, đếm ngoài907: renderer/notice trong ZIP khớp source; notice cũ giữ nguyên prefix; đủ23 icon/offline placeholders đã giải quyết; đầy đủ hai giấy phép trong HTML/APK; không thêm asset entry cần tải ngoài; DEX native không đổi. Bằng chứng `artifact-checks.json`.
- **Gradle vẫn chưa chạy được:** gọi `.\gradlew.bat --offline assembleDebug`, wrapper trả9009 trước build vì JAVA_HOME/PATH chưa có Java. Có JDK local để gọi compile trực tiếp; không tải/cài Gradle/SDK mới. Thành công ECJ/AAPT2 **không thay thế Gradle build**, cũng không giải quyết hạn chế Android runtime từ P2D.
- Không có request icon/asset ngoài URL trang local trong browser tests. SVG inline không đổi trust/origin, CSP, WebView file access hoặc permission. Các URL trong XML namespace, provenance/notices không trở thành asset fetch.

Chạy test mới với toolchain/Playwright local đã có:

```powershell
npm --prefix web run build
# Đồng bộ web/dist/MarkRead.html sang Android asset theo pipeline hiện tại.
node --test web/tests/icons.test.mjs
# Cấu hình NODE_PATH/MARKREAD_CHROMIUM theo runtime Playwright local.
node web/tests/icons-ui.cjs
node web/tests/icon-states-ui.cjs
```

Log/checksums tại `build/ui-p2e/{before,after,RESULTS.json,artifact-checks.json}`. Test chạy trong workspace copy để không ghi đè ảnh/log giai đoạn cũ. Ảnh mới12 trước +12 sau, cùng390×844, fixtures, reduced-motion và Dark/Light/Sepia/OLED; đã xem trực tiếp cặp sidebar Dark và Settings Light, icon rõ/đúng vị trí, selected check và close không làm tràn/cắt control. Không coi screenshot desktop là ảnh Android.

## 7. Dung lượng và hiệu suất

- HTML/Android asset: **13.233.316→13.260.933 bytes**, tăng **27.617 bytes (~0,209%)**. SHA-256 cuối hai file giống nhau: **`12867a73b92b35a36cb5e18d50d71ea923a473a6f3f4e9542be2fbe23d833662`**.
- Notices asset:250.472→252.772 bytes, tăng2.300 bytes. Registry/SVG/license nguồn trong `web/icons/` tổng17.350 bytes; thư mục này không được copy nguyên vào APK.
- Cùng pipeline unsigned/zipalign: APK **7.138.817→7.143.365 bytes**, tăng **4.548 bytes (~0,064%)**. HTML nén tăng4.135 bytes, notice nén tăng413 bytes; DEX không đổi. Đây là so sánh APK kiểm chứng trước/sau P2E, không phải kích thước APK ký/phát hành.
- Icon được inline/static import, không request mạng, hydration scan, whole-document observer hoặc timer riêng. Chỉ các node công cụ/check/folder dùng SVG; mỗi file MD/TXT vẫn là nhãn text, không thêm SVG trên từng dòng file hoặc từng đoạn Markdown.
- Không thay parse/render/debounce/iframe của bài dài. Thêm một decoration trên mỗi folder làm tăng node theo số folder; chưa profile5.000 mục/5MiB trên Android. Không tuyên bố cải thiện CPU/latency hoặc benchmark Android từ số byte/screenshot desktop.

## 8. Rủi ro, rollback và cổng P2F

**Chưa thực hiện:** Android thật/emulator, WebView100/current Android, TalkBack/physical keyboard/IME tiếng Việt, density/display/font scaling thực, native insets/lifecycle/renderer recovery và SAF provider/grants. Browser/MessagePort không chứng minh các hành vi OS này. Chưa ký/cài APK P2E; APK P2C-test cũ không chứa P2D/P2E.

Menu rộng hơn che một phần reader khi mở theo semantics popup bình thường; đã giữ đường đóng bằng trigger/Escape/Back và click ngoài. Label dài/font lớn có wrap; native max text/TalkBack còn là cổng thiết bị. User CSS tiếp tục chỉ ảnh hưởng reader, không được dùng để style icon shell hoặc native; parser/CSS limitations P2B giữ nguyên.

Rollback riêng P2E: khôi phục bảy file có sẵn ở mục5 từ `build/ui-p2e/before-p2e.zip`; bỏ `web/icons/`, ba module icon mới và ba test mới của P2E. Có thể giữ report làm lịch sử. Rebuild/copy renderer, chạy lại735 và palette; bundle phải về `8e90032a...`. Không reset toàn repo về HEAD vì sẽ mất công việc P2C/P2D chưa commit; không đụng Java/keys/APK ký sẵn hoặc file gốc không liên quan.

Điều kiện nghiệm thu/chuyển P2F:

- Chủ dự án duyệt mapping23 icon, label/check/error presentation, fit menu224px và một action test được chỉnh vì geometry.
- 907/palette2220, offline/CSP/license/package checks tiếp tục đạt; không có icon thiếu/rỗng, nhãn trùng, pressed bị giữ sai hoặc target bị thu nhỏ.
- Trước kết luận tương thích/phát hành Android: thử icon/contrast/focus ở12 theme, WebView100/current, touch/long-press/TalkBack, actual48dp/font lớn và các workflow mở/sửa/search/rename/export/CSS/SAF trên thiết bị. Cấu hình môi trường và chạy Gradle, ký/verify APK test đúng key nếu chuẩn bị bản cài.

**Dừng tại P2E. Không triển khai P2F/P2G hoặc đổi launcher.**
