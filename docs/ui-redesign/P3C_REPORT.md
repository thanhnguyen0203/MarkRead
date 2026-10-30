# P3C — Quiet Ink Reader, Editor & Toolbar

28/10/2026. Hoàn tất triển khai P3C; dừng trước P3D. **Android runtime, IME, TalkBack và SAF trên thiết bị thật vẫn chưa được xác minh.**

## 1. Đầu vào và implementation thực tế

Đối chiếu P0–P3B, đặc biệt [MASTER](../../design-system/markread/MASTER.md), [COMPONENTS](../../design-system/markread/COMPONENTS.md), [MOTION](../../design-system/markread/MOTION.md), [ACCESSIBILITY](../../design-system/markread/ACCESSIBILITY.md), [ICONS](../../design-system/markread/ICONS.md), [kế hoạch](IMPLEMENTATION_PLAN.md), [P2C](P2C_REPORT.md), [P2F](P2F_REPORT.md), [P2G](P2G_REPORT.md), [P3A](P3A_REPORT.md), [P3B](P3B_REPORT.md) và [checklist](REGRESSION_CHECKLIST.md). Không sửa tài liệu cũ.

Sử dụng [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md), guidance về line length, focus, targets, feedback, local overflow, reduced motion và typography. Tra cứu local `long form reading typography` trả đúng category Typography/Line Length ở kết quả đầu; áp dụng nguyên tắc giới hạn dòng theo cấu hình người dùng, không ép một width mới hoặc tải font ngoài.

Git đầu vào **sạch**, HEAD `d5a7e5b` (`Update P3B`). Đã lưu 126 file nguồn/test/docs/config và hash inventory tại `build/ui-p3c/before/workspace`, `before-sha256.json`; APK P3B nguyên bản ở `build/ui-p3c/before/MarkRead-P3B-debug.apk`. Chạy baseline mới trước sửa: **1.673/1.673 PASS, palette 2.220/2.220**. Browser tests chạy trong workspace cô lập.

Kiến trúc đã xác minh:

- Java Android + WebView; UI HTML/CSS/JavaScript. Reader là iframe `srcdoc`, sandbox không cho script; Marked/DOMPurify/KaTeX/Highlight.js/Mermaid chạy ở parent.
- Source editor là `#editor` textarea. Unified/block editing dùng textarea `.block-source` trong `.inline-editor` đặt theo block; **không có contenteditable hoặc editor framework**.
- Có Read, Source, Split và unified/block mode. Split chỉ hiện khi viewport hiện có cho phép; unified dùng menu/navigator đã triển khai, không phải source mode toàn bài.
- `mappedBlocks`, offsets UTF-16, suffix/newline, `replaceBlock`, reserve host height, `readingAnchor/restoreReadingAnchor`, textarea reuse và composition guards ở JavaScript. P3C không sửa bất kỳ hàm nào trong các luồng này.
- Source input giữ native undo/redo, Tab indent, Shift+Tab/Escape; composition defer render/sync tới end. Pixel view state từng file nằm trong RAM theo cơ chế P2C.
- Style reader theo thứ tự resolved tokens + font + paper CSS + KaTeX CSS + **custom CSS cuối**. Reader font/size/width/leading và persistence nguyên vẹn.

## 2. Reader layout và Markdown styling — A/B

Giữ chiều rộng người dùng chọn và gutter P2F: 20 px ở 320, 24 px ở điện thoại/tablet nhỏ, 48 px ở vùng rộng; bottom padding 64 px. Top padding giảm từ 40 xuống 32 px ở vùng rộng và từ 32 xuống 24 px ở mobile; tại 320 vẫn 24 px. Không thêm inset thứ hai, card từng đoạn hoặc panel chiếm vùng đọc.

Giữ H1/H2/H3 ở 1.8/1.4/1.2 em, H4–H6 ít nhất 1 em, font người dùng và line-height heading 1.35. Bỏ divider/padding dưới H2; H4–H6 có nhịp margin rõ hơn, H6 dùng secondary text đã resolve contrast. Paragraph vẫn 1 em, nested list có margin riêng; giữ semantic HTML, list/task checked và readonly state.

- Link có underline thường trực, offset nhẹ để nhận biết ngoài màu; focus ring P2A còn nguyên.
- Blockquote dùng accent rule 2 px, surface quote và padding gọn; không ép italic hoặc sửa nội dung.
- Inline code/code block dùng mono stack local, radius và spacing nhất quán. Code block 0.875 em/1.65; giữ whitespace/pre/tab-size và horizontal overflow cục bộ.
- Table có header surface rõ, bỏ vertical grid thừa, giữ row separators; padding responsive, wrapper scroll ngang. Không cắt cell hoặc giấu scrollbar để che overflow.
- Display LaTeX dùng overflow auto cả hai trục, không dùng hidden vertical overflow ở wrapper. Không đổi KaTeX config, MathML hoặc công thức.
- Ảnh giữ max-width/height:auto và tỉ lệ gốc; radius nhẹ. Details/summary vẫn native, summary có target tối thiểu 48 CSS px. HR dùng border token.
- Selection reader dùng selected/selected-text token. Không animation Markdown DOM, caret hoặc text selection.

Thêm component tokens nội bộ reader `--mr-reader-mono`, `--mr-reader-radius`, `--mr-reader-block-gap`. Mọi màu mới tham chiếu semantic tokens; không thêm palette theo màn. Custom CSS vẫn có thể override các rule này vì đứng sau và không bị blanket `!important` mới đè lên.

Footnote extension không được renderer hiện tại cung cấp như một feature riêng; fixture giữ cú pháp footnote theo kết quả parsing cũ. Không thêm parser extension để phục vụ styling.

Gate A/B: Reading **46/46**, Typography **36/36** sau đổi paper CSS; source/inline/custom CSS tests tiếp tục đạt.

## 3. Editor, toolbar và feedback — C/D/E

Source textarea vẫn 16/26 monospace, padding P2F, native resize/selection/history. Caption có surface riêng, nhãn MARKDOWN và hint tách cấp độ; min-height 40 px, cho wrap khi text lớn. Nền/chữ/caret/selection dùng tokens của theme. Focus-visible là neutral 2 px inset trong field; không glow hoặc ring xanh, không xóa chỉ báo keyboard để làm đẹp ảnh. Source luôn `animation:none`, `transition:none`, scroll auto.

Không đổi `.block-source` geometry, autosize, host reserve, focus hoặc event handlers. Không thêm line numbers, minimap, rich text hoặc source syntax highlighting. Code highlighting trong reader vẫn do library đã có.

Toolbar giữ toàn bộ DOM/ID, layout 1 hàng rộng / 2 hàng hẹp, kích thước 48 px, gap và actions cũ. Thêm surface nhẹ cho nhóm điều hướng/tìm; Lưu bản sao có sage selected surface làm điểm nhấn. Nút tìm/More dùng selected surface khi `aria-expanded=true`; pressed tint là trạng thái riêng, kết thúc theo pointer release. Disabled vẫn là disabled thật và dùng token cũ. Không thêm hàng thứ ba, nút hoặc popup mới.

Tên file rõ hơn bằng heading color; dirty marker có sẵn tiếp tục dùng accent và accessible description cũ. Menu mode có padding/radius/elevation Quiet Ink; radio checked state vẫn cập nhật bằng handler cũ. Caption source và menu mode thể hiện ngữ cảnh đọc/sửa; không tạo mode preference mới. Navigator unified được thống nhất border/surface/action hierarchy, giữ nút hoàn tất/hủy đã có.

Mở file vẫn ở Sidebar P3B; không nhân đôi nút. Undo/redo dùng cơ chế bàn phím/native hiện có, không có toolbar button để thêm hay loại bỏ. Giữ Ctrl/Cmd+O/S/F/H, F2, source Tab/Shift+Tab/Escape, inline Ctrl/Cmd+Enter/Escape, Back và modal order.

Không thay logic save/dirty hoặc thông báo xuất bản sao. Empty document vẫn là article rỗng với padding và title hiện có; không thêm autosave/history/loading giả hoặc thông báo nổi mới.

## 4. Bảo toàn interaction, motion và kiến trúc

**Không sửa production JavaScript, HTML shell, Java, bridge hoặc renderer.** Thay đổi production chỉ là hai stylesheet append-only. [SCOPE.json](../../test-results/ui-p3c/SCOPE.json) kiểm tra hash 121 file đầu vào khác nguyên vẹn, bao gồm app.js, source block mapping, Settings P3A, Sidebar P3B, native policies, tokens/themes, SVG/license và build/dependency config.

Tái sử dụng P2G duration/easing cho control/menu; không thêm motion dependency, timer, DOM observer, rAF loop, transition height/width/font hoặc slide toàn trang. Thuật toán toolbar auto-hide/margin/scroll intent vẫn của P2G, không tuyên bố đã tối ưu phần đó. Reduced motion media OR native tiếp tục điều khiển UI như trước.

Các hành vi được kiểm chứng: source selection trước chuyển mode; native undo/redo; menu/Settings giữ selection và reader document; close Settings trả focus control, không đưa vào textarea/IME; composition guard không cho đổi mode sớm; Split/Read giữ draft; popup giữ pixel scroll; inline dùng cùng textarea và cancel trả source đúng.

Đổi typography làm reflow là hành vi cần thiết; việc giữ vị trí vẫn theo anchor/pixel restoration cũ. Không hứa cùng một từ luôn ở cùng vị trí sau mọi thay đổi font/custom CSS hoặc sau cập nhật app. Không triển khai lại DOM→source mapping, virtualize hoặc sửa block editor.

## 5. File sửa/tạo

Production có sẵn:

- [paper.css](../../web/src/paper.css): reader layout và Markdown rules P3C.
- [app.css](../../web/src/app.css): source/caption, toolbar, mode popup và navigator rules P3C.
- [Android index.html](../../app/src/main/assets/index.html): asset sinh lại; web/dist và APK debug cũng được build mới.

Test/fixture mới:

- [reader-redesign-ui.cjs](../../web/tests/reader-redesign-ui.cjs).
- [reader-fixture.cjs](../../web/tests/reader-fixture.cjs), [quiet-ink-reader.md](../../web/tests/quiet-ink-reader.md): nội dung có H1–H6, Unicode, nested/task lists, code/whitespace, table, LaTeX, ảnh local và details; helper tạo long fixture và PNG test bằng canvas, không đóng gói thêm asset app.
- [empty-folder-fixture-ui.cjs](../../web/tests/empty-folder-fixture-ui.cjs): MessagePort snapshot count0/folder=true, không thay File Browser.

Hai test cũ [foundations-ui.cjs](../../web/tests/foundations-ui.cjs), [revision-ui.cjs](../../web/tests/revision-ui.cjs) giữ số assertion nhưng kiểm nút về **resting surface sau panel close** thay vì cố định transparent. P3C có nền button nhẹ và selected khi panel mở; không gọi selected là pressed bị kẹt. Không bỏ assertion dữ liệu/security/editor.

Ngoài các file này là báo cáo và [test evidence](../../test-results/ui-p3c/); không thêm dependency hoặc sửa lockfile, applicationId/signing/config.

## 6. Kết quả kiểm thử

[RESULTS.json](../../test-results/ui-p3c/RESULTS.json), [suite summaries](../../test-results/ui-p3c/SUITES.json); raw logs tại `build/ui-p3c/{before,group-ab,after}`:

- **1.673 kế thừa PASS, 0 FAIL**: Node 132 + browser 1.345 + JVM 171 + APK baseline 25.
- **143 mới PASS, 0 FAIL**: Reader/Editor/Toolbar 139 + empty-folder host fixture 4. Không cộng lại lượt before của fixture mới hoặc các smoke run.
- **Tổng 1.816 PASS, 0 FAIL**. Settings P3A 148, Library P3B 112, các suite keyboard/native-host/Reading tiếp tục giữ nguyên số kiểm tra.
- **Palette 2.220/2.220** tính riêng; đủ 12 theme và 23 Lucide SVG offline. Không thay palette hoặc asset registry.
- **18/18 Gradle APK checks** tính riêng: variant/ID/version/SDK, debug signature/alignment/CRC, exact renderer/notices/DEX, CSP/sandbox/offline font, permissions và không đóng gói credentials.
- Syntax 48 JS/build/test files, parse 2 CSS, byte identity web/Android bundle và `git diff --check` đạt.

New reader suite kiểm tra 320/360/393/412/600/800, landscape 844×390 và wide 1280×800; toolbar target/clearance, top inset, code/table local overflow, math, ảnh tỉ lệ 3:1, source spans, text history, focus/selection, composition guard, Split, unified/cancel, 12 theme, pressed cancellation, custom CSS, Merriweather/size, text200%, reduced motion và long document/scroll.

**Markdown DOM trước/sau byte-identical** sau khi chỉ chuẩn hóa URL blob của ảnh test. Không bỏ tag, nội dung, inline style KaTeX hoặc source-span attributes khỏi phép so sánh. [SEMANTICS.json](../../test-results/ui-p3c/SEMANTICS.json): SHA-256 cả hai là `c59f92722bf303b1b9a01369b9a79df03ff88dd3249833b3a848a1009faab9a3`. Source fixture theo LF đúng contract decoder; nội dung editor được so sánh nguyên chuỗi.

Diagnostic harness đã sửa: fixture JS ban đầu cần tách Markdown có backtick ra file `.md`; fixture đọc CRLF trên Windows cần chuẩn hóa theo decoder contract. Init script test không được ghi lại localStorage trong iframe mỗi lần reader render — đã giới hạn vào top-level lần đầu, rồi kiểm persistence lại. Các thay đổi đó ở fixture/test, không sửa app để né failure. Hai visual assertions cũ được cập nhật như mục5.

## 7. Build và APK

Chạy `scripts/Build-AndroidDebug.ps1 -Offline -RerunTasks` với quyền thực thi loopback Gradle. **BUILD SUCCESSFUL in 1m 9s; 31 actionable tasks, 31 executed.** Giữ Gradle8.9 + AGP8.7.3 + JDK17; applicationId `vn.markread.local`, version1.1.5/code115, min26/target35/compile35 và debug certificate của Build Gate.

[APK debug P3C](../../app/build/outputs/apk/debug/app-debug.apk): **7.604.078 bytes**, SHA-256 **`0ce9008b9267ffd248c3270338856d59b1d253fdcabd7b56334a79e5d631bce6`**.

Renderer **13.301.221 bytes**, SHA-256 **`b9beb76a549695fde9ed35e692f6ffc3542d6400eafcc1e267dc4553ad9d130c`**. So với P3B tăng 5.484 bytes HTML và 1.480 bytes APK. Entry list không đổi; chỉ `assets/index.html` đổi byte. DEX, Manifest/resources, notices và native code nguyên vẹn. Đây là APK debug, không phải artifact ký release. [ARTIFACTS.json](../../test-results/ui-p3c/ARTIFACTS.json), [packaging checks](../../test-results/ui-p3c/debug-apk-checks.json).

## 8. Visual evidence và performance

**27 ảnh trước + 27 ảnh sau**: 26 reader/editor/mode/theme cases và một empty-folder host fixture cho mỗi phía. Windows Chromium156/Playwright, DPR1, reduced motion, cùng viewport/source/theme/font/UI scale; caret được ẩn khi chụp để so ảnh ổn định. Không phải ảnh Android hoặc phép đo FPS.

- [Before manifest](../../test-results/ui-p3c/before/manifest.json), [after manifest](../../test-results/ui-p3c/after/manifest.json): sáu width yêu cầu, landscape/table, Source, Split, inline, menu, Merriweather, text200%, empty document và 12 theme.
- Ví dụ [reader trước](../../test-results/ui-p3c/before/393x852-dark-read-sans-1x.png), [reader sau](../../test-results/ui-p3c/after/393x852-dark-read-sans-1x.png), [Source](../../test-results/ui-p3c/after/393x852-dark-edit-sans-1x.png), [Split](../../test-results/ui-p3c/after/1280x800-light-split-sans-1x.png), [inline](../../test-results/ui-p3c/after/393x852-dark-inline-sans-1x.png), [table/math landscape](../../test-results/ui-p3c/after/844x390-light-table-sans-1x.png).
- [Empty folder trước](../../test-results/ui-p3c/before/393x852-dark-empty-folder.png), [sau](../../test-results/ui-p3c/after/393x852-dark-empty-folder.png), [metadata](../../test-results/ui-p3c/after/empty-folder.json). Fixture chứng minh generic empty UI khi nhận metadata root rỗng, không thêm khả năng hiển thị thư mục con rỗng hoặc chứng minh SAF provider thật.

Long fixture **173.410 bytes**, 180 chương thêm, tổng181 code blocks; kiểm source exact, DOM không animation, đọc/cuộn tới cuối và không body overflow ngang. Lượt cuối ghi nhận **406 ms** từ Playwright import tới headings-ready trên desktop trong phiên đã dùng các font đó, không phải full paint/resources, Android, cold open, input latency hoặc benchmark cải thiện so với P3B. [Phạm vi số đo](../../test-results/ui-p3c/PERFORMANCE.json); không tuyên bố đạt60FPS hoặc giảm thời gian mở file.

Không thêm runtime JS, observers hoặc full-document render khi chỉ mở/đóng control. Re-render do theme/font/custom CSS hoặc source thay đổi vẫn theo pipeline cũ. Chưa profile gần5MiB, nhiều ảnh/8 Mermaid hoặc Android long tasks/scroll traces. Không thay lazy image loading/decoding và diagram caps.

## 9. Còn thiếu, rollback và P3D

`adb devices -l` trả danh sách trống. Chưa cài/chạy APK, chưa WebView100/current Android, IME Việt thật, TalkBack, physical keyboard/gesture Back, OEM font/display scaling, dp/insets, SAF và lifecycle/recovery thực. Browser keyboard/undo/composition events và CDP checks không thay thế Android runtime.

Rủi ro cần review: typography/spacing mới làm đổi wrap/chiều cao khối; source caret/anchor vẫn phụ thuộc cơ chế cũ, custom CSS có thể override layout/contrast. Focus ring neutral 2px được giữ rõ cho accessibility. Header auto-hide và editor autosize cũ vẫn có layout work; chưa đo CLS/p95 input latency hoặc tối ưu các thuật toán đó. Footnotes và child empty-folder metadata chưa phải feature renderer/SAF hiện có.

Rollback riêng P3C: khôi phục `app.css`, `paper.css`, hai test visual đã sửa và Android asset từ `build/ui-p3c/before/workspace`; bỏ ba file test/helper CJS mới cùng Markdown fixture nếu cần. Rebuild renderer/APK bằng script cũ; renderer P3B phải về `5d7961ec...`. APK P3B nguyên bản có trong backup; không cần đổi key/version hoặc đụng dữ liệu file. Có thể giữ report/evidence làm lịch sử.

Điều kiện chuyển P3D: người dùng duyệt UI/ảnh P3C; 1.816 tests, palette và packaging tiếp tục đạt; không có lỗi mất source/draft/undo, keyboard focus/caret hoặc theme/custom CSS. Thử APK trên Android với nhập Việt, selection/IME, đọc/sửa block, Back, scroll, SAF và font/display size trước khi coi native QA đã đạt. **Dừng tại P3C; không tự triển khai P3D–P3F.**
