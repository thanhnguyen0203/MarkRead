# P3E — Global Visual Polish & Interaction Refinement

Ngày hoàn thành: **28/10/2026**. Kiến trúc: **Java Android + WebView, HTML/CSS/JavaScript**. Thiết kế: Quiet Ink; skill [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md).

## 1. Tổng quan và đầu vào

Đã triển khai năm tinh chỉnh có bằng chứng render/source: toast dài, nhịp khoảng cách Export, backdrop/elevation Settings, khoảng tách menu và căn icon lỗi. Production chỉ sửa **`web/src/app.css`** và renderer sinh lại **`app/src/main/assets/index.html`**. Không sửa JavaScript, HTML shell, paper stylesheet, Java, event handlers hoặc dependency. Không thiết kế lại ứng dụng, thêm chức năng quản lý dữ liệu hoặc triển khai P3F/P4.

Kết quả: **2.061/2.061 đạt**, gồm **1.986 kế thừa + 75 mới**; palette **2.220/2.220**, Gradle debug APK **18/18**. Có **28 ảnh trước + 28 ảnh sau** và APK debug thực tế. Không có thiết bị/emulator kết nối; chưa xác minh Android runtime, IME, TalkBack, SAF và hiệu năng phần cứng.

Đối chiếu tài liệu P0–P3D, đặc biệt [MASTER](../../design-system/markread/MASTER.md), [COMPONENTS](../../design-system/markread/COMPONENTS.md), [MOTION](../../design-system/markread/MOTION.md), [ICONS](../../design-system/markread/ICONS.md), [ACCESSIBILITY](../../design-system/markread/ACCESSIBILITY.md), [kế hoạch](IMPLEMENTATION_PLAN.md), [P3A](P3A_REPORT.md), [P3B](P3B_REPORT.md), [P3C](P3C_REPORT.md), [P3D](P3D_REPORT.md), [baseline](BASELINE.md), [checklist](REGRESSION_CHECKLIST.md) và [Build Gate](ANDROID_BUILD_GATE.md). Không ghi đè tài liệu trước P3E. Các ghi chú baseline P0 chưa có Gradle là lịch sử; Build Gate và build mới xác nhận Gradle hiện đã hoạt động.

Git đầu vào HEAD `d5a7e5b`, có P3C/P3D chưa commit. Đã giữ Git status, snapshot **124 file** và hash tại `build/ui-p3e/before/workspace`, `before-sha256.json`; giữ APK P3D tại `build/ui-p3e/before/MarkRead-P3D-debug.apk`. Không stage, commit hoặc reset. Baseline chạy lại trước sửa đạt **1.986/1.986**, palette **2.220/2.220**.

Skill được dùng để tra cứu local `consistent component spacing` (Touch Spacing, Text Reflow, Font Size Scale), kết hợp Quick Reference về contrast, focus, typography, targets và reduced motion. Áp dụng hệ token đã có; không lấy palette/framework/icon family mới từ kết quả sinh chung.

## 2. Global visual audit

Đã xem **toàn bộ 60 ảnh P3D**, cùng **22 ảnh before** và **24 ảnh after/navigation đại diện P3A–P3C** qua contact sheets, đối chiếu các vùng bị ảnh hưởng ở kích thước đầy đủ. Bộ P3E bổ sung 56 ảnh render mới, cùng viewport/theme/source/font/state giữa hai phía. Metadata ở [VISUAL_REVIEW.json](../../test-results/ui-p3e/VISUAL_REVIEW.json).

Rà soát hierarchy, alignment, spacing, typography, màu/contrast, radius/elevation, icon/stroke, responsive, feedback, motion và accessibility trên Reader, Editor, Toolbar, Sidebar/File Browser, năm nhóm Settings, Theme Picker, Search/Replace, dialogs/popovers, toast, empty/error và navigation. Không phát hiện lỗi **Critical mới** trong phạm vi đã kiểm tra. Các vấn đề và quyết định:

| ID / mức độ | Vị trí và mô tả | Bằng chứng / nguyên nhân xác minh | Xử lý | Rủi ro | Tiêu chí sau sửa |
|---|---|---|---|---|---|
| E01 **High** | Toast đổi tên tràn chữ khi tên file dài liền mạch | Ảnh `320x568-dark-toast-1x.png` trước; scrollWidth **1.338**, clientWidth **286**. `white-space:pre-wrap` không ngắt token dài; thiếu giới hạn chiều cao | Wrap anywhere, giới hạn rộng viewport−32 và cao 40vh/dvh; overflow local; chỉ `.show` nhận pointer để cuộn | Toast che vùng dưới trong thời gian hiện; giữ 4,5 giây cũ, không biến thành dialog | 320px, font100/200% không tràn; scroll tới dòng cuối; hết hạn không chặn thao tác, text status nguyên vẹn |
| E02 **Medium** | Export có khoảng cách giữa các control khác nhau | Ảnh Export P3D/P3E trước; anchor giữ margin `8px 6px 15px 0`, Copy còn bottom12. Cộng vào grid gap12 thành khoảng trống **27/24px** | Reset margin ngay trong rule Export hiện hữu, giữ grid12 | Thay đổi tổng chiều cao/centering dialog | Cùng một cột, gap **12/12px** ở sáu width; targets≥48; source xuất nguyên chuỗi |
| E03 **Medium** | Settings có blur/scrim khác Help/Rename/Export | Ảnh Settings; backdrop computed `blur(3px)` và alpha .533, các dialog P3D dùng no blur/token .467 | Chung `dialog::backdrop`, dùng `--mr-dialog-scrim`; shadow Settings trỏ token chung | Cảnh phía sau rõ hơn; nested Help vẫn có hai backdrop theo modal stack cũ | Đúng scrim, no blur trên 12 theme; focus/Back/stack không đổi |
| E04 **Low** | Tam giác lỗi Search/Rename thấp hơn dòng chữ đầu | Rule `.icon-error>.mr-icon` margin-top8 kế thừa trong khi text lỗi đã bỏ margin; ảnh invalid regex | Line-height/type token trên wrapper; tính offset từ chiều cao dòng và glyph16 | Native text metrics có thể khác desktop | Tâm glyph/dòng đầu lệch<3px ở font100/200%; giữ query, error association và source |
| E05 **Low** | Hàng Open/Mode/Font không có khoảng tách | Ảnh menu; các button kế tiếp sát nhau dù surface/menu padding đã thống nhất | Margin giữa sibling **4px** bằng `--mr-space-1`; không đổi min-height, role hoặc order | Menu dài thêm vài px, tiếp tục cuộn theo vh/dvh | Row≥48, gap4, không overlap; Arrow/Escape/return focus vẫn đúng |
| E06 **Medium**, giữ nguyên | Unknown-command LaTeX có màu đỏ inline riêng của KaTeX | Ảnh `393x852-dark-error-1x.png`; `renderToString(...throwOnError:false...)` sinh `color:#cc0000` cho `\notARealCommand{x}` | Backlog riêng trước release. Không override toàn bộ màu math hoặc sửa cấu hình renderer trong P3E | Palette2220 không phủ màu inline do thư viện/user content sinh ra | Cần quyết định presentation error của renderer và kiểm tra MathML/latex color commands riêng |
| E07 **Medium**, giữ nguyên | Undo không hoàn tác Replace trong Chromium | [Probe P3D](../../test-results/ui-p3d/HISTORY.json) và suite160 kế thừa chạy lại; trước/sau giống nhau | Bảo toàn theo yêu cầu; không tích hợp undo transaction mới | Người dùng có thể kỳ vọng undo bulk replacement | Hạng mục kiểm tra riêng trước release; không coi native typing undo xanh là Replace undo đã hỗ trợ |
| E08 **Low**, giữ nguyên | Tên file toolbar ellipsis; Settings/cây/tìm kiếm phải cuộn ở màn hẹp hoặc chữ200% | Ảnh reader/tree/typography/search; full path vẫn trong accessible name/list/Rename, control còn tới được | Không giảm target/font hoặc thu gọn tên file bằng logic mới | Cần thao tác cuộn thêm | Các suite responsive/overflow/font200 và exact-source tiếp tục đạt |

Không coi thiếu dữ liệu thiết bị là finding visual đã tái hiện: đó là **cổng QA còn mở** ở phần 8. Các lỗi đã sửa nằm trong một stylesheet, phân nhóm theo A audit → B spacing/type → C components → D motion review → E responsive/accessibility → F regression. Không thêm override layer cuối file để che lỗi; sửa tại các declaration component đang sở hữu style.

## 3. Các tinh chỉnh thực tế

### Spacing, components và surfaces

Export giữ hierarchy lưu/sao chép/source, chỉ bỏ margin legacy để grid gap điều khiển toàn bộ nhịp. Không thay nội dung xuất, clipboard fallback hoặc OS save picker. Settings giữ nguyên danh sách→chi tiết trên mobile và nav hai panel trên màn rộng; chỉ thống nhất scrim và tham chiếu shadow token.

Open/Mode/Font thêm 4px giữa các hàng, giữ padding8, radius12, button radius10, target48, Lucide/stroke và checked/selected hiện hữu. Không tạo component abstraction hoặc thay state management. Căn icon lỗi theo **line box** thay vì margin cố định, giữ màu semantic, aria-invalid/describedby/alert của P3D.

Toast dùng spacing12/16, control radius và popover shadow có sẵn. Chuỗi tên file vẫn đầy đủ qua `textContent`, wrap trong phạm vi viewport. Nội dung dài cuộn trong chiều cao tối đa40%; `.show` cho phép pointer scroll, trạng thái ẩn giữ `pointer-events:none`. Có neutral focus outline nếu scroll container nhận focus. Không tự focus toast, không thêm tabindex/handler hoặc kéo dài thời gian4500ms. Đây vẫn là thông báo tạm; lỗi Rename cần hành động tiếp tục tồn tại inline trong dialog.

Không thay primitive/semantic palette hoặc font lựa chọn của người dùng. Các cải tiến dùng spacing/type/focus/elevation tokens hiện có và giữ đúng 12 theme. Reader typography, paper gutters, tables/code/images/math, source font, toolbar dimensions và file indentation đã ổn qua ảnh/test nên không sửa thêm.

### Motion và navigation

Không thêm animation. Giữ durations/easing, enter/exit, control tint, drawer, section transition, theme atomic và reduced-motion media OR native của P2G. Dialog/menu đóng ngay theo contract cũ; không kéo dài exit để làm đẹp. Không transition editor text/caret/selection hoặc node Markdown.

Rapid Settings open/close và đổi reduced motion giữa các lần mở vẫn trả focus đúng, giữ source selection/draft. Toàn bộ motion suites **46 + 98 + 53** tiếp tục đạt; menu, drawer, category/Back và editor keyboard được kiểm bởi các suite kế thừa. Không sửa navigation state machine hoặc overlay handlers.

## 4. Phạm vi file và bảo toàn

Sửa production:

- `web/src/app.css`: E01–E05, gồm vài rule hiện hữu và hai rule toast cùng khoảng tách menu.
- `app/src/main/assets/index.html`: asset sinh lại từ `web/dist/MarkRead.html` và đối chiếu byte.

Tạo mới:

- `web/tests/polish-ui.cjs`: 75 kiểm tra Chromium.
- Report này và `test-results/ui-p3e/` với log, metadata, 56 ảnh, kết quả máy đọc và [SOURCE.diff](../../test-results/ui-p3e/SOURCE.diff) **chỉ thể hiện delta P3D→P3E**.

[SCOPE.json](../../test-results/ui-p3e/SCOPE.json) xác nhận chỉ hai file có sẵn đổi hash trong snapshot124 file. **Không đổi** app.js, shell.html, paper.css, tokens/themes/preferences, keyboard/composition, editor/workspace, search engine, renderer modules, bridge/native/Java, Manifest/resources, SVG/license, build config/lockfile, test cũ hoặc tài liệu P0–P3D. Các file dirty P3C/P3D vẫn xuất hiện trong Git status nhưng được bảo toàn đúng đầu vào.

Không thêm autosave, thay dirty state, undo architecture, file persistence, SAF/grants, theme persistence, custom CSS precedence, applicationId/signing/permissions hoặc analytics/network. CSS và JS người dùng không bị chuẩn hóa lại.

## 5. Kiểm thử và evidence

- **Kế thừa 1.986/1.986 đạt** trước và sau: Node132 + browser1.658 + JVM171 + baseline APK25. Không bỏ/thay assertion cũ.
- **P3E75/75 đạt**: Export24 ca trên320/360/393/412/600/800; lỗi4 ca ở100/200%; theme/scrim/contrast24 ca trên12 theme; menu9 ca; toast8 ca; source/DOM/native typing undo/redo/draft/selection/rapid overlays/no browser errors6 ca.
- **Tổng 2.061/2.061**, 0 thất bại. Các lượt chạy lại/smoke không cộng thêm vào tổng.
- **Palette2.220/2.220**; đủ12 palette và23 định nghĩa Lucide SVG offline. Test mới còn đo contrast label Export từ computed foreground/background≥4.5 trên12 theme. Không coi kết quả token checker là chứng nhận mọi pixel/nội dung tự render, đặc biệt E06 và custom CSS.
- Syntax **49 JS source/test +2 build modules =51 file**; parse2 CSS; `git diff --check` đạt. Cảnh báo Git LF→CRLF của một số file là thông báo chính sách line ending, không lỗi whitespace.
- Bundle web/Android khớp byte, CSP/resources/font offline/sandbox và notices đạt qua Node/native/APK verification.
- Reader suite139 tiếp tục kiểm tài liệu dài173.410 byte/181 code blocks, table/code/LaTeX/local image, exact source, custom CSS, font và scrolling. Không đo một benchmark tốc độ mới.
- Hash DOM reader ban đầu của **27 case có tài liệu** trước/sau khớp, case empty-library không có DOM tài liệu. Chỉ chuẩn hóa blob image URLs như P3C; không bỏ MathML/source attributes/tag/text khỏi kiểm tra. Source DOM sau thay đổi thao tác có chủ đích được kiểm riêng.

[RESULTS.json](../../test-results/ui-p3e/RESULTS.json), [SUITES.json](../../test-results/ui-p3e/SUITES.json), [PALETTE.json](../../test-results/ui-p3e/PALETTE.json), [SEMANTICS.json](../../test-results/ui-p3e/SEMANTICS.json). Browser/Node/JVM logs trước/sau nằm cùng evidence.

Các lệnh chính từ repository:

```powershell
node --test web/tests/*.test.mjs
python build/ui-p3e/run-browser.py before 0
python build/ui-p3e/run-browser.py before 1
python build/ui-p3e/run-browser.py after 0
python build/ui-p3e/run-browser.py after 1
node web/tests/search-dialogs-ui.cjs
node web/tests/modal-native-states-ui.cjs
node web/tests/polish-ui.cjs
python build/ui-p3e/verify-native-after.py before
python build/ui-p3e/verify-native-after.py after
node build/ui-p3e/palette-check.mjs
node web/build.mjs
Copy-Item -LiteralPath web/dist/MarkRead.html -Destination app/src/main/assets/index.html
.\scripts\Build-AndroidDebug.ps1 -Offline -RerunTasks
python build/ui-p3e/verify-debug-apk.py
.\toolchain\android-sdk\platform-tools\adb.exe devices -l
git diff --check
```

Harness tạm trong `build/ui-p3e` được ignore. Test mới dùng Playwright/Chromium đã có (`NODE_PATH`, `MARKREAD_CHROMIUM` theo môi trường), không cài dependency. Browser regression chạy trong workspace cô lập để không ghi đè ảnh lịch sử. Trong vòng kiểm tra, đã sửa tên section của capture harness từ `reader` sang ID thực `editing`; đồng bộ asset rõ ràng vì builder chỉ ghi web/dist. Các kết quả/ảnh cuối dùng renderer đã đồng bộ; không sửa ứng dụng để né test.

## 6. Visual regression

**28 trước +28 sau**, Windows desktop Chromium **156.0.8078.49**, DPR1, cùng nội dung/viewport/theme/state, reader sans18/leading1.8/width860, reduced motion, caret ẩn khi chụp. Metadata: [before](../../test-results/ui-p3e/before/screenshots.json), [after](../../test-results/ui-p3e/after/screenshots.json). Đây không phải ảnh Android.

Bao phủ short/long reader, image/LaTeX/table/code, source editor, toolbar, drawer/fixed sidebar với cây sâu và tên dài, filter-empty/initial-empty, Settings hẹp/rộng và đủ năm nhóm, Theme Picker, font popup, Search/invalid, Rename, mode/open menus, toast dài, landscape844×390, viewport393×360 và UI font200%. Width360/412 được bao phủ bởi sidebar/CSS và các tests mới/kế thừa; không tạo thêm ảnh trùng cho mọi component ở mọi width.

Đánh giá trực quan sau sửa: hierarchy reader/toolbar không đổi; label/icon vẫn thẳng trục, action Export cùng cột và khoảng cách đều; Settings/Dialog có backdrop thống nhất; glyph lỗi lên đúng dòng đầu; menu có nhịp tách nhẹ; toast không kéo chữ ra ngoài khung. Đã xem clipping, khả năng đọc, nhịp spacing và vùng cuộn, không chỉ pixel diff.

Ảnh đại diện:

- Toast dài: [trước](../../test-results/ui-p3e/before/screenshots/320x568-dark-toast-1x.png) · [sau](../../test-results/ui-p3e/after/screenshots/320x568-dark-toast-1x.png).
- Export: [trước](../../test-results/ui-p3e/before/screenshots/393x852-light-export-1x.png) · [sau](../../test-results/ui-p3e/after/screenshots/393x852-light-export-1x.png).
- Settings hẹp: [trước](../../test-results/ui-p3e/before/screenshots/320x568-light-home-1x.png) · [sau](../../test-results/ui-p3e/after/screenshots/320x568-light-home-1x.png).
- Font menu: [trước](../../test-results/ui-p3e/before/screenshots/393x852-light-font-1x.png) · [sau](../../test-results/ui-p3e/after/screenshots/393x852-light-font-1x.png).
- Invalid regex: [trước](../../test-results/ui-p3e/before/screenshots/800x852-dark-invalid-1x.png) · [sau](../../test-results/ui-p3e/after/screenshots/800x852-dark-invalid-1x.png).
- Các vùng giữ nguyên: [reader](../../test-results/ui-p3e/after/screenshots/393x852-dark-read-1x.png), [long document](../../test-results/ui-p3e/after/screenshots/393x852-dark-long-1x.png), [table landscape](../../test-results/ui-p3e/after/screenshots/844x390-light-table-1x.png), [sidebar](../../test-results/ui-p3e/after/screenshots/360x800-dark-tree-1x.png), [font200](../../test-results/ui-p3e/after/screenshots/393x852-dark-typography-2x.png), [error fixture/E06](../../test-results/ui-p3e/after/screenshots/393x852-dark-error-1x.png).

## 7. Gradle / APK

Giữ **Gradle8.9 + AGP8.7.3 + JDK17**, offline toolchain. `Build-AndroidDebug.ps1 -Offline -RerunTasks`: **BUILD SUCCESSFUL in1m9s**, **31 tasks executed**.

- APK thực tế: `app/build/outputs/apk/debug/app-debug.apk`, **7.606.382 byte**.
- APK SHA-256: `a982db7123aab3e8cb75ecce8878d103fac9056c4d21c36cf0590f3a48a24b9d`.
- Renderer: **13.310.551 byte**, SHA-256 `76b22a691fc11028dcde15396d7e5755d83d3d189a7a7bf472952674d4b8fd79`.
- So với P3D: renderer tăng **565 byte**, APK tăng **156 byte**.
- **18/18** kiểm tra variant/version/ID/SDK, signature debug/alignment/CRC, permissions, exact asset, CSP/sandbox/notices/font và không đóng gói credentials đạt. Không build/sign release.
- So APK P3D/P3E: cùng ZIP entry names; **chỉ `assets/index.html` đổi nội dung**. DEX, compiled Manifest/resources và notices giữ nguyên.

[ARTIFACTS.json](../../test-results/ui-p3e/ARTIFACTS.json), [DEBUG_APK.json](../../test-results/ui-p3e/DEBUG_APK.json). APK dùng certificate debug Build Gate; không phải bản release.

## 8. Accessibility, hiệu năng và giới hạn còn mở

Giữ focus-visible neutral, fallback focus, accessible names/roles, ARIA selection/pressed/expanded/invalid, native dialog semantics và disabled thật. Không gỡ indicator, thêm role tùy tiện hoặc giấu interactive controls khỏi accessibility tree. Test pointer scroll toast là thao tác desktop browser, không phải chứng minh touch/TalkBack Android. Vùng chạm≥48 **CSS px** không tự chứng minh≥48dp.

`adb devices -l` không có thiết bị/emulator. Chưa cài/chạy APK trên Android; IME Telex/VNI, TalkBack, Android Back thật, WebView100/current, gesture/three-button bars, orientation/lifecycle, system font/display scale/density, keyboard insets và SAF provider/grants/export/rename/revoke cần thử trên thiết bị. Viewport thấp, synthetic composition và MessagePort host chỉ là simulation.

Không thêm observers, timers, rAF loops, infinite animation, framework, global transition trên Markdown hoặc render editor để làm hiệu ứng. Loại blur của Settings làm hệ styling đơn giản hơn nhưng **chưa có số đo paint/FPS chứng minh cải thiện**. Long-document tests và ảnh xác nhận chức năng/overflow, không thay profiling gần5MiB, nhiều ảnh/diagram hoặc latency/frames Android. Không tuyên bố đạt60FPS.

Known issues: E06 màu lỗi inline KaTeX cần review riêng, E07 Replace undo giữ nguyên, instrumentation/emulator harness cũ ở baseline chưa được biến thành một native gate xanh, custom CSS tùy ý vẫn có thể làm contrast/layout reader khác mặc định. Các vấn đề này không bị che bằng số kiểm tra palette/test xanh.

## 9. Rollback và điều kiện P3F

Rollback riêng P3E: khôi phục **`web/src/app.css`** từ `build/ui-p3e/before/workspace`, build renderer rồi copy web/dist sang Android asset; hoặc khôi phục asset snapshot để quay đúng byte P3D. Renderer phải về SHA `32a2ed45cf0d5d7f67c4b550fb5a307016dface84a63c60656c1c7539a978a23`. Bỏ test `polish-ui.cjs` nếu không giữ kiểm tra lịch sử. Có thể giữ report/evidence làm hồ sơ.

APK P3D snapshot có SHA `56e1ab37e97293367197cca2a72bb7a73414413bf1e82045b1d4fa333744e706`. Không reset về HEAD vì sẽ mất công việc P3C/P3D chưa commit. Không thay key, grants, app data hoặc file người dùng để rollback CSS.

Các cổng triển khai P3E cục bộ đã đạt: phạm vi chỉ CSS/asset, giữ đủ1.986 cũ, thêm75 mới, palette2220, packaging18, DOM/source/hash và ảnh trước/sau đầy đủ. **Chưa kết luận sẵn sàng phát hành Android.**

Điều kiện chuyển P3F: người dùng duyệt UI/ảnh/APK P3E và cấp phạm vi bước tiếp theo; giữ regression/palette/package xanh; lập vòng QA thiết bị cho IME/TalkBack/SAF/Back/insets/lifecycle và đọc tài liệu dài; đưa E06 và E07 vào hạng mục review trước release với quyết định phạm vi rõ ràng. **P3E dừng tại đây, không tự triển khai P3F hoặc P4.**
