# MarkRead — bản đồ source và toàn bộ bề mặt UI

Mốc: `a41a13a5e0e437a83fcd89b6f193292b5fdda9b1`, 27/10/2026. Đường dẫn dưới đây tính từ gốc repository. Số dòng tham chiếu bản này; `app.css` và `paper.css` chứa nhiều rule trên một dòng nên cần dùng cả selector/tên hàm để tìm.

## 1. Bản đồ kiến trúc

- `app/src/main/java/vn/markread/local/MainActivity.java` — Activity Java duy nhất, dựng root/WebView, insets, origin interceptor, message port, picker, preference/session, export, native dialogs, Back và lifecycle. Không chứa layout đọc bằng Compose.
- `app/src/main/java/vn/markread/local/DocumentStore.java` — snapshot SAF, BFS scan tree, metadata/pagination/read chunk, rename provider, import CSS. Không vẽ UI; lỗi tiếng Việt được đưa lên renderer.
- `app/src/main/java/vn/markread/local/Policy.java` — origin/provider/name/extension/size/chunk policy; không UI.
- `app/src/main/java/vn/markread/local/SessionPolicy.java` — ngưỡng phiên 600.000ms; không UI.
- `web/src/shell.html` — toàn bộ cấu trúc HTML shell, menu, input, dialog, placeholder startup/CSP; dòng 18–55 là phần UI chính.
- `web/src/app.js` — điều phối UI và nghiệp vụ renderer, state trong memory, source/draft, parser/sanitizer, iframe, search worker, bridge integration. UI và logic hiện chung trong một module; sửa DOM phải tránh đụng invariant dữ liệu.
- `web/src/app.css` — style shell, responsive, states, settings, toolbar, progress. Có lớp CSS cơ sở ở dòng 1 và các override tích lũy ở dòng 4–160.
- `web/src/paper.css` — style bên trong reader iframe; Markdown, code/math/diagram/table, inline editor và search highlight. Không style shell.
- `web/src/themes.js` — 12 palette × 13 token: bg/text/heading/muted/accent/line/quote/code/syntax1/syntax2/panel/surface/selected.
- `web/src/preferences.js` — default/validation/migration appearance: Dark, sans, 18px, width 860, leading 1.8; Mermaid bật, unified/descending tắt.
- `web/src/workspace.js` — tree/order/navigation, source-span block editing và validate rename.
- `web/src/core.js` — local target/path, CSS parser, text decoding, raster magic, slug, giới hạn Mermaid/file.
- `web/src/search.js` và `search-worker.js` — tìm/thay thế trên source, UTF-16 offsets, Unicode regex; UI controls ở shell/app.
- `web/src/native.js` — Android detection/nonce/MessagePort, pending requests, `NativeFile`, snapshot pages, export streaming. Không tạo native view.

Không thấy `.kt`, `@Composable`, `res/layout`, Fragment, Navigation Component, React router, JSX/TSX hay module UI khác trong mã ứng dụng. Kotlin DSL chỉ ở build config.

## 2. Workspace và các màn/chế độ

Đây là **một Activity và một workspace**, không phải nhiều Android screen riêng. Các trạng thái và overlay bên dưới là toàn bộ bề mặt người dùng hiện có.

### W00 — Khởi động/khôi phục

- Công nghệ: native background + HTML status gate.
- Source: `MainActivity.java:82–128,313–325`; `shell.html:2–17`; `app.js:24–41,327–345,583–602`; `native.js:1–16`.
- Thành phần: `html[data-startup=pending]`, `#startupStatus` (role status), `#app[aria-busy]`, appearance meta, nền đã lưu; cảnh báo kênh Android sau 20s.
- Style/motion: inline style `shell.html:13`, fade `startup-status` 150ms sau 800ms; app ẩn bằng visibility tới khi restore và font bài đầu xong.
- Không có splash screen tùy biến độc lập trong source; phần launch trước Activity do Android quản lý.

### W01 — Chào mừng/chưa mở tài liệu

- Công nghệ: Markdown render trong reader iframe, cùng workspace.
- Source nội dung: `web/src/demo.md`; logic `app.js:51,225–239,475,595–602`.
- Trạng thái: chưa chọn scope, scope trống, scope hết hạn không có bài active, sau gỡ tệp hoặc restore lỗi. Tên hiển thị `Chào mừng.md`.
- Style: `paper.css`, `readerStyle()` + font/palette + CSS riêng; có demo math, Mermaid, bảng, code, checklist.
- `web/examples/Chao_mung.md` là tệp ví dụ cũ riêng, không được import vào runtime.

### W02 — Đọc tài liệu

- Công nghệ: HTML shell + iframe srcdoc.
- Source: `shell.html:27–37`; `app.js:241–345,436–446`; `paper.css`.
- Thành phần shell: `main`, header, `#readingProgress`, `#workspace`, `#readerPane`, iframe `#reader`, `#outline/#toc`.
- Thành phần bài: h1–h6 và anchor, đoạn/strong/em/del, list/task checkbox disabled, quote/hr, code/pre, bảng có `.table-wrap`, ảnh raster và `.blocked-image`, details/summary, KaTeX `.katex`, `.math-error`, Mermaid `.diagram/.diagram-error`, syntax classes `.hljs-*`, local links có `data-target/role=link/tabIndex=0`.
- Math/code/diagram xử lý trong parent trước khi chèn vào iframe. Heading outline chỉ h1–h3, outline ẩn ở ≤1150px. Link ngoài chỉ báo bị chặn.
- Motion: scroll smooth trong iframe (tắt khi reduced), auto-hide header bằng JS, tiến độ dùng scaleX, ảnh lazy/async. Không script do tài liệu chạy trong iframe.

### W03 — Nguồn toàn bài

- Công nghệ: `<textarea>` trong parent, không phải editor native hay CodeMirror.
- Source: `shell.html:37`; `app.js:447–452,560–561`; style `app.css:1` selector `#editorPane/#editor/.pane-caption/[data-mode=edit]`.
- Thành phần: nhãn MARKDOWN, textarea `#editor`, read/source menu ⋮. Font nguồn 14px monospace, Tab chèn hai space, render debounce 280ms, giới hạn byte 5MiB.
- Không có nút undo/redo riêng; hành vi nhập là textarea/browser. Không có toolbar định dạng Markdown riêng.

### W04 — Chia đôi

- Công nghệ: flex layout hai pane web, cùng source/state với W02/W03.
- Source: `shell.html:28,37`; `app.js:447–452`; CSS `[data-mode=split]` và `.desktop` ở `app.css:1`.
- Hiện menu Chia đôi ở >820px; ở mobile editorPane split bị ẩn bởi CSS. Outline bị ẩn trong split. Khi unified bật, mode bị ép về read và menu mode ẩn.

### W05 — Sửa từng khối/hợp nhất

- Công nghệ: DOM/textarea do parent tạo bên trong iframe.
- Source: `app.js:261–285,347–445`; `workspace.js:mappedBlocks/replaceBlock/editableBlockEnd`; `paper.css:2–4`.
- Thành phần: `.md-block[data-start][data-end]`, `.editing-block`, `.inline-editor`, `textarea.block-source`. Chỉ metadata do app chèn sau sanitize được tin cậy.
- Đổi khối tái dùng textarea đang focus, không load lại iframe; chuyển về bản đọc bằng tap ngoài/Ctrl+Enter, Escape hủy khối. Không còn `.inline-tools`, `.add-block` hay nút thêm đoạn.
- Layout: editor absolute theo khối, auto-size textarea, reserve chiều cao host, anchor/scroll được giữ; phụ thuộc `#paper` padding/font/custom CSS.

## 3. Sidebar, toolbar, menu và trạng thái phụ

### C01 — Thư viện/drawer

- Source: `shell.html:18–26`; `app.js:145–175,218–254,475,550–559`; style `#sidebar/.brand/.library-actions/.folder-caption/.file-search/.file-list/.folder-group/.file-row/#scrim`.
- Brand: logo chữ HTML `m` + `r`, tên MarkRead, tagline; không phải launcher icon.
- Mở: `#openMenu` có SVG folder, chevron, expanded; menu `#openOptions` gồm `#openFolder` và `#openFiles`.
- Scope: `#folderName`, sort `#sortOrder` (⇅/aria-pressed), gỡ `#forget` (×), filter `#fileFilter` và glyph ⌕.
- Tree: `details.folder-group > summary`, button.file-row với `.file-icon` chữ extension và `.file-label`; tệp active có `.active`/aria-current. Long press/F2/contextmenu để rename.
- Empty: chưa chọn file hoặc filter không có kết quả; folder caption/title thay theo scope. Thư mục rỗng không chứa tài liệu không được vẽ thành cây độc lập.
- Desktop sidebar 260, ≤1150px 230, ≥1500px 280; ≤820px drawer fixed rộng 280, scrim `#0008`, slide 200ms. Filter/collapse chỉ ảnh hưởng danh sách nhìn thấy.

### C02 — Header/công cụ đọc

- Source: `shell.html:28–29`; `app.js:56–103,106–109,148–160,163–215,447–475,562–564`; style `header/.document-title/.toolbar/.file-type/#filename/#dirty/#readingProgress/.mode-menu`.
- Controls: `#menu`, nhãn MD, `#filename` (long press/F2), `#dirty`; `#prevFile`, `#nextFile`, `#findToggle`, `#download`, `#settings`, `#modeToggle`.
- Mode menu `#modeOptions`: Đọc/Nguồn/Chia đôi, role menuitemradio và aria-checked; Escape/outside/Back đóng. Unified ẩn menu.
- Progress: role progressbar, 0–100, thanh 3px dùng selected/accent; theo scroller reader hoặc editor, kể cả resize. Được giữ ở đầu khi header ẩn.
- Motion: barOffset theo scroll intent, qua transform/opacity/margin-bottom; qua ngưỡng 72px mới ẩn khi cuộn xuống; focusin hiện lại, reduced motion giữ ổn định.

### C03 — Tìm/thay thế

- Source: `shell.html:30–36`; `app.js:476–542,575–581`; `search.js/search-worker.js`; style `app.css:134–140`, reader `mark.current/.search-block-current` trong `paper.css`.
- Controls: `#findInput`, `#replaceInput`, count/status `#findCount`, close/prev/next, replace one/all, `#findCase`, `#findRegex`, `#findError` alert, scope label “Trong mã Markdown”.
- States: hidden/open, empty query, count/current, zero match, case/regex selected, invalid regex, worker timeout, capped matches, stale result, replace busy/disabled.
- Keyboard Ctrl/Cmd+F/H, Enter/Shift+Enter điều hướng, Enter thay một và Ctrl/Cmd+Enter trong replace thay tất cả. Worker deadline 2.5s, debounce 140ms. Search căn theo source, highlight trong bài chỉ là ánh xạ hỗ trợ.

### C04 — Toast/status/draft

- Source: `shell.html:16,28,35,50,54–56`; `app.js:104–109` và các handler lỗi.
- `#toast`: role status/aria-live polite, hiện 4.5s, opacity/translate 200ms, fixed bottom24, z10. CSS feedback/export feedback/search status/rename alert ở tại chỗ.
- `status()` hiện không vẽ gì; CSS cho footer/status cũ còn trong stylesheet nhưng DOM không còn. Dấu dirty `●` thuộc header; không có persistent draft status bar.

## 4. Toàn bộ dialog web và nhóm cài đặt

### D01 — Cài đặt

- Source: `shell.html:44–52`; `app.js:42–49,116–130,543–549,564–573`; style `#settingsDialog/.settings-layout/.settings-nav/.settings-content/.settings-section`.
- `dialog.showModal()`, title/close, nav năm section với `.active/aria-current`, chỉ một section hiện. Desktop nav trái, nội dung phải; ≤600px nav cuộn ngang phía trên. Nội dung cuộn trong dialog.
- **Màu giao diện** `#section-appearance/#themes`: 12 button động, background/text/accent/line preview, checkmark, aria-pressed.
- **Font chữ & bố cục** `#section-typography`: `#font/#fontOptions` listbox và bốn option sans/serif/Merriweather/mono; `#fontSize` 12–32 step1; `#width` 480–1400 step20; `#lineHeight` 1.2–2.4 step.1; value badges. Font menu mở trong flow, không phải select native.
- **Đọc & chỉnh sửa** `#section-editing`: đúng **hai** switch `#unifiedEnabled`, `#mermaidEnabled`; hướng dẫn cách commit/cancel/export. Không còn switch nhớ cài đặt hay nhóm mode trùng lặp.
- **CSS riêng** `#section-css`: `#customCSS`, import/reset/apply, hướng dẫn selectors/giới hạn, `#cssFeedback`; nhập chưa áp dụng đến khi bấm Apply. Hidden `#cssInput` phục vụ browser; Android dùng bridge chooseCss.
- **Chung & hướng dẫn** `#section-general`: mô tả persistence/expiry/draft, version/stats, `#help`. Stats word/minutes bị ẩn CSS ở mobile.

### D02 — Hướng dẫn

- Source: `shell.html:53`; mở từ `app.js:564`; style `.dialog-head/.dialog-body/.prose/kbd` trong `app.css:1`.
- Nội dung: scope/SAF, cây và navigation, rename, ảnh/link, edit/export, session/forget, offline, size/encoding/WebView limits, shortcuts. Có nút đóng; có thể chồng trên Settings dialog. Chưa có aria-labelledby.

### D03 — Xuất tệp ở trình duyệt

- Source: `shell.html:54`; `app.js:454–473`; style `.export-link/#exportText/#copyExport`.
- Export Blob link `#exportLink`, copy `#copyExport`, textarea readonly `#exportText`, feedback `#exportFeedback`, close. Có fallback chọn/copy khi Clipboard thất bại.
- Chỉ browser dùng dialog này. Android `download()` đi thẳng nativeExport rồi ACTION_CREATE_DOCUMENT, không hiển thị D03.

### D04 — Đổi tên

- Source: `shell.html:55`; `app.js:162–215`; style `app.css:55–64,132–133`.
- Form label/input `#renameInput`, error alert, cancel/submit/close; input chọn phần basename, cho sửa cả extension; busy disable mọi input/button, đổi nhãn Đang đổi tên.
- Kích hoạt: giữ 550ms, cancel nếu dịch >10px, suppress synthetic click 800ms, contextmenu hoặc F2 ở tên/row. Android rename file thực qua provider; browser đổi metadata trong phiên.
- Native permission/collision/invalid errors giữ nguyên target/draft. Không có dialog xóa file thật.

### D05 — Xác nhận bỏ draft

- Source trigger: `app.js:225–228,475,550–551,582`.
- Thay bộ tệp, gỡ scope và beforeunload; `window.confirm`/beforeunload thuộc môi trường host. Android confirm được `WebChromeClient` chuyển thành AlertDialog. Không dùng một dialog HTML tùy biến riêng.

## 5. Native UI và màn hệ điều hành

- **N01 Root/insets/system bars** — `MainActivity.java:82–103,113,151,313–325`; Java FrameLayout/WebView, API30 systemBars|IME padding; API cũ dùng system insets. Appearance SharedPreferences chọn nền trước paint.
- **N02 WebView quá cũ** — `MainActivity.java:91–105`; TextView hướng dẫn cập nhật, text trắng18sp, padding native px, không icon/animation riêng.
- **N03 Renderer dừng** — `MainActivity.java:139–142`; AlertDialog không cancel bằng Back, Mở lại/Đóng, nhắc draft có thể mất.
- **N04 JS confirm/alert** — `MainActivity.java:144–146`; AlertDialog MarkRead với Xác nhận/Hủy hoặc Đóng. Từ confirm thay/gỡ scope hoặc JS alert; chỉ chấp nhận trang trusted.
- **N05 Thoát có draft** — `MainActivity.java:327–329`; Ở lại/Lưu bài đang mở/Thoát bỏ sửa. Chỉ lưu bài hiện tại, không ngầm lưu toàn bộ drafts.
- **N06 SAF thư mục** — `MainActivity.java:256–264,279–311`; ACTION_OPEN_DOCUMENT_TREE, local-only, read/write/persistable/prefix được yêu cầu, thực lưu đúng flags trả về.
- **N07 SAF tệp** — cùng khu vực; ACTION_OPEN_DOCUMENT, multiple, CATEGORY_OPENABLE/local-only; quyền bền vững khi provider hỗ trợ.
- **N08 SAF CSS độc lập** — `MainActivity.java:271–286`, `DocumentStore.java:140–162`; single-file/read/local-only, không commit scope mới.
- **N09 SAF lưu bản sao** — `MainActivity.java:207–215,265–290`; chunk export rồi ACTION_CREATE_DOCUMENT và output stream UTF-8. Hủy/quyền lỗi trả về renderer; không auto overwrite nguồn.
- **N10 Cảnh báo từ provider/permission UI** — hệ điều hành/provider sở hữu; app chỉ giới hạn local authority và hiển thị lỗi phục hồi. Không có runtime permission dialog Internet/storage vì manifest không yêu cầu quyền này.

## 6. Style, font, icon và motion assets

### Android resources

- `app/src/main/res/values/styles.xml` — AppTheme kế thừa platform Theme.Material.NoActionBar, sans, nền/system bars #202326, colorAccent #94CBB7; không bộ `values-night`, `colors.xml` hay `dimens.xml` riêng.
- `app/src/main/res/drawable/ic_background.xml` — shape launcher màu #202326.
- `app/src/main/res/drawable/ic_foreground.xml` — vector quyển sách 108dp, xanh #94CBB7 và nét nền đậm.
- `app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` — adaptive icon dùng hai drawable trên; cũng dùng làm roundIcon trong manifest.
- `app/src/main/res/xml/data_extraction_rules.xml` — backup/transfer exclusions; không phải style/UI nhưng phải giữ.
- `app/src/main/AndroidManifest.xml` — label/icon/theme, min26/target35, adjustResize, configChanges, RTL false, Back legacy; không permissions. Không animation XML, Lottie, icon library native hay layout XML.

### Web assets và icon inventory

- `shell.html` inline SVG: folder (Mở, Mở thư mục), document (Mở tệp), chevron (Mở và font), previous/next, search, download, gear, vertical dots. SVG thường 20×20, stroke1.7/round; gear19, dots fill. Icon decorative có aria-hidden; accessible name đặt ở button.
- Glyph ký tự trong shell: `☰` menu, `⇅` sort, `×` forget/close, `⌕` filter, `↑/↓` find navigation, `Aa`/`.*` search options, `✓` option/mode check. App.js tạo `✓` theme và `●` dirty. Extension badge là text MD/TXT/phần đuôi, không asset ảnh.
- Brand web là chữ cách điệu CSS, launcher là vector sách; hai dấu hiệu nhận diện khác nhau.
- Không có thư mục icon web/SVG sprite/icon font riêng; không thấy emoji dùng làm navigation chính. Mermaid sinh SVG từ nội dung, không phải thư viện icon shell.
- `web/fonts/Merriweather.woff2`, `Merriweather-Italic.woff2`, `OFL.txt` — font offline được base64 vào bundle. Inter/Georgia/Times/Consolas/SFMono trong stack là fallback, không được đóng gói. KaTeX WOFF2 lấy từ package đã khóa khi build.
- `web/examples/Doc_thoai_mai.css` — ví dụ CSS người dùng, không stylesheet shell mặc định.

### Motion inventory

- Startup status: CSS keyframes fade150ms delay800ms, `shell.html:13`.
- Sidebar: translateX200ms, scrim xuất hiện bằng display, `app.css:1` media820.
- Button: background/color/shadow160ms, transform120ms, pressed scale.97; primary brightness; `app.css:96–101`.
- Open chevron rotate180°/180ms, `app.css:107–108`.
- Switch: track/thumb màu và translate180ms, `app.css:47–51,127–130`.
- Toast: opacity/translate200ms, timer4.5s, `app.css:1,53`, `app.js:104`.
- Reader anchor: smooth scroll trong paper CSS; các tác vụ định vị nguồn/search/anchor phần lớn dùng instant.
- Toolbar auto-hide: requestAnimationFrame + scroll intent, offset/opacity liên tục, `app.js:74–103`, `app.css:155–156`; progress scaleX riêng.
- Inline editing: giữ/reflow host và source overlay theo ResizeObserver, không có tween chuyển khối; `app.js:356–425`.
- Dialog/menu không có animation entrance/exit tự viết khác; platform/UA có thể có hành vi riêng. Reduced motion coverage và khoảng trống xem AUDIT A13.

## 7. Build, cấu hình và artifacts

- `web/package.json`, `package-lock.json` — dependencies exact version; scripts build/test/audit. Không có Playwright trong dependency dự án.
- Bộ dependency được khóa: `css-tree3.2.1` (parse CSS), `dompurify3.4.17` (sanitize HTML/SVG), `esbuild0.28.2` (build), `highlight.js11.12.0` (code), `katex0.19.1` (math), `marked18.1.2` (Markdown), `mermaid12.2.0` (diagram). Package có cả build/runtime tool; không phải tất cả được thực thi bên trong iframe.
- `web/build.mjs` — esbuild app/worker, Mermaid UMD, KaTeX/font, CSP hash, shell/CSS → `web/dist/MarkRead.html`; còn tạo `web/.openai/hosting.json` phục vụ QA. Đây không phải renderer dev server.
- `app/src/main/assets/index.html` — bundle generated khoảng13.2MB, source phân phối vào APK; không sửa tay. Gradle dùng file đã check in, không tự gọi npm.
- `app/src/main/assets/THIRD_PARTY_NOTICES.txt`, `web/fonts/OFL.txt`, `LICENSE.txt`, `GRADLE_LICENSE.txt` — giấy phép/notices; không tự thay trong thiết kế.
- `build.gradle.kts`, `app/build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`, `gradle/wrapper/*`, `gradlew(.bat)` — AGP8.7.3/Gradle8.9/API35, Java source/target8, host JDK17; signing optional từ private.
- `build_apk.py` — pipeline SDK/ECJ/D8/AAPT2/zipalign/apksigner; tự rebuild/copy renderer nếu node_modules tồn tại; output1.1.5 hardcode. Có thể sinh khóa mới nếu thiếu: không chạy tùy tiện để kiểm tra đọc source.
- `build_test_apk.py` — instrumentation APK, còn đường dẫn executable kiểu Linux.
- `toolchain/fetch_tools.py`, `fetch_emulator.py` — tải công cụ Linux; kiểm kê, không chạy/tải trong audit Windows.
- `run_emulator_tests.py`, `tests/emulator_config.ini`, `tests/AndroidTestManifest.xml` — harness emulator Linux/fixtures, còn tham chiếu1.1.3 và uninstall; không tự chạy trên máy người dùng.
- `dist/`, `build/`, `web/dist/`, `web/node_modules/`, `toolchain/`, `private/` phần lớn là ignored local artifacts. `private` không phải UI và không được đưa vào docs/release.

## 8. Test và bằng chứng liên quan UI

- `web/tests/core.test.mjs` — path/CSS/encoding/raster/diagram/slug.
- `web/tests/workspace.test.mjs` — tree/order/boundary, block offsets/separators, rename, palette completeness.
- `web/tests/search.test.mjs` — plain/regex/Unicode/capture/limit/replacement.
- `web/tests/native.test.mjs` — MessagePort, scoped NativeFile, pagination/export; mock, không Android.
- `web/tests/preferences.test.mjs` — persist/migrate/clamp/invalid CSS fallback.
- `web/tests/ui.cjs` — tổng quan layout/theme/fonts/tree/draft/unified/CSS/render/export/persistence; screenshot browser.
- `web/tests/revision-ui.cjs` — responsive toolbar, menus/touch/font/search/rename extension/CSS/regex timeout; nhãn output vẫn ghi Revision1.1.3 dù chạy renderer hiện tại.
- `web/tests/reading-ui.cjs` — block editing/caret/anchor/no reload, progress/toolbar/reduced motion/split/exact export; vài assertion thị giác cần cập nhật khi thiết kế được duyệt.
- `web/tests/native-ui.cjs` — Android UI path thật trong browser với MessagePort host mô phỏng, gồm rename/CSS/export.
- `web/tests/session-ui.cjs` — renderer context mới/live expiry và settings qua host mô phỏng.
- `web/tests/startup-ui.cjs` — visible frame sampling, stale storage/native appearance/fallback/error/font/CSP.
- `tests/PolicyTest.java`, `SessionPolicyTest.java` — JVM policy và boundary phiên, không chạy Android services.
- `tests/validate_apk.py` — manifest/APK/version/CSP/font/current asset/security25 checks.
- `app/src/androidTest/java/vn/markread/local/tests/ProbeInstrumentation.java` — probe Android disposable; có selector và kỳ vọng cũ không khớp UI hiện tại, xem BASELINE trước khi dùng.
- `qa/fixtures/Docs/**`, `qa/revision-fixtures/**` — Markdown fixtures, tên Unicode/thư mục sâu/số2/10; `qa/*.png` là ảnh lịch sử.
- `test-results/1.1.3/**`, `1.1.4/**`, `1.1.5/**`, root/history reports — bằng chứng các lần trước, không tự coi là hiện trạng hoặc số kiểm tra chạy hôm nay.
- `README.md`, `CHANGELOG.md`, `HUONG_DAN_CAI_DAT.md`, `BAO_CAO_KIEM_THU_ANDROID.md`, `APK_SIGNATURE.txt` — hướng dẫn/lịch sử/chứng thư công khai; có chỗ version/report cũ, ghi nhận riêng.

Các script/đo/screenshot mới của lượt audit chỉ nằm trong ignored `build/ui-redesign-baseline/`. Không có source màn hình mới được thêm.
