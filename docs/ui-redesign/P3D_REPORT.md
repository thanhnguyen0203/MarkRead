# P3D — Search, Replace, Dialogs & Menus

Ngày hoàn thành: 2026-10-28. Design System: **Quiet Ink**. Skill áp dụng: [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md), tập trung vào error placement, liên kết lỗi với trường nhập, focus, vùng chạm và trạng thái không chỉ dựa vào màu.

## 1. Kết quả và phạm vi

Đã triển khai UI P3D trên kiến trúc **Java Android + WebView, HTML/CSS/JavaScript**. Search/Replace có hệ thống trường nhập, điều hướng, phân cấp hành động, toggle và feedback thống nhất với P3A–P3C. Rename, Help, Export và ba popover hiện hữu dùng bề mặt, spacing, radius, elevation chung. Không thêm dependency, framework, network call, analytics hoặc asset CDN.

Đạt **1.986/1.986** kiểm tra: giữ **1.816/1.816** kiểm tra kế thừa và thêm **170/170** kiểm tra P3D. Palette **2.220/2.220**, APK debug **18/18**. Đã build APK thực tế. Không có thiết bị hoặc emulator kết nối; Android runtime, IME tiếng Việt, TalkBack và SAF chưa được xác minh trên thiết bị.

P3D dừng tại đây. Chưa triển khai P3E hoặc P3F.

## 2. Điều kiện đầu vào và kiểm kê

Đã đọc các tài liệu P0–P3C, MASTER, COMPONENTS, MOTION, ICONS, ACCESSIBILITY và IMPLEMENTATION_PLAN trước khi triển khai. Đối chiếu baseline, Git status/diff, các handler và quản lý modal/focus/Back hiện hữu. HEAD đầu vào: `d5a7e5b` (`Update P3B`). Workspace có thay đổi P3C chưa commit; giữ nguyên những thay đổi đó, không reset về HEAD.

Đầu vào gồm các file đã thay đổi `app/src/main/assets/index.html`, `web/src/app.css`, `web/src/paper.css`, `web/tests/foundations-ui.cjs`, `web/tests/revision-ui.cjs`; cùng report, evidence và fixture/test P3C chưa track. Snapshot nguyên trạng trước P3D nằm tại `build/ui-p3d/before/workspace`, hash tại `build/ui-p3d/before-sha256.json`. Baseline được chạy lại trước khi sửa: 1.816 đạt, palette 2.220 đạt.

Kiểm kê thực tế:

- `web/src/shell.html`: Search/Replace cùng một panel; Previous, Next, count, Close, Match Case và Regex. Không có panel Replace đóng/mở riêng.
- Bốn web dialog: Settings, Help, Export và Rename. Settings giữ thiết kế P3A; Export là fallback của trình duyệt. Luồng Android dùng bộ chọn xuất native theo logic sẵn có.
- Ba popup: Open, Mode và Font. Font giữ role listbox và cơ chế chọn hiện hữu; Open/Mode giữ keyboard/expanded state.
- Long-press/contextmenu trên file hoặc tên tài liệu và F2 mở Rename trực tiếp. Không có file/folder context menu nhiều mục để xây lại. Giữ disclosure thư mục và long-press P3B.
- Native confirmation, cảnh báo rời bản sửa, fallback/recovery, SAF và menu chọn văn bản Android do mã native/hệ điều hành quản lý; không sửa.
- Search engine nằm trong `web/src/search.js`, `web/src/search-worker.js`; điều phối UI và cập nhật source trong `web/src/app.js`. Keyboard/composition và modal navigation dùng các module/handler hiện hữu.

## 3. Search & Replace mới

### Nhóm A–B: panel, trường nhập, options và feedback

- Search field có Lucide Search trang trí, nền/border theo theme, padding 12px, input tối thiểu 48 CSS px. Wrapper là `label` liên kết input; accessible name cũ được giữ. Query dài cuộn trong input theo hành vi trình duyệt, không bị cắt hay viết lại giá trị.
- Focus ring 2px bao quanh trường nhập, dùng `--mr-focus`. Chỉ bỏ outline trùng lặp của input nằm trong wrapper đang sở hữu indicator; không tắt outline toàn cục. Keyboard focus trên các nút tiếp tục dùng foundations P2A/P2C.
- Previous/Next nằm cạnh Search, có nền và đường viền nhẹ. Count dùng số có độ rộng đều và badge; role status hiện hữu thêm `aria-atomic="true"`. Close giữ vùng chạm và hành vi cũ.
- Replace input, Replace và Replace All có spacing/radius chung. Replace dùng bề mặt accent nhẹ để phân cấp; Replace All vẫn là hành động bình thường, không bị trình bày như xóa file. Tooltip phân biệt “kết quả hiện tại” và “tất cả kết quả trong bài”. Không thêm xác nhận hoặc tự thay khi nhập replacement.
- Match Case và Regex tiếp tục dùng `aria-pressed`. Thêm dấu check Lucide 16px, có chỗ dành sẵn để không làm nhảy bố cục. Selected dùng nền, border và check; pressed dùng token riêng. Icon trang trí bị ẩn khỏi accessibility tree.
- Scope hint có ID, liên kết với Search và Replace bằng `aria-describedby`. Không tạo trạng thái đang xử lý hoặc thông báo Replace mới nếu engine chưa có.
- Lỗi regex và query quá 2.000 ký tự được liên kết trường nhập, hiển thị inline, đặt `aria-invalid` và border lỗi. Khi lỗi được xóa, invalid state cũng được xóa.
- Worker unavailable, timeout hoặc giới hạn thao tác là lỗi vận hành: vẫn thông báo theo cơ chế cũ, **không gán sai rằng query hợp lệ là invalid**. Không có kết quả không phải lỗi validation.

Panel giữ giới hạn chiều cao 45vh/45dvh và cuộn nội bộ. Ở màn hình thấp hoặc font 200%, các điều khiển phía dưới có thể cần cuộn trong panel; không ép toàn bộ panel phủ hết vùng đọc. Không thêm nút clear riêng: thao tác chọn/xóa nội dung input hiện hữu vẫn hoạt động.

### Nhóm C: dialogs

- Help, Rename và Export dùng surface tokens, dialog radius, border nhẹ, scrim chung và shadow chung; bỏ backdrop blur của các dialog này. Header/body có khoảng cách 24px ở màn hình rộng, 16px ở màn hình nhỏ. Giữ giới hạn chiều cao và body cuộn hiện hữu.
- Rename rộng tối đa 440px trong viewport, giữ label, validation, error alert, submit/cancel, busy/disabled và cơ chế sửa đầy đủ phần mở rộng. Thêm hint “Nhập tên đầy đủ, có thể sửa cả phần mở rộng.” liên kết với input.
- Chỉ validation tên/collision đánh dấu tên invalid. Lỗi thiếu quyền ghi vẫn là lỗi vận hành; tên đang nhập được giữ để thử lại. Không đổi dữ liệu hoặc đường dẫn trước submit.
- Help rộng tối đa 640px, chữ 16px/1.65, đoạn cách 16px. Không sửa nội dung trợ giúp.
- Export rộng tối đa 680px; nút lưu/sao chép đủ chiều ngang, source readonly monospace, chiều cao giới hạn và feedback dễ đọc. Không đổi nội dung xuất hoặc fallback copy.
- Giữ nguyên focus ban đầu/khôi phục, native `<dialog>` semantics, close/cancel, submit guard, modal stack, Escape và Android Back contract. Không thêm focus trap hoặc delay mới.

### Nhóm D–E: popovers, motion và accessibility

Open, Mode, Font dùng elevated surface, border/radius/shadow chung, padding 8px, mỗi control tối thiểu 48 CSS px, nhãn dài wrap và danh sách cuộn giới hạn vh/dvh. Không đổi thứ tự, nhãn, role, event binding hoặc ý nghĩa lựa chọn. Không can thiệp native text-selection menu.

Tái sử dụng P2G cho enter của Search/dialog/menu, interaction feedback, toast và reduced motion. Dấu check mới chuyển opacity với `--mr-motion-fast` (120ms) và easing hiện hữu. Pressed dùng phản hồi 80ms sẵn có. Semantic state, disabled và focus cập nhật ngay; không chờ `animationend`.

Search, dialog và các menu vẫn đóng ngay theo cơ chế P2G để trả focus/Back chính xác. Không thêm exit animation chặn tương tác hoặc transition chiều cao làm editor dịch chuyển từng frame. Replace controls không có disclosure riêng nên không tạo animation đóng/mở mới. Reduced motion của web/native vẫn vô hiệu hóa transition/animation theo P2G.

Các kích thước 48 CSS px được kiểm tra trong desktop Chromium. Quy đổi sang dp, system insets và bàn phím thật vẫn cần QA Android; không coi CSS px tự động tương đương dp trên mọi thiết bị.

## 4. Bảo toàn nghiệp vụ và giới hạn phát hiện

Không sửa search worker/engine, flags, wrap-around, direction, indexing, capture groups, replacement semantics, Unicode hoặc zero-length handling. Các giới hạn 2.000 ký tự query, 20.000 matches, timeout worker 2,5 giây và replacement tối đa 5 MiB giữ nguyên. Không sửa editor/renderer, undo architecture, lưu file, autosave, bridge, native lifecycle, SAF, theme persistence hoặc custom CSS precedence.

`app.js` chỉ thêm helper trình bày lỗi và chuyển các chỗ ghi text lỗi sang helper đó. Thông báo vẫn đi qua `textContent`; không đưa query hoặc tên file vào HTML. Đã đảo biến đổi này trong verifier và đối chiếu `app.js` khớp chính xác đầu vào P3C. CSS P3D được thêm cuối file; toàn bộ prefix P3C giữ nguyên.

Hash xác nhận không đổi `search.js`, `search-worker.js`, `keyboard.js`, `workspace.js`, `core.js`, `native.js`, `motion.js`, `paper.css`, mã Java, build config, dependency và các tài liệu P0–P3C. Không sửa các test kế thừa trong P3D. Danh sách hash đầy đủ: [SCOPE.json](../../test-results/ui-p3d/SCOPE.json).

**Giới hạn có sẵn được tái hiện:** trong probe Chromium, native textarea Undo không hoàn tác Replace đã gán qua `editor.value`; Redo cũng không đổi bản thay thế. Ca tái hiện: nhập thêm `native` vào `# History\n\none one`, Replace `one` → `two`, rồi gọi native Undo/Redo. Source sau Replace vẫn là `# History\n\ntwo one\nnative`, dirty=true. Snapshot trước P3D và bản sau P3D có kết quả giống nhau. P3D bảo toàn hiện trạng này, không sửa undo integration ngoài phạm vi. Xem [HISTORY.json](../../test-results/ui-p3d/HISTORY.json) và probe `historyRecord` trong `web/tests/search-ui-fixture.cjs`.

Không thêm listener, timer, observer, network request hoặc lớp quản lý state mới. Không thêm animation lên node Markdown. Không có số đo FPS hoặc Android frame timing; không tuyên bố 60 FPS hay cải thiện hiệu năng đã đo.

## 5. File thay đổi

File hiện hữu được sửa trong P3D:

- `web/src/shell.html`: wrapper Search, liên kết hint/error, count atomic, tooltip, dấu check và hint Rename.
- `web/src/app.css`: hai block P3D cho Search/Replace và web dialog/popover.
- `web/src/app.js`: helper error presentation và các chỗ gọi tương ứng.
- `app/src/main/assets/index.html`: renderer được build lại. `web/dist/MarkRead.html` là output build tương ứng, được ignore; hai file khớp byte.

File mới:

- `web/tests/search-ui-fixture.cjs`: fixture tiếng Việt/Unicode và history probe trước/sau.
- `web/tests/search-dialogs-ui.cjs`: 160 kiểm tra UI/worker thực trong trình duyệt.
- `web/tests/modal-native-states-ui.cjs`: 10 kiểm tra host MessagePort mô phỏng.
- Report này và evidence trong `test-results/ui-p3d/`.

Các file dirty thuộc P3C vẫn có thể xuất hiện trong `git diff`; không phải thay đổi mới của P3D. Không commit/stage tự động.

## 6. Kiểm thử

### Kết quả

- Kế thừa: Node **132**, browser **1.488**, JVM **171**, baseline APK **25** = **1.816 đạt**, 0 thất bại. Đã chạy trước và sau triển khai.
- P3D mới: Search/dialog browser **160**, modal/native-host simulation **10** = **170 đạt**, 0 thất bại.
- Tổng sau thay đổi: **1.986 đạt**, 0 thất bại, không thay thế hoặc bỏ kiểm tra kế thừa.
- Palette: **2.220 đạt**, 0 thất bại trên **12 theme**. Bộ icon vẫn **23 định nghĩa Lucide SVG offline**, tái sử dụng Search/Check hiện hữu.
- Syntax: **48 file JS trong source/tests**, thêm **2 module build cấp web** = **50 file đạt**. Parse **2 CSS** đạt. `git diff --check` đạt; Git nhắc chính sách đổi LF/CRLF khi chạm một số file, không có lỗi whitespace.
- Renderer/CSP, offline resources, semantic reader, custom CSS và packaging đều đạt qua các suite kế thừa và verifier APK.

Chi tiết số lượng/suite: [RESULTS.json](../../test-results/ui-p3d/RESULTS.json), [SUITES.json](../../test-results/ui-p3d/SUITES.json), [PALETTE.json](../../test-results/ui-p3d/PALETTE.json). Log browser/Node/JVM trước/sau được lưu cùng evidence.

### Ca P3D mới

- Previous/Next/wrap, case-sensitive, regex/capture groups, literal replacement, zero-length và Unicode/surrogate pairs.
- Replace một/all đúng source và dirty state; nhập replacement không tự thay; bản nháp khác không bị sửa; điều hướng tài liệu vẫn giữ draft.
- Invalid regex/query cap, no-results, error reset, operational error không gán invalid sai, giữ nguyên query và source khi thất bại.
- Composition event mô phỏng, focus/caret và editor source không bị thay khi chỉ mở/đóng Search; transient marks được gỡ, DOM gốc trở lại; không reload reader ngoài ý muốn.
- 12 theme, selected có check, pressed không giữ lại, focus indicator, disabled, rapid toggle và reduced motion thay đổi giữa lúc dialog đang nhập.
- Submit/cancel Rename, tên mở rộng, validation lỗi, giữ input; Help lồng Settings và focus; Export readonly source và clipboard-denied fallback được mock để không ghi clipboard của người dùng.
- Open/Mode/Font keyboard navigation và Escape; các suite library/reader kế thừa kiểm tra long-press/contextmenu/F2.
- Host mô phỏng giữ Rename busy; chặn duplicate submit; Back không đóng khi đang busy; permission failure giữ tên, bật lại retry; Back đóng dialog trước Search và sau cùng mới trả exit contract. Không mở rộng quyền/ghi file trong fixture.
- Sáu chiều rộng **320, 360, 393, 412, 600, 800 CSS px**, landscape **844×390**, viewport thấp **393×360**, font **200%**. Không overflow ngang toàn app; panel/dialog/popover nằm trong viewport, điều khiển dưới panel cuộn tới được, vùng đọc còn diện tích.

Lệnh chính đã chạy từ repository:

```powershell
node --test web/tests/*.test.mjs
python build/ui-p3d/run-browser.py before 0
python build/ui-p3d/run-browser.py before 1
python build/ui-p3d/run-browser.py after 0
python build/ui-p3d/run-browser.py after 1
python build/ui-p3d/verify-native-after.py before
python build/ui-p3d/verify-native-after.py after
node build/ui-p3d/palette-check.mjs
node web/build.mjs
node web/tests/search-dialogs-ui.cjs
node web/tests/modal-native-states-ui.cjs
node build/ui-p3d/capture.cjs before
node build/ui-p3d/capture.cjs after
.\scripts\Build-AndroidDebug.ps1 -Offline -RerunTasks
python build/ui-p3d/verify-debug-apk.py
.\toolchain\android-sdk\platform-tools\adb.exe devices -l
git diff --check
```

Các lệnh dùng working directory và biến môi trường tương ứng harness; `build/ui-p3d` là công cụ tạm được ignore. Hai test P3D nằm trong source để chạy lại. Không thêm cấu hình chứa đường dẫn toolchain cá nhân hoặc thông tin nhạy cảm vào repository.

Test browser cần Playwright hiện có qua `NODE_PATH` và executable Chrome qua `MARKREAD_CHROMIUM`, không cài thêm package. History probe ưu tiên replay renderer snapshot trước/sau; checkout mới không có snapshot sẽ đối chiếu với observation đã lưu trong `test-results/ui-p3d/HISTORY.json`. Có thể chỉ định renderer cũ bằng `MARKREAD_SEARCH_BEFORE`. Kết quả P3D ở báo cáo này dùng replay cả hai renderer thật trong Chromium.

### Giới hạn Android và accessibility

`adb devices -l` trả danh sách trống. Chưa cài/chạy APK trên Android, chưa thử bàn phím Telex/VNI thực, selection toolbar native, TalkBack announcements, SAF provider/SD card, system bars/IME insets hoặc font scaling hệ thống thật. Browser composition và host simulation không tương đương các phép thử đó.

Accessible names/roles, error association, trạng thái aria, keyboard focus, 48 CSS px, font 200%, reduced motion và contrast token được kiểm tra tự động. Không tuyên bố đã đạt toàn bộ WCAG hoặc TalkBack qua các kiểm tra DOM này.

## 7. APK và renderer

Build **Gradle 8.9 + AGP 8.7.3 + JDK 17**, không đổi version hoặc signing. `assembleDebug` thành công trong **57 giây**, **31 task thực thi** với `-Offline -RerunTasks`.

- APK thực tế: `app/build/outputs/apk/debug/app-debug.apk`.
- Dung lượng: **7.606.226 byte**.
- SHA-256: `56e1ab37e97293367197cca2a72bb7a73414413bf1e82045b1d4fa333744e706`.
- Renderer: **13.309.986 byte**, tăng **8.765 byte** so với snapshot P3C.
- Renderer SHA-256: `32a2ed45cf0d5d7f67c4b550fb5a307016dface84a63c60656c1c7539a978a23`.
- APK signature, alignment, CRC, manifest/applicationId/version/permissions, CSP hash, font offline và asset chính xác: **18/18 đạt**. Không build/sign release.
- So sánh APK P3C đầu vào và APK P3D: cùng danh sách ZIP entries; **chỉ nội dung `assets/index.html` thay đổi**. DEX/native resources giữ nguyên. Không thêm Internet/storage permissions.

Xem [DEBUG_APK.json](../../test-results/ui-p3d/DEBUG_APK.json), [ARTIFACTS.json](../../test-results/ui-p3d/ARTIFACTS.json). APK cũ phục vụ rollback cục bộ: `build/ui-p3d/before/MarkRead-P3C-debug.apk`.

## 8. Screenshot và semantic evidence

Đã chụp **30 ảnh trước + 30 ảnh sau**, cùng fixture, viewport, theme, trạng thái, DPR=1, desktop Chromium **156.0.8078.49**, reduced motion để ảnh ổn định, caret ẩn. “Trước” tải renderer từ snapshot P3C bất biến, “sau” tải asset P3D. Đây là ảnh desktop browser, không phải Android screenshot.

Bao phủ sáu chiều rộng, landscape, viewport thấp, font 200%, invalid/no results, Rename/error, Help, Export, Open/Mode/Font và đủ 12 theme. Manifest: [before](../../test-results/ui-p3d/before/screenshots.json), [after](../../test-results/ui-p3d/after/screenshots.json).

Ảnh đại diện:

- Search dark 393px: [trước](../../test-results/ui-p3d/before/screenshots/393x852-dark-search-1x.png) · [sau](../../test-results/ui-p3d/after/screenshots/393x852-dark-search-1x.png).
- Search light 320px: [trước](../../test-results/ui-p3d/before/screenshots/320x852-light-search-1x.png) · [sau](../../test-results/ui-p3d/after/screenshots/320x852-light-search-1x.png).
- Font 200%: [trước](../../test-results/ui-p3d/before/screenshots/393x852-dark-search-2x.png) · [sau](../../test-results/ui-p3d/after/screenshots/393x852-dark-search-2x.png).
- Rename lỗi 320px: [trước](../../test-results/ui-p3d/before/screenshots/320x568-light-rename-error-1x.png) · [sau](../../test-results/ui-p3d/after/screenshots/320x568-light-rename-error-1x.png).
- Export: [trước](../../test-results/ui-p3d/before/screenshots/393x852-light-export-1x.png) · [sau](../../test-results/ui-p3d/after/screenshots/393x852-light-export-1x.png).
- Menu Open: [trước](../../test-results/ui-p3d/before/screenshots/393x852-dark-open-1x.png) · [sau](../../test-results/ui-p3d/after/screenshots/393x852-dark-open-1x.png).

Reader DOM chuẩn hóa của fixture trước/sau khớp byte, SHA-256 `f6da7d56229b56a3710722a56a011fbc9aaea5885db9089219ffd299ff84a678`. Suite reader P3C cũng đạt với fixture/hash kế thừa. [SEMANTICS.json](../../test-results/ui-p3d/SEMANTICS.json) lưu DOM và hash; các thay đổi source có chủ đích do Replace được kiểm tra riêng.

## 9. Rủi ro, rollback và nghiệm thu

Rủi ro còn lại:

- Undo sau Replace có giới hạn kế thừa đã nêu; đây là bằng chứng hiện trạng, không phải xác nhận Replace có undo transaction đầy đủ.
- Mapping `aria-invalid` dựa trên thông điệp validation tiếng Việt hiện hữu. Nếu thay nội dung/i18n cần cập nhật mapping hoặc thiết kế typed error riêng; không đổi contract engine trong P3D.
- Bàn phím Android có thể tạo viewport/insets khác browser resize. Dialog/panel đã có vùng cuộn nhưng vẫn cần kiểm tra thao tác cuối màn hình trên thiết bị thật.
- Native `<dialog>`/WAAPI và font scaling cần thử trên WebView tối thiểu được hỗ trợ. Hiệu năng tài liệu dài và chuyển theme chưa có frame trace trên phần cứng Android.

Rollback riêng P3D: khôi phục `web/src/app.css`, `web/src/app.js`, `web/src/shell.html` từ `build/ui-p3d/before/workspace` rồi build lại renderer, hoặc khôi phục cả asset trong snapshot để quay đúng byte P3C. Có thể bỏ ba file test P3D/report/evidence theo nhu cầu. Không dùng `git reset --hard HEAD`: HEAD còn ở P3B và sẽ làm mất thay đổi P3C chưa commit. Không thay app data, quyền SAF hoặc signing trong rollback source. APK snapshot P3C còn cục bộ để đối chiếu; việc cài bản cũ và kiểm tra dữ liệu cần người dùng thực hiện trên thiết bị.

Điều kiện nghiệm thu P3D cục bộ đã đạt: UI đúng phạm vi; đủ 1.816 test cũ + 170 test mới; palette và 18 kiểm tra APK đạt; DOM/search/native logic được đối chiếu; 60 ảnh và APK thực tế có hash; chưa chuyển giai đoạn. Chấp thuận để sử dụng trên Android vẫn cần người dùng kiểm thử bản APK và đánh giá hình ảnh/thao tác, đặc biệt IME, Back, TalkBack, SAF và giới hạn Undo đã công bố.

Đề xuất dành cho bước sau, **chưa triển khai**: ưu tiên QA Android trên WebView tối thiểu/hiện tại, TalkBack và Telex/VNI; đo frame timing/tài liệu dài; mở hạng mục riêng nếu muốn tích hợp undo transaction cho Replace; xem xét typed validation errors khi có kế hoạch bản địa hóa. Phạm vi P3E cần được người dùng duyệt riêng.
