# P3F-R — Remediation & Android Revalidation

> Cập nhật29/10/2026: kết quả bên dưới là lịch sử P3F-R. Gate hiện hành: **READY FOR P4**, xem [P3F-R2](P3F_R2_RELEASE_READINESS.md). TalkBack là **NOT TESTED — accepted limitation** theo người dùng; không giữ TalkBack làm blocker.

28/10/2026. Dùng skill `ui-ux-pro-max`, giữ Design System Quiet Ink và kiến trúc Java Android + WebView. **Chưa đủ điều kiện phát hành/P4**; xem [release gate](P3F_R_RELEASE_READINESS.md). Không redesign, thêm dependency, đổi bridge, permissions, applicationId, version hoặc signing.

## Đầu vào và bảo toàn workspace

P3F kết luận NOT READY: Replace thiếu Undo; màu lỗi KaTeX ở9 theme tối; IME/TalkBack/provider coverage chưa đủ. Đọc các báo cáo P3F, tài liệu P0–P3E liên quan và Design System. Git HEAD `d5a7e5b`; workspace đã có P3C–P3F chưa commit. Snapshot141 đầu vào, hashes và Git status ở `build/ui-p3fr/before*`. Không reset, stage, uninstall hoặc clear data. Chỉ diff với snapshot P3F mới xác định đúng phạm vi remediation, không dùng toàn bộ diff với HEAD làm danh sách thay đổi P3F-R.

Baseline trước sửa: Node132 + browser1769 + JVM171 + APK25 = **2097/2097**, palette2220/2220. Emulator5554 đang có phiên chỉnh sửa/Gboard nên không cài đè hoặc dừng phiên này. Tạo AVD riêng `MarkRead_P3FR_Validation`, cổng5556, từ system image API35 đã có; không tải SDK/image. Dữ liệu QA ở `Documents/MarkReadP3FR_20261028`, không dùng dữ liệu cá nhân.

## R1 — Replace/Undo

Lỗi thực tế tái hiện trên Chromium156 và APK P3F cũ, Android15/WebView124. Fixture `# A\n\none one`: Replace `one→two`, đóng Search, native Undo. Expected nguồn ban đầu; actual cũ vẫn `two one`. Probe Android trước sửa có1 failure dự kiến, không được gộp làm regression sau sửa. [Trước](../../test-results/ui-p3fr/ANDROID_UNDO_BEFORE.json), [sau](../../test-results/ui-p3fr/ANDROID_UNDO_AFTER.json).

Nguyên nhân: gán `.value` không tạo native undo transaction. [Kế hoạch trước patch](P3F_R_UNDO_PLAN.md) chọn adapter nhỏ trên chính textarea hiện có; không xây history engine hoặc sửa mapping block.

`text-transaction.js` tính khoảng khác biệt liên tục, tránh cắt UTF-16 surrogate pair, chọn khoảng đó và dùng native `execCommand('insertText')`. Kiểm tra kết quả đúng toàn bộ source; nếu không focus được hoặc API không thực hiện đúng, hoàn nguyên chính xác nguồn cũ và báo lỗi, không báo Replace thành công qua fallback `.value`. Source pane ẩn chỉ được chiếu fixed/opacity0 trong cùng task; trả style, scroll, inputmode, focus/selection của trigger. Input event commit không đi vào handler sourceInput lần hai; Undo/Redo sau đó vẫn đi qua handler hiện có.

Chặn Replace khi editor/Search/Replace đang composition, **cả trước request và ngay trước commit khi worker trả lời**. Ctrl/Cmd+Z/Y ở reader dùng native source buffer; input/textarea, inline editor, modal, drawer và composing giữ ownership bàn phím. Không thêm autosave hoặc thay semantics worker.

Chromium mới:68 checks gồm Replace một/all/nhiều block, captures, zero-length, literal `$1`, tiếng Việt, emoji, selection, dirty, transaction liên tiếp, typing sau Replace, read/split/unified, modal interruption, API unsupported fail-closed và composition bắt đầu trong lúc request pending. Android APK mới:23/23 checks gồm exact source, native Undo/Redo cho5 nhóm và read/split. Shortcut Android được dispatch qua harness, không phải hardware-keyboard acceptance.

Giới hạn giữ lại: native history giữa nhiều text fields không đi lùi tới typing Source trước khi chuyển qua Search; probe trước/sau cùng kết quả. Adapter phục hồi chính xác draft ngay trước Replace, không cam kết history xuyên field/file/reload. API deprecated; WebView100 và thiết bị thật chưa thử. Partial native command có thể cần hoàn nguyên `.value` trên nhánh lỗi; nội dung được giữ nhưng không hứa bảo toàn toàn bộ buffer lịch sử trong renderer lỗi.

## R2 — LaTeX

Không sửa CSS/parser/math engine. Đo glyph, toán tử, ký hiệu trong inline `$x^2+1$` và display fraction/sqrt, cùng unknown command và màu tác giả `\color{#cc0000}{\text{x}}`. Normal glyphs đạt4.5 trên cả12 theme. Error output có `#cc0000`, dùng các class layout thông thường như `mord text`, không có semantic error marker riêng; cùng màu có thể do tác giả chủ động đặt. Không dùng selector màu để ghi đè toàn bộ công thức.

Lỗi contrast còn ở **dark2.68, black3.39, tokyo-night2.90, blue-gray2.24, nord2.12, dracula2.42, rose-pine3.00, forest2.55, gruvbox2.50**; inline/display cùng tỷ lệ trên nền thực. Light5.89, sepia5.13, tokyo-light4.55 đạt.36 diagnostic checks đạt không biến9 contrast failures thành PASS. [Measurements trước](../../test-results/ui-p3fr/LATEX_BEFORE.json), [sau](../../test-results/ui-p3fr/LATEX_AFTER.json), [ảnh cùng393×852](../../test-results/ui-p3fr/math/). Measurements trước/sau khớp; custom CSS và explicit author color giữ nguyên. Cần phạm vi riêng cho error presentation có thể phân biệt lỗi trước khi đổi CSS; chưa tự sửa renderer.

## R3–R5 — Runtime thực tế và giới hạn

Android15/API35, WebView124.0.6367.219, QA320×640dp/density160. Khác viewport emulator P3F cũ1080×2400/density420; ảnh đối chiếu LaTeX dùng cùng viewport Chromium, không so pixel giữa hai AVD.

Gboard thật, Vietnamese QWERTY: chạm từng phím `tieengs vieetj` tạo `Tiếng việt`; `ddungs` ở dòng mới tạo `Đúng` do auto-capitalize; Backspace ra `Đún`; chuyển Home/quay lại giữ source, caret và dirty. Native trusted beforeinput/input có insert/delete để đổi dấu; chuỗi này **không phát composition events**, nên không chứng nhận mọi đường composition. Raw expectation chữ thường ở ca dòng mới được giữ INCONCLUSIVE; review ghi rõ auto-capitalization và exact result, không quy thành lỗi app. VNI, sửa dấu giữa câu, native selection/copy/paste, unified và Search IME đầy đủ vẫn NOT TESTED. Không dùng ADB input text làm bằng chứng IME.

APK cuối cũng đã nhập Telex `ddungs→Đúng` bằng Gboard thật, có trusted input và dirty/caret đúng. Android Back lần1 đóng IME, vẫn Source và giữ draft; lần2 chuyển Read, source/dirty không đổi. [Final IME](../../test-results/ui-p3fr/IME_FINAL_APK.json), [Back](../../test-results/ui-p3fr/BACK_FINAL_APK.json).

SAF: chọn tree thật, đọc nested, export khớp SHA256 `972ca46badf53e963f2745712a8081ad43e8e5b3fc918aa7c5eef84ab28272fa`, original bytes không đổi; Undo về sạch, rename Unicode `01_Đổi_tên.txt`, reopen nested đều đạt. Trên APK cuối, persisted tree grant còn tồn tại sau update/restart; helper riêng release đúng URI fixture, restart báo tiếng Việt “Quyền truy cập không còn hiệu lực. Hãy chọn lại thư mục.”,0 file/không dirty, không crash. Không revoke URI khác. Không nghiệm thu auto-resume active file: probe cold restore ban đầu timeout trên host chậm, và snapshot phụ dùng nhầm ID setting bị null; không dùng những probe đó làm PASS. [SAF runtime](../../test-results/ui-p3fr/SAF_RUNTIME.json), [revoke/restart](../../test-results/ui-p3fr/SAF_REVOKE_RESTART.json).

TalkBack thật đã bind/touch exploration; native accessibility focus vào Cài đặt đạt. Double-tap không mở Settings, swipe không đổi focus trong attempt injection: **INCONCLUSIVE**, chưa đủ root cause quy lỗi app. Chưa xác minh speech/traversal/activation đầy đủ. Có lần native fallback do startup/watchdog dưới tải host; chọn “Tiếp tục chờ” trả lại WebView và nguồn fixture sạch; dirty recovery ở fallback chưa thử. Không sửa watchdog/native architecture ngoài phạm vi. [Attempts](../../test-results/ui-p3fr/TALKBACK_ATTEMPTS.json).

Provenance: các ca IME nhiều dòng/Backspace/app-switch và SAF save/rename chạy trên APK trung gian `945c822a85f7cbe222c67a4d869144e23749af162d1d97f4fda5a7878465576b` trước guard async composition. APK cuối `a2ec…283d3` đã chạy lại23 Undo checks, Telex smoke, Back, TalkBack attempts và revoke/restart. Không gọi các ca trung gian là full revalidation trên APK cuối. SHA APK thực cài trên5556 khớp host. Chi tiết trong [matrix](P3F_R_TEST_MATRIX.md). Không có physical-device acceptance hoặc kết quả60FPS.

## Verification và APK

Sau guard cuối: giữ2097 kiểm tra kế thừa, thêm68 Undo +36 math diagnostics = **2201 checks**; palette2220, debug APK18 là gates tách riêng. Assertion lịch sử trong search-dialogs160 được đổi có chủ đích từ “giữ hành vi Undo lỗi P3C” sang “Undo khôi phục before, Redo khôi phục replaced”; không giảm số test. Các suite vẫn kiểm CSS precedence,12 theme, Lucide offline, Markdown DOM, responsive, keyboard, reduced motion, lifecycle policies và native fallbacks; simulation/policy không thay runtime.

Gradle8.9/AGP8.7.3/JDK17, lệnh `scripts/Build-AndroidDebug.ps1 -Offline -RerunTasks`: BUILD SUCCESSFUL,31 tasks,2m04. APK cuối `app/build/outputs/apk/debug/app-debug.apk`,7607214 bytes, SHA256 `a2ecb98b62a4df5bbd9a3df3876af00e066040d0aef15f5c2acbef1e659283d3`. Renderer13312939 bytes, SHA256 `957d2d1e2769a7b71efe8ea25a1a5c4997b26223b44a256fd6c5f3660fd2be6b`. 54 source/build/test JS files syntax đạt, HTML/asset parity đạt. Lượt revision-ui timeout navigation12s dưới tải được giữ log; retry riêng62/62 đạt, không tăng timeout. Debug signature/integrity/packaging kiểm riêng; không tạo release-signed APK. [Evidence](../../test-results/ui-p3fr/).

## Phạm vi file và rollback

App: `web/src/app.js`, mới `web/src/text-transaction.js`, generated `app/src/main/assets/index.html` (web/dist đồng bộ, ignored). Tests: mới `replace-history-ui.cjs`, `math-remediation-ui.cjs`; sửa1 assertion trong `search-dialogs-ui.cjs`. QA: `runtime_p3f.py`, `build_p3f_probe.py`, `P3FInstrumentation.java`, `README.md`, mới `p3fr_undo.py`; helper giới hạn phase/device/AVD name và URI grant fixture, không nằm trong APK app. Tài liệu:4 báo cáo R và UNDO_PLAN; evidence trong test-results/ui-p3fr. P0–P3F reports/Design System không ghi đè.

Rollback riêng remediation: lấy `web/src/app.js`, asset và test assertion từ `build/ui-p3fr/before/workspace`, bỏ module/test R mới rồi build lại. Không checkout toàn bộ HEAD vì sẽ mất P3C–P3F chưa commit. Không rollback bằng clear data/uninstall; giữ draft/export và kiểm certificate trước mọi cài đè. APK P3F trước sửa được giữ ở `build/ui-p3fr/before/MarkRead-P3F-debug.apk` nhưng có lỗi Undo đã biết.

Dừng ở P3F-R; không triển khai P4.

Cleanup QA: fixture cuối đã hoàn nguyên sạch, instrumentation kết thúc; đã đóng chỉ AVD5556 để trả RAM. ADB xác nhận5554 vẫn chạy. Các tùy chọn accessibility/stylus tạm đã trả lại; Vietnamese được giữ trong AVD QA mới cho checklist manual. Không đổi cấu hình bàn phím/emulator5554. Logcat giữ cả TypeError của probe ở about:blank/chưa có DOM và nhầm ID; không lọc mất các attempt lỗi. Harness R hiện yêu cầu URL app, DOM/editor, native public readiness và aria-busy trước probe, không coi thiếu data-startup trên about:blank là ready.

## Đóng gate bằng P3F-R2 —29/10/2026

Đã sửa generated LaTeX error color bằng token semantic qua presentation option của KaTeX, cùng auto-capitalize không mong muốn trong Search/Replace. Final2297 automated, palette2220, APK18 đều PASS; native core28, SAF18, Undo23 và12 math themes đạt trên cùng APK SHA79a6d98d83855bee3f3e621c696c0bc6580f9d8252300adbc87cda4f6f575b15. TalkBack **NOT TESTED — accepted limitation** theo người dùng, giữ semantic/ARIA/focus. Không còn High/Blocker đã biết trong gate được điều chỉnh. Low provider-toast và coverage ngoài môi trường vẫn được ghi rõ. [Kết luận, giới hạn và rollback](P3F_R2_RELEASE_READINESS.md), [kết quả](../../test-results/ui-p3fr2/RESULTS.json). Dừng trước P4.
