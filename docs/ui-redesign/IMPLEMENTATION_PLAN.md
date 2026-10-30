# MarkRead — kết quả P1 và kế hoạch triển khai P2

**27/10/2026 · Design System đề xuất 1.0 · chưa triển khai UI.** P1 ở tài liệu này là giai đoạn thiết kế; P1/P2/P3 trong AUDIT là mức nghiêm trọng lỗi, không phải số giai đoạn. Mốc mã nguồn `a41a13a5e0e437a83fcd89b6f193292b5fdda9b1`, ứng dụng vẫn1.1.5/115.

## 1. Đầu vào và đầu ra

Đã tìm/đọc đầy đủ bốn tài liệu P0 trong chính `docs/ui-redesign/`: [AUDIT](AUDIT.md), [FILE_MAP](FILE_MAP.md), [BASELINE](BASELINE.md), [REGRESSION_CHECKLIST](REGRESSION_CHECKLIST.md). Đã đối chiếu các hook theme/persistence/reader/bridge/insets và asset/font thực tế; không suy đoán Compose/React/module thiết kế sẵn.

Sáu tài liệu P1:

- [MASTER](../../design-system/markread/MASTER.md): hướng Quiet Ink, ba lớp token, recipe12 theme, typography/spacing/geometry, layout và tương thích custom CSS. Cập nhật file sinh chung đã có, bản trước được giữ ở ignored build.
- [COMPONENTS](../../design-system/markread/COMPONENTS.md): trạng thái/kích thước/hành vi/semantics và hook hiện có cho toàn bộ workspace, sidebar, toolbar, Settings, search, editors, dialogs, feedback/native.
- [MOTION](../../design-system/markread/MOTION.md): duration/easing/enter/exit/cancel/reduced, header/progress/performance và spring tùy chọn.
- [ICONS](../../design-system/markread/ICONS.md): mapping23 Lucide outline, source chính thức, cách vendor SVG tĩnh/notice ở P2, không package/CDN.
- [ACCESSIBILITY](../../design-system/markread/ACCESSIBILITY.md): contrast, focus, keyboard, TalkBack, text scaling, target/insets và ma trận Android thực.
- Tài liệu IMPLEMENTATION_PLAN này: traceability, mâu thuẫn, thứ tự/rủi ro, kiểm thử và nghiệm thu.

Không tạo page overrides: ứng dụng một Activity/workspace, các overlay đã có đặc tả component, không cần thêm tầng override trùng quy tắc. Không sửa/ghi đè bốn tài liệu P0.

## 2. Quyết định thiết kế để duyệt

- **BẮT BUỘC:** Java/WebView/HTML/CSS/JS thuần; giữ source spans, draft RAM/export bản sao, tree/order/navigation, search worker, rename opaque IDs/provider URI, SAF và session policy. Không dependency, analytics, request/font/icon ngoài mạng hoặc framework mới.
- **Đề xuất chính:** Quiet Ink, graphite/sage phát triển từ màu MarkRead hiện tại; ít surface/decoration, chữ16px UI, reader defaults hiện có; đủ12 theme; icon Lucide24/stroke2, target48; focus neutral riêng keyboard.
- **Thay đổi trải nghiệm P2 có chủ đích:** toolbar hai hàng khi workspace<680 để giữ title/targets; category menu Settings ở viewport hẹp/thấp; More còn dùng trong unified để vào block navigator/rename; Shift+Tab/Escape ra editor; hiển thị trạng thái draft/lỗi dễ hiểu. Chưa hành vi nào được đổi trong P1.
- **TÙY CHỌN:** spring gesture drawer, shadow refinement, smooth anchor không khi nhập, tối ưu list/render sau profiler, app-specific motion preference. Không dùng các mục này làm điều kiện chậm phần sửa accessibility bắt buộc; feature/schema mới phải review riêng.

Hệ thống dựa vào nghiên cứu skill có kiểm chứng, không chép output sinh sai chủ đề. Nguồn product/style phù hợp và lý do loại output hero/testimonials/Google Fonts được ghi trong MASTER. Lucide static, license, Android và W3C có link nguồn chính thức trong ICONS/ACCESSIBILITY/MOTION. Tra cứu thiết kế không tạo yêu cầu mạng runtime.

## 3. Truy vết đủ15 finding và8 nhóm P0

Mỗi mục chỉ ra quyết định, nhóm chịu trách nhiệm và cách chứng minh ở P2. Các mục chưa chạy Android vẫn là chưa kiểm chứng, không chuyển thành PASS nhờ tài liệu.

- **A01 → G1:** loại focus/accessibility subtree khi drawer đóng; focus/isolation/return khi mở, expanded trigger. COMPONENTS§3, ACCESSIBILITY§3–5. Test Tab đầu, vòng focus, scrim/Back/TalkBack.
- **A02 → G2a:** Tab vẫn indent; Shift+Tab rời/không chèn; Escape ra source khi không có lớp trên; hướng dẫn rõ. COMPONENTS§5/ACCESSIBILITY§4. Test source exact/caret/IME và keyboard escape.
- **A03 → G2b + G4:** More giữ truy cập unified navigator có control trước/sau/sửa/hoàn tất/hủy, không biến mọi block thành tab stop. Reading source/anchor/no-reload tests, TalkBack thật.
- **A04 → G1:** listitem chứa button, current giữ, details/summary cho folder. Accessibility tree + tree order/navigation regressions.
- **A05 → G8a:** foreground native fallback theo palette, sp/dp thích hợp, không đổi WebView minimum. Test cả3 theme sáng và ít nhất Dark/OLED trên nhánh native provider cũ/mô phỏng có kiểm soát.
- **A06 → G4:** target48 và gap8; compact toolbar hai hàng, forget có nhãn/target; không bỏ chức năng. Đo CSSpx và dp Android,320px/landscape/keyboard.
- **A07 → G3:** tách accent-fill/accent-text/on-accent, resolver4.8/3.2, semantic colors12 theme. Palette math + computed/render contrast mọi state, primary Sepia.
- **A08 → G3 + G2:** ring neutral keyboard riêng selected, rename không mất focus indicator; inline marker/indicator có QA. Chỉnh assertion visual cũ sau duyệt, giữ dữ liệu/export checks.
- **A09 → G5 + G8b:** scale UI/source/reader rõ, system font stack/offline, native font metrics transient từng cỡ (không nhân fontScale phi tuyến), không double textZoom. Font200%/max/Vietnamese/nativesp tests.
- **A10 → G4 + G5 + G7:** breakpoints có height/content width, Settings category menu, single-owner insets, header dynamic height. Responsive/IME/anchor và trace thay đổi chrome.
- **A11 → G7 + G6:** busy/error tại thao tác, dirty clean↔dirty có text, copy nói đúng bản sao/RAM. Async cancel/stale/export/permission error, không autosave.
- **A12 → G1 + G6 + G4:** dialog có tên, semantics/menu/focus đúng,23 glyph Lucide, guide/TXT thống nhất với flows. Accessible names, offline assets, picker filter và help text.
- **A13 → G7:** reduced phủ startup keyframe/header/smooth/spinner; motion interruptible, không animate paragraphs. Startup/Reading + reduced toggled mid-transition.
- **A14 → G8b:** palette-aware native dialogs/system bars, giữ OS SAF. Android light/dark dialogs/back/insets tests.
- **A15 → G7 + G8b:** no-handshake timeout có lỗi/đường thoát; không nới origin/nonce, không gọi qua port chưa sẵn sàng. Late/missing/wrong channel tests, Java watchdog/native fallback nếu cần.

Như vậy cả **G1 focus/semantics; G2 editor keyboard; G3 palette/focus; G4 targets/layout; G5 typography/spacing; G6 icons/copy; G7 feedback/motion; G8 native fallback/theme/environment** đều được giữ, không thay bằng một cuộc refactor lớn.

## 4. Xung đột theme/custom CSS và cách xử lý

### C1 — Một accent cho cả nền nút và chữ

Nguồn `themes.js` chỉ có accent; `.primary` dùng panel làm chữ. Sepia thất bại4.5, nhiều accent/selected thấp. **Giải pháp:** giữ fill/hue/background primitive; accent-text/on-accent riêng. Alias `--accent` chuyển sang foreground đã sửa, fill dùng token mới. Đây là thay đổi độ sáng có chủ đích; CSS người dùng dùng `var(--accent)` sẽ nhận giá trị cải thiện tương phản, không cam kết RGB cũ bất biến. Test default và CSS có alias explicit.

### C2 — Hai nguồn fallback palette và native background mapping

`app.css` có fallback/override cũ khác JS; Java map12 background theo ID. **Giải pháp:** semantic resolver dùng JS palette thật, không palette suy từ CSS; giữ background12 theme để startup không flash. Nếu có đổi bg sau này, cập nhật Java/native HTML snapshot cùng patch. Không chỉ sửa CSS rồi bỏ native.

### C3 — Reader là iframe và custom CSS được nối cuối

CSS variables shell không xuyên frame. **Giải pháp:** truyền tokens resolved vào cả uiSettings/readerStyle, giữ13 legacy alias, font/size/width/leading và selector body/#paper. Thứ tự user CSS cuối, không blanket !important/@layer đè. Không cần Shadow DOM/theme plugin. Người dùng có thể override reader, shell/settings vẫn có đường sửa/reset.

### C4 — Typography/insets mới làm đổi anchor/inline geometry

Font16 UI/16 source/gutter và OS scale thay wrap/height; `resizeInline`/source offsets không được đoán theo layout. **Giải pháp:** giữ offsets theo source, reuse textarea, reserve host height/restore anchor; G5 reader riêng có Reading tests. Chỉ native root sở hữu system/IME padding; không cộng safe-area hai lần. Metadata font metrics mới là transient, không thêm key appearance. Dùng TypedValue theo từng cỡ để hỗ trợ scaling Android phi tuyến, không một multiplier fontScale chung.

### C5 — Focus thị giác cũ và screenshot tests

P0 Reading suite yêu cầu rename không outline, theme selection một border; nhiều test giả định modeMenu ẩn khi unified và toolbar một hàng. **Giải pháp:** giữ mục tiêu không có ring xanh khi tap, thêm ring neutral cho keyboard; menu unified/chrome layout theo đặc tả mới. Chỉ cập nhật **visual/structure assertion bị thiết kế thay có chủ đích**, thêm keyboard checks, giữ source/export/SAF/worker assertions. Không xóa test để làm xanh.

### C6 — SVG Lucide và offline/CSP/license

Không có Lucide package/asset subset trong repo được xác nhận. **Giải pháp:** P1 chỉ mapping nguồn; P2 vendor SVG tin cậy từ một tag/commit, append notices đã có, inline vào shell; không CDN/npm dependency/runtime loader/external sprite. Giữ script CSP hash do builder tính, không mở allow-scripts của reader.

### C7 — Settings và Back

Mobile category menu mới, unified navigator mới cần Back close state riêng; không có API này hiện tại. **Giải pháp:** menu mới đóng trước dialog; navigator không thay dữ liệu/scope; keyboard Escape field có ngữ nghĩa tách source vs inline. Kiểm tra toàn thứ tự Back P0 cộng các lớp mới có chủ đích. Không tạo Activity/router mới hoặc đổi chính sách dirty exit.

### C8 — Bridge lỗi nhưng thông báo cần usable

`nativeReady` có thể chờ mãi; nút retry gọi nativeCall sẽ vẫn kẹt. **Giải pháp:** error text tĩnh/shell fallback không đợi port, Android Back hiện có là đường ra; nếu cần nút Đóng độc lập thì Java AlertDialog/watchdog tự gọi finish. Watchdog theo page/nonce/lifecycle và hủy khi renderer trao đổi hợp lệ; chưa có trong source, phải kiểm thử G8. Không phát minh bridge method đã có, tự reload làm mất draft, hoặc tự mở rộng trust.

## 5. Thứ tự P2 và rủi ro

Mỗi bước là diff nhỏ, review/revert riêng. Bước đầu dùng baseline đã ghi; lập snapshot/log riêng, không ghi đè P0. Không có thao tác trong danh sách này được tự chạy khi hoàn tất P1.

### P2.1 — G3: nền token và focus — rủi ro thấp đến trung bình

Thêm semantic resolver/alias và base state/focus, giữ background/preference IDs. Hook: themes.js, uiSettings/readerStyle trong app.js, app.css/paper.css. Nếu tách module mới, ghi rõ file mới trong patch chứ không giả đang có. Không refactor parser/transport. Test Unit/Preferences/Workspace,12 theme rendered, Preview/Startup/Reading relevant; dữ liệu màu và focus rename có baseline mới riêng.

### P2.2 — G1: semantics và drawer/dialog focus — rủi ro trung bình, ưu tiên lỗi nghiêm trọng

Hook shell/sidebar/list/dialog/menu handlers và CSS hidden/focus. Làm aria/DOM role, closed subtree, focusreturn/isolation trước cosmetic navigation. Có fallback WebView100 cho inert. Test keyboard/snapshot, Browser/Native UI, tree/navigation và Android TalkBack. Phụ thuộc token chỉ về màu focus; không phụ thuộc icon.

### P2.3 — G2a: thoát keyboard ở source — rủi ro cao về nhập liệu, patch nhỏ

Chỉ sửa Tab/Shift+Tab/Escape và helper text, giữ source/mode/undo/composition. Không làm unified navigator cùng lúc. Unit/Workspace/Search/Reading, exact export, keyboard/IME thật. Chặn nếu key event làm mất composition/caret hoặc thay newline.

### P2.4 — G8a/b: fallback native và environment contract — rủi ro trung bình, cần Android

G8a sửa unsupported foreground/dp/sp trước; G8b cung cấp metadata native font metrics/reduced transient và native theme/dialog foreground theo ID, không đổi nonce/permission/SAF/session. Hook MainActivity.java/styles.xml hiện có; resource mới nếu cần ghi là file tạo mới. Environment metadata xuất sẵn lúc HTML load, không đợi port để có typography/reduced mode; font metrics tính từng cỡ bằng TypedValue, không nhân fontScale trực tiếp. Native watchdog/escape phối hợp G7 nếu no-handshake.

Đây là việc độc lập với styling reader, có thể review riêng. Android fallback/dialog/insets/scaling/grants tests bắt buộc; JVM policy không chứng minh nhánh UI này. Nếu thiếu thiết bị, ghi NOT RUN và chưa tuyên bố phát hành native hoàn chỉnh.

### P2.5 — G6: Lucide và copy — rủi ro thấp

Vendor subset23 glyph/notice, sửa labels/guide/accept TXT theo chức năng thật; không đổi source renderer semantics đã chốt G1. Hook shell.html, demo.md, icon động app.js, notices; brand giữ. Test names/state/offline/CSP và TXT/browser/native. Không package install hoặc cập nhật toàn bộ libs.

### P2.6 — G4: targets, toolbar và Settings responsive — rủi ro trung bình đến cao

Hook shell markup/app.css/section & More handlers. Áp48px/gap8, hai hàng compact, category menu, drawer theo height/content width và TOC/split rules. Giữ các ID/function handler khi được, không nhân đôi nguồn dữ liệu giữa desktop/mobile. Test tất cả chức năng ở320px, max text, landscape/IME, correct Back, no hidden-focus/click overlap; update assertions layout có chủ đích.

### P2.7 — G5: typography/spacing — rủi ro trung bình; reader riêng rủi ro cao

G5a nâng shell/help/caption/inputs, dùng metric từng vai trò transient đã có từ G8b. G5b reader/source metrics/gutters riêng, không đổi stored preferences hoặc ép width. Hook app.css/paper.css/readerStyle; không tải font. Test Vietnamese/Merriweather/200%/max, exact source/export, consecutive block focus/anchor/progress/IME. Không double scale CSS/textZoom/native.

### P2.8 — G2b: unified editing navigator — rủi ro cao

Phụ thuộc More/layout G4 và semantics G1; tạo một entrypoint/navigator local, reuse beginInline/finishInline, không đổi markdown token mapping. Không thêm persistence, framework/editor library hoặc load lại iframe để tìm khối. Reading suite đầy đủ + source spans/search, TalkBack/keyboard/IME; có proof không mất draft, caret, chỗ vừa chạm hoặc file khác. Không phát hành nếu chưa chứng minh đường editing keyboard dùng được.

### P2.9 — G7: feedback, reduced và motion — rủi ro trung bình

Tách small patch startup reduced (A13) khỏi header auto-hide geometry. Busy/error/status/dirty dùng operation hiện có, giữ timeout/draft/export contracts. G8b cấp native reduced flag/watchdog khi cần; test no/malformed/late port, cancel/race và font ready. Auto-hide hai hàng thực hiện sau G4/G5, chỉ tối ưu reflow khi có profiler. Test Startup/Session/Reading/Native suites, rapid states/reduced/Back. Không nới CSP hoặc tự reload mất state.

## 6. Cổng kiểm thử P2 và metric

**Theo từng patch:** chạy suite liên quan thay vì lặp build đầy đủ khi chỉ đổi tài liệu/copy. Trước tích hợp/phát hành: chạy toàn bộ test hiện có và test mới cho các lỗi P0; build renderer/APK và xác minh artifact/signature theo môi trường cho phép.

- **U/JVM:** pure core/workspace/preferences/search/native transport, Policy69 và SessionPolicy7 trước đây; tiếp tục bảo vệ boundary/grant/size/naming/source. Test mới không chỉ mirror token implementation.
- **B/S:** sáu UI suite hiện có; thêm cases focus ngoài màn, role button, Shift+Tab/Escape, keyboard unified, named dialogs, category selector/Back, target48/layout, all-theme contrast/focus, no-handshake và reduced startup. S là renderer với host mô phỏng, không phải native Android.
- **A/M:** Android8 và15 mục tiêu, WebView100 và hiện hành khi có môi trường; touch/TalkBack/physical keyboard/IME tiếng Việt, system scale/display size, dark/light, native fallback/dialogs, SAF tree/standalone read-only/write/cancel/revoke/rename/URI mới/export, ten-minute lifecycle/process restart/picker exclusion. Không chạy harness uninstall trên dữ liệu người dùng.
- **Viewport:**320×568,360×800,390×844,600×960,844×390,1280×800; thêm width>820 split và1024/height600 boundary để kiểm tra sidebar/TOC. Chữ1×/1.5×/2×/max; profile low-height khi keyboard mở.
- **Contrast:**4.5 text/3 meaningful non-text thực đo; không chấp nhận token-only khi alpha/preview/user CSS khác. Focus neutral2px độc lập selected, target48dp/48CSSpx không lẫn đơn vị.
- **Performance:** so trước/sau cùng thiết bị,5MiB long Markdown/5.000 file scan bounds/8 Mermaid và cached fonts. Mục tiêu feedback≤100ms sau input dispatch, không thêm long tasks>50ms do motion, không idle rAF hoặc iframe reload khi chỉ tương tác công cụ. Render toàn bài/big regex có baseline riêng, không dùng mục tiêu này để tự đổi deadline/limits.
- **Build/security:** giữ source→bundle→Android asset→APK cùng revision/CSP hash, offline fonts/Lucide notices, zero permissions/network. Gradle assembleRelease vẫn cần xác minh riêng; P0 chỉ chứng minh ECJ compile/package và APK có sẵn.

**Chặn nghiệm thu P2:** source/draft bị mất ngoài contract, export byte/rename/scope/grant sai, keyboard trapped/invisible, primary actions mất khả năng truy cập, startup/theme flash quay lại, hoặc nhãn PASS dùng cho Android chưa chạy. Rủi ro từ user CSS được báo rõ, không dùng nó làm lý do bỏ bảo đảm shell.

## 7. Điều kiện chấp nhận P1 và kiểm chứng đã làm

- [x] Đọc đủ bốn P0, giữ nguyên nội dung; xác định đúng Java/WebView/plain web và source hook thực có.
- [x] Sáu tài liệu P1 bao quát9 mục hệ thống thiết kế và toàn bộ UI/component đã kiểm kê; không cần page override trùng.
- [x] Trace đủ A01–A15 và G1–G8, chỉ rõ bắt buộc/tùy chọn/giữ nguyên, rủi ro/priority/dependency và test của P2.
- [x] Có color recipe nhất quán12 theme/13 alias, số type/spacing/geometry/state/motion, mapping23 Lucide xác minh nguồn và xử lý license/offline; không hướng dẫn tải font runtime.
- [x] Palette spec chạy2220 kiểm tra số học,0 fail; text min4.802, control min3.201, primary min4.818. Không coi là browser/native UI đã triển khai.
- [x] Các mâu thuẫn token/CSS/native/focus/Back/scaling/handshake nêu rõ, không hứa file/API đề xuất đang tồn tại. W3C/Android/Lucide đối chiếu nguồn chính thức, không áp template sai stack.
- [x] Kiểm tra UTF-8, links Markdown nội bộ, whitespace, đầy đủ tài liệu và integrity source/P0 bằng snapshot; báo kết quả cuối khi bàn giao. Log/script chỉ ở ignored `build/ui-design-p1/`.
- [x] Không sửa source app, tests, dependency/lockfile, bundle/APK, permissions/version hoặc tài liệu P0. Không rebuild/cài/phát hành app trong P1;439 checks là bằng chứng P0 được kế thừa, không chạy lại để giả có UI mới.

**Còn cần người dùng duyệt:** hướng Quiet Ink, toolbar hai hàng compact, category selector Settings, foreground correction/legacy alias, focus keyboard neutral, editor escape/navigator và thứ tự P2. Các điều này là quyết định thiết kế để review; không phải thiếu sót khiến P1 phải tự chuyển sang code.

**Kết thúc tại P1. Không tự động thực hiện P2.**
