# P3A — Settings & Theme Picker

Ngày 28/10/2026. Triển khai Quiet Ink cho Settings trên Java Android + WebView, HTML/CSS/JavaScript. Dừng tại P3A. **Chưa xác minh Android runtime trên thiết bị.**

## Thiết kế và đầu vào

Đối chiếu P0–P2G, đặc biệt [MASTER](../../design-system/markread/MASTER.md), [COMPONENTS](../../design-system/markread/COMPONENTS.md), [MOTION](../../design-system/markread/MOTION.md), [ACCESSIBILITY](../../design-system/markread/ACCESSIBILITY.md), [ICONS](../../design-system/markread/ICONS.md), [kế hoạch](IMPLEMENTATION_PLAN.md), [P2F](P2F_REPORT.md), [P2G](P2G_REPORT.md) và [Build Gate](ANDROID_BUILD_GATE.md). Không ghi đè các tài liệu này. P3A thay thế mẫu category selector hẹp của P1/P2F bằng danh sách → chi tiết theo yêu cầu mới.

Sử dụng [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md): tra cứu local `settings navigation progressive disclosure focus not obscured`, kết hợp guidance về labels, native controls, targets, focus, spacing và reduced motion. Giữ Lucide offline theo yêu cầu dự án; không áp framework hoặc palette sinh tự động.

Git đầu vào HEAD `7fe84d0`, nhiều thay đổi P2 và Build Gate chưa commit. Lưu bản sao source/test/docs và inventory trước sửa tại `build/ui-p3a/before/workspace`, `before-sha256.json`; APK P2G ở `build/ui-p3a/before/MarkRead-P2G-debug.apk`. Không reset, stage hoặc commit. **Baseline chạy mới trước sửa đạt 1.413/1.413; palette 2.220/2.220.**

## Cấu trúc và luồng Settings

- Giữ 5 nhóm: Màu giao diện; Font chữ & bố cục; Đọc & chỉnh sửa; CSS riêng; Chung & hướng dẫn. Giữ mọi ID và tùy chọn hiện có.
- Viewport dưới 720 CSS px hoặc thấp hơn 600 CSS px: mở Settings vào danh sách một cột. Chọn nhóm mở chi tiết; nút “Cài đặt” có chevron trái trở về danh sách và focus nhóm đang chọn. `aria-current` giữ danh mục trong phiên.
- Khi đủ chỗ: nav 200 px, nội dung bên phải, dialog tối đa 760 px. Selection và nội dung dùng chung state với bố cục hẹp. Không có route, Activity hoặc persistence schema mới.
- Trên màn hình hẹp, Escape/native-facing Back đóng menu font trước, sau đó từ chi tiết về danh sách, cuối cùng đóng Settings. Nút X đóng trực tiếp từ cả hai trang. Help vẫn là dialog trên cùng và đóng về Settings.
- Mobile dùng `.settings-layout` làm vùng cuộn trang; header/Back nằm ngoài vùng này. Textarea và danh sách font có cuộn cục bộ khi cần. Không cộng thêm system/IME inset vì native root đang sở hữu insets.
- Category heading nhận focus tức thì khi chuyển từ danh sách. Breakpoint chuyển trạng thái điều hướng không để focus nằm trong nav/Back vừa bị ẩn. Native select cũ giữ trong DOM nhưng `hidden` để tương thích ID/value và fixture; không xuất hiện như control thứ hai trong accessibility tree.

## Components, theme và font

Header dùng typography, spacing và surface Quiet Ink; nav có Lucide + nhãn đầy đủ, selected tint rõ và chevron ở mobile. Field, reader-font selector và slider được nhóm bằng surface/border nhẹ; label và giá trị số phân cấp riêng, giá trị dùng tabular numerals. Range vẫn là input native, target tối thiểu 48 CSS px, không đổi min/max/step hoặc handler lưu.

Theme picker giữ **12 ID/tên**. Mỗi card có tên, check/`aria-pressed` và preview 48 px: nền, mặt bên, heading, text và accent lấy từ chính `resolvedThemes`. Preview `aria-hidden`; accessible name chỉ đọc tên theme. Tile vẫn dùng palette riêng, focus neutral lấy từ shell. Card/grid tự xuống một cột khi chữ hoặc không gian yêu cầu. Không tải thumbnail, không lấy màu minh họa tùy ý.

Giữ 4 reader font sans/serif/Merriweather/mono và font offline. Nhãn “Phông chữ bài đọc” phân biệt rõ với UI font hệ thống. UI font, paragraph spacing, color picker và number input không phải tùy chọn hiện có nên không thêm logic mới. Các khoảng size 12–32, width 480–1400, leading 1.2–2.4 và defaults/schema giữ nguyên. Không sửa font scaling, Markdown stylesheet hoặc renderer.

Hai switch vẫn là checkbox native có role switch; row label, track, pressed/focus/disabled kế thừa P2. Không thêm confirmation/reset toàn app hoặc tùy chọn tự lưu mới.

## Custom CSS và dữ liệu

CSS editor dùng monospace hiện có, padding rõ, vùng nhập tối thiểu 192 px, import/reset/apply target 48 px và thông báo tại chỗ. Giải thích rõ: nhập tệp hoặc sửa text chưa áp dụng vào bài; bấm Áp dụng mới dùng.

P3A bổ sung **CSS draft trong RAM** để không mất text chưa áp dụng khi chuyển nhóm hoặc đóng/mở Settings. Input/import cập nhật draft; Apply thành công hoặc Xóa CSS kết thúc draft. Không persist draft, không autosave CSS chưa áp dụng. Parser, giới hạn, cancellation/error, `persist()`, import bridge và thứ tự `readerStyle + settings.css` vẫn giữ cơ chế cũ. Reload/process death vẫn mất draft chưa áp dụng; CSS đã Apply được lưu như trước.

Theme và setting tiếp tục lưu ngay qua `settingsChange → uiSettings/persist/scheduleRender(80)`; Android theme dùng API cũ. Không thay reader/editor internals, file browser, search/replace, undo/redo, grants/SAF hoặc Java/native lifecycle.

## Motion và hiệu năng

Tái sử dụng controller P2G: dialog enter 200 ms, section/list enter 120 ms, controls và theme check dùng tokens cũ. State, focus, ARIA và Back cập nhật tức thì. Reduced motion giữ media OR native flag và hủy effect đang chạy. Không thêm dependency, observer, polling, animation vào Markdown/caret hoặc vòng rAF mới.

Theme đổi atomic theo P2G, không crossfade toàn tài liệu. Chỉ thêm 12 preview nhỏ và icon nav, không thêm node theo độ dài bài. Chưa đo FPS, input latency hoặc hiệu năng Android; không khẳng định đạt 60 FPS.

## File thay đổi

Production sửa đúng ba source:

- [shell.html](../../web/src/shell.html): nav/back, mô tả reader font/CSS; giữ IDs.
- [app.css](../../web/src/app.css): block P3A scoped Settings, preview và adaptive layout.
- [app.js](../../web/src/app.js): preview DOM, view home/detail, focus/Back, CSS draft RAM.

Generated: [Android asset](../../app/src/main/assets/index.html), web/dist bundle và APK debug. Java, bridge module, preferences/tokens/themes, paper.css, dependency/lockfile, build scripts, Manifest/resources, 23 SVG và license không đổi so với đầu vào.

Test mới: [settings-redesign-ui.cjs](../../web/tests/settings-redesign-ui.cjs). [layout-helpers](../../web/tests/layout-helpers.cjs) và 17 browser drivers kế thừa đi qua danh sách trước khi thao tác trên chi tiết; xem [danh sách file](../../test-results/ui-p3a/source-changes.json). Giữ toàn bộ số assertion kế thừa. Chỉ đổi kỳ vọng accessible name sang “Phông chữ bài đọc”, thêm bước Back/Escape qua list; chờ breakpoint event trước kiểm tra sidebar thay vì đọc state ngay sau resize. Không xóa kiểm tra dữ liệu/security hoặc hạ điều kiện pass.

## Kết quả kiểm thử

[RESULTS.json](../../test-results/ui-p3a/RESULTS.json), raw logs ở `build/ui-p3a/{before,after}`:

- **1.413 kế thừa PASS, 0 FAIL**: Node 132 + browser 1.085 + JVM 171 + APK baseline 25.
- **148 kiểm tra Settings mới PASS, 0 FAIL**, chạy bằng Chromium thật.
- **Tổng 1.561 PASS, 0 FAIL**. Palette **2.220/2.220** tính riêng; Gradle APK **18/18** tính riêng.
- Giữ icon suites 61/70 và Node icon tests trong baseline, đủ 23 SVG offline; renderer web/Android byte-identical.
- Ma trận mới: 320/360/393/412/600/800 CSS px; 5 nhóm; nav/back/focus/current/overflow; 12 theme/preview/selection/focus; native range keyboard và persistence; Merriweather; CSS draft/apply/reload/precedence; editor draft; 200% text; rapid navigation/reduced motion.
- Bộ cũ tiếp tục kiểm search, file scope, rename, source/export bytes, startup/session, menu, keyboard/IME simulation và native-facing Back. Browser/host simulation không thay Android runtime.

Các lỗi trong vòng kiểm tra đã xử lý: rule P2F `:focus-within` giới hạn chiều cao nav ngay khi pointerdown, làm trượt click ở viewport thấp; test persistence mới vô tình khởi tạo localStorage mỗi lần reload; kiểm CSS phải so với CSS đã được parser chuẩn hóa. Chạy lại các ca sau sửa. Khi chuyển runner sang workspace cô lập, bổ sung icon manifest fixture; không thêm dependency ứng dụng.

Các screenshot cũ mà lượt chạy root ban đầu ghi lại đã được khôi phục về đúng bản sạch đầu vào. Các lượt cuối chạy trong `build/ui-p3a/after/workspace-*`, không ghi đè bằng chứng lịch sử.

## Build và APK

Đã chạy `scripts/Build-AndroidDebug.ps1 -Offline -RerunTasks` với quyền thực thi phù hợp loopback Gradle. **BUILD SUCCESSFUL in 19s, 31 tasks executed.** Giữ Gradle 8.9 + AGP 8.7.3 + JDK 17, applicationId/version/signing configuration.

[APK debug P3A](../../app/build/outputs/apk/debug/app-debug.apk): **7.601.198 bytes**, SHA-256 `c752ecc515a9148f121255aca8c0fecbacace530bd696c70d45d40ce6688f85c`.

Renderer: **13.290.985 bytes**, SHA-256 `5c225beedae3e275534b5d5f0b51bd748151f9f04dd65ab39a3ec19bdf8826f8`. So với P2G tăng 11.378 bytes HTML, 2.532 bytes APK. Không thêm/bớt APK entry; chỉ `assets/index.html` đổi byte. DEX, Manifest/resources/notices giữ nguyên. Debug certificate giữ Build Gate, không phải certificate release. [Artifact hashes](../../test-results/ui-p3a/ARTIFACTS.json), [18 packaging checks](../../test-results/ui-p3a/debug-apk-checks.json).

## Ảnh trước/sau

32 ảnh desktop Chromium 156 / Playwright, DPR 1, reduced motion, cùng Markdown fixture và cấu hình. Đây là CSS viewport, không phải ảnh Android hoặc bằng chứng dp/FPS.

- [9 ảnh trước và metadata](../../test-results/ui-p3a/before/manifest.json), [9 ảnh sau và metadata](../../test-results/ui-p3a/after/manifest.json): 320×568, 360×800, 393×852, 412×915, 600×960, 800×393, 844×390, 800×1280 và typography 200% tại 393×852.
- [12 theme](../../test-results/ui-p3a/themes/manifest.json), [navigation mobile/wide](../../test-results/ui-p3a/navigation/manifest.json).
- Ví dụ [font trước](../../test-results/ui-p3a/before/320x568-light-typography-1x.png), [font sau](../../test-results/ui-p3a/after/320x568-light-typography-1x.png), [danh mục mobile](../../test-results/ui-p3a/navigation/393x852-dark-home-1x.png), [hai panel](../../test-results/ui-p3a/navigation/800x900-light-appearance-1x.png).

## Giới hạn, rollback và P3B

`adb devices -l` không có thiết bị/emulator. Chưa cài/chạy APK, chưa xác minh WebView 100/current Android, TalkBack, IME Việt, gesture Back, system bars/keyboard insets, density/48 dp, font/display scaling, native animator scale, lifecycle hoặc SAF provider/grants. Chưa đo tài liệu gần 5 MiB trên Android. Mô phỏng viewport/200% root text không chứng minh Android font scaling.

Điểm cần review: mobile có thêm tầng Back từ chi tiết về danh sách; theme card cao hơn và 12 lựa chọn cần cuộn; menu font vẫn giữ pattern listbox cũ cần TalkBack thật. CSS draft RAM không được phục hồi sau reload/process death. Vị trí đọc sau đổi typography vẫn theo pixel restoration cũ, không có semantic anchor mới.

Rollback riêng P3A: khôi phục ba source, Android asset và 18 test/helper đã sửa từ `build/ui-p3a/before/workspace`; bỏ test Settings mới nếu cần. Rebuild bundle và APK bằng script cũ; renderer P2G phải trở về `1d1a55ef...`. Có thể giữ báo cáo/evidence làm lịch sử. Không reset repository về HEAD vì sẽ mất các bước P2 chưa commit; APK P2G nguyên bản có trong snapshot.

Điều kiện chuyển P3B: người dùng duyệt thiết kế P3A, 1.561 kiểm tra và palette/package tiếp tục đạt, không có lỗi mất draft/setting hoặc focus không truy cập được. Thử APK trên Android để đánh giá Back/IME/TalkBack/insets/SAF và các theme trước khi coi native QA đã đạt. **Không tự triển khai P3B–P3F.**
