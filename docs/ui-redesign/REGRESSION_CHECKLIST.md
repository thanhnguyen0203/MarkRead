# MarkRead — checklist bảo toàn chức năng khi nâng cấp UI

Mốc nguồn: `a41a13a5e0e437a83fcd89b6f193292b5fdda9b1`, phiên bản1.1.5/115, ngày27/10/2026. **Chưa triển khai redesign.** Checklist này dùng cho từng nhóm thay đổi sau khi được duyệt; dấu `[ ]` là ca cần kiểm tra ở lượt triển khai, không có nghĩa baseline hiện tại đã fail. Kết quả đã thực thi nằm trong [BASELINE.md](BASELINE.md).

Ký hiệu: **U** unit/JVM; **B** browser với renderer thật; **S** MessagePort host mô phỏng; **A** Android/emulator thật; **M** đánh giá thủ công/accessibility. B/S không được dùng thay A cho SAF, lifecycle hoặc TalkBack.

## 1. Invariant và phạm vi bất biến

- [ ] Không thêm dependency, Internet/storage permission, telemetry, network/font request hoặc framework UI nếu chưa có phạm vi mới được duyệt.
- [ ] Giữ nguồn Markdown là dữ liệu chuẩn; không ghi `contenteditable`/HTML render ngược thành Markdown.
- [ ] Giữ giới hạn5MiB/document,10MiB/image,5.000 mục scan,32 cấp thư mục,64KiB chunk; CSS và search có giới hạn riêng như bên dưới.
- [ ] Không tự thay defaults/schema/key `markread-appearance-v1`, ID12 theme/bốn font, always-save appearance và chính sách phiên10 phút.
- [ ] Sửa nội dung nằm trong RAM cho đến khi người dùng xuất; không thêm autosave draft, không tự ghi đè URI file gốc.
- [ ] Đổi tên và xuất là hai thao tác khác nhau: rename thay tệp provider; export tạo bản sao tại nơi người dùng chọn.
- [ ] Không sửa min/target SDK, WebView minimum100, package/signing/version hoặc sửa build/emulator ngoài nhóm được duyệt.

## 2. Fixture tối thiểu

- [ ] Dùng cây có `Chương 2/A 2.md`, `Chương 2/A 10.md`, `Chương 10/Sâu/Z.md`, hai file ở gốc; tên tiếng Việt, emoji và tên dài.
- [ ] Thêm file Markdown UTF-8, UTF-16LE/BE có BOM, CRLF và LF, không có newline cuối, nhiều separator trống, `.txt`, extension hoa và file sát/vượt giới hạn.
- [ ] Bài có h1–h6/heading trùng, list/task, quote, table rộng, fenced code, math inline/display, Mermaid hợp lệ/sai/quá8, local image/link/anchor và link ngoài.
- [ ] Có ảnh PNG/JPEG/GIF/WebP/AVIF/BMP hợp lệ, ảnh thiếu/corrupt/quá10MiB/SVG/remote; CSS hợp lệ, sai cú pháp, URL/@import và quá100.000 byte.
- [ ] Dùng scope/grant tạm riêng khi thử Android; không uninstall/xóa dữ liệu app người dùng để tiện chạy harness cũ.

## 3. Mở và đọc Markdown

**Nguồn:** `app.js:225–345,436–446`, `core.js`, `paper.css`. **Bao phủ:** U core/workspace, B UI/Reading, S Native; A cần bổ sung.

- [ ] Mở thư mục và nhiều tệp qua đúng nút/menu; hủy picker giữ scope/bài/draft hiện tại. Scope trống đã chọn thành công khác với cancel và phải thay scope cũ.
- [ ] Nhận `.md/.markdown/.txt`; browser picker không vô tình lọc mất định dạng cần hỗ trợ, Android chỉ scan loại cho phép.
- [ ] UTF-8/UTF-16 BOM đọc đúng tiếng Việt/emoji; encoding sai/binary báo lỗi có thể phục hồi. Import bỏ BOM và normalize CRLF/CR→LF như baseline.
- [ ] Phân biệt bảo toàn **source nội bộ đã decode** với byte gốc trên đĩa: không yêu cầu export giữ encoding UTF-16/BOM/CRLF gốc; baseline export UTF-8.
- [ ] GFM, heading IDs tiếng Việt, duplicate headings, list/task disabled, quote, table và code render đúng; không tự đổi parser/options.
- [ ] Highlight ngôn ngữ đã đăng ký python/javascript/json/sql/css/bash/xml, giữ code không hỗ trợ và code dài ở dạng nguồn an toàn.
- [ ] KaTeX render local, giữ MathML, lỗi/quá giới hạn giữ fallback; không tăng giới hạn600 công thức/3.000 ký tự/expand500/size20 tùy tiện.
- [ ] Mermaid bật/tắt, giới hạn8/bài,12.000 ký tự/220 dòng/200edges và cấm directives/URL/interaction giữ nguyên; lỗi không làm mất code nguồn.
- [ ] Ảnh local trong cùng scope đọc qua blob/magic check; missing/blocked báo thay thế, không tải mạng/SVG/data Markdown. Đổi scope/pagehide thu hồi object URLs.
- [ ] Link tương đối, `..` hợp lệ trong root, encoded Unicode, anchor và reference link mở đúng; path vượt root/scheme/file/content/remote bị chặn.
- [ ] TOC h1–h3 cuộn đúng; outline ẩn theo mode/viewport hiện có hoặc phương án thay đã được duyệt.
- [ ] Cuộn bảng/code/math ngang bên trong không gây body overflow; bài dài/ngắn/font tải xong vẫn đọc được.

## 4. Nguồn, draft và hợp nhất

**Nguồn:** `app.js:145,347–447,560–561`, `workspace.js`, `paper.css`. **Bao phủ:** U Workspace/Core; B UI/Reading/Revision; S Native; A IME.

- [ ] Read/Source/Split chọn đúng từ menu; checked state khớp mode. Split vẫn truy cập được trên màn lớn, không hiện editor vô dụng trên màn nhỏ.
- [ ] Bật unified ép read, ẩn menu mode; tắt unified khôi phục đường chọn nguồn. Không giữ textarea stale hoặc source khác bài.
- [ ] Sửa nguồn cập nhật preview/debounce/stats/draft; giới hạn tính UTF-8 bytes, không chỉ số ký tự. Tab indent vẫn có quy ước tương đương sau khi sửa keyboard trap.
- [ ] Draft mỗi file tồn tại khi chuyển trước/sau, click tree, sort/filter, đổi theme/font/CSS và đổi tên; file chưa sửa không bị thay.
- [ ] Dirty phản ánh so với bản gốc đã đọc. Đưa source về nguyên bản xóa dirty của bài; `hasDrafts` vẫn xét các bài khác.
- [ ] Unified mở đúng khối heading/paragraph/list/table/code; boundary lấy từ lexer, fallback toàn bài nếu token raw không khớp; không dùng offset đoán.
- [ ] Tapping không thêm dòng trống nhìn thấy; structural newline/separator không bị xóa hoặc nhân đôi.
- [ ] Không đổi gì rồi hoàn tất/export thì source nội bộ chính xác như trước. Escape hủy đúng active block và giữ các khối đã commit trước đó.
- [ ] Chuyển liên tiếp nhiều đoạn sau khi nội dung dài/ngắn/tách khối giữ đúng offsets, source xung quanh, reference definitions và Unicode surrogate pairs.
- [ ] Giữ cùng reader document và textarea focus khi chuyển khối; không iframe reload/blur rồi focus lại gây nhảy keyboard.
- [ ] Chỗ vừa chạm, scroll anchor và caret ổn định sau wrap/auto-size/keyboard resize; không phủ khối kế bên hoặc toolbar.
- [ ] Click link/summary/checkbox không vô tình bật editor; text selection không bị chuyển sang sửa ngoài ý muốn; tap ngoài kết thúc đúng.
- [ ] Ctrl/Cmd+Enter commit, Escape cancel, Back hoàn tất theo baseline; đường bắt đầu/thoát bằng bàn phím nếu bổ sung không phá touch flow.
- [ ] **A:** gõ tiếng Việt có dấu/composition/emoji, chọn/copy/paste, undo/redo textarea, đổi orientation khi keyboard mở không mất source/caret.

## 5. Font/theme/bố cục và persistence

**Nguồn:** `themes.js`, `preferences.js`, `app.js:24–49,110–130,312,543–549,567–570`, native appearance. **Bao phủ:** U Preferences/Workspace, B UI/Revision, S Startup/Session; A system scale/bars.

- [ ] Đủ12 ID: dark, light, sepia, black, tokyo-night, tokyo-light, blue-gray, nord, dracula, rose-pine, forest, gruvbox.
- [ ] Preview và selected state dùng màu thật; shell, iframe, window/WebView background và system bars đồng bộ. Nếu đổi background palette, cập nhật cả mapping native.
- [ ] Sans/serif/Merriweather/mono giữ lựa chọn và fallback; Merriweather regular/italic tải offline, không thêm font request; tiếng Việt không lỗi glyph.
- [ ] Size12–32, width480–1400, leading1.2–2.4 và defaults18/860/1.8 giữ đúng; migration/clamp giá trị cũ và invalid CSS không làm mất preference khác.
- [ ] Theme/font/size/width/leading/unified/Mermaid/order/CSS được lưu tự động; không đưa lại switch opt-in đã bỏ.
- [ ] Browser localStorage và Android SharedPreferences hoạt động; storage lỗi có thông báo, phiên hiện tại vẫn dùng được.
- [ ] Native preferences thắng localStorage stale khi khởi động; fallback host cũ/malformed appearance hoạt động; không overwrite native settings bằng default trước load.
- [ ] Không đo contrast chỉ bằng default CSS: kiểm tra computed token của từng theme, normal/hover/pressed/focus/selected/error; normal text≥4.5:1, meaningful non-text≥3:1.
- [ ] Selected có check/semantics ngoài màu; keyboard focus phân biệt với selected, không chỉ outline đang active giống nhau.
- [ ] **A/M:** system font/display size lớn nhất hoặc mục tiêu200%, TalkBack, dark/light, xoay dọc/ngang; shell/source/reader đều usable. Không phán đoán chỉ từ reader font slider.

## 6. CSS riêng

**Nguồn:** `core.js:cleanCSS`, `app.js:342,571–573`, native chooseCss/DocumentStore.importCss. **Bao phủ:** U Core/Preferences, B UI/Revision, S Native; A picker/grant.

- [ ] Nhập tay, import, apply và reset CSS hoạt động độc lập. Import hợp lệ chỉ đưa vào textarea; Apply mới thay CSS đang dùng.
- [ ] CSS chỉ áp reader iframe, không phá shell/sidebar/dialog/native UI. Selector `body`, `#paper`, heading/table vẫn dùng được.
- [ ] Parser cho CSS hợp lệ và các @media/@supports/@layer/@container; chặn URL, escaped URL, image-set, @import/@font-face, Raw/unsupported và execution properties.
- [ ] Giữ giới hạn parser100.000 ký tự và giới hạn file picker100.000 byte; lỗi encoding/cú pháp/quá size giữ CSS applied trước đó.
- [ ] Hủy/lỗi CSS picker không mất text đang sửa, không thay current source/path/draft/tree/scope token/URI grants.
- [ ] **A:** chọn CSS ngoài cây tài liệu qua ACTION_OPEN_DOCUMENT single/local-only/read; không take/release grant của document scope do import CSS.
- [ ] Đổi typography/theme khi có custom CSS vẫn áp theo precedence baseline; cảnh báo user CSS có thể override màu/bố cục, không tự tẩy các declaration hợp lệ.

## 7. Cây thư mục, filter, sort và trước/sau

**Nguồn:** `DocumentStore.scanTree`, `workspace.js:fileTree/orderedPaths/adjacentPath`, `app.js:145–160`. **Bao phủ:** U Workspace, B UI/Revision, S Native; A actual tree.

- [ ] Thư mục con nhiều cấp được scan trong tree đã cấp; không mở rộng sang cây/URI ngoài scope. Giới hạn scan tính các mục nhìn qua, không chỉ Markdown được giữ.
- [ ] Directory-first tại mỗi cấp, `Intl.Collator('vi',{numeric:true,sensitivity:'base'})`: A2 trướcA10; descending đảo sibling names và giữ directory-first.
- [ ] Sequence trước/sau là toàn bộ documents theo depth-first của cây; filter tên và nhánh gập không thu hẹp sequence.
- [ ] Không wrap ở đầu/cuối; prev/next disabled đúng ở boundary, current không hợp lệ, welcome và scope trống.
- [ ] Click file/move/link mở đúng bài, expand ancestor của current, sidebar đóng như baseline; selected/current semantics khớp.
- [ ] Filter casefold tiếng Việt, không có kết quả có empty copy, clear filter khôi phục tree; không mất draft hay scope.
- [ ] Gập/mở bằng summary hoạt động với touch/keyboard; sort persisted nhưng collapse là state trong phiên, không tự thêm persistence mới.
- [ ] Nhiều file/tên dài không tràn ngang hoặc đổi thứ tự khi chỉ làm lại UI; không tự virtualize/rewrite tree mà thiếu benchmark và tests.

## 8. Search/replace

**Nguồn:** `search.js`, `search-worker.js`, `app.js:476–542,575–581`. **Bao phủ:** U Search, B Revision; A Worker/WebView.

- [ ] Search áp vào source của **bài hiện tại**, không chỉ text render, không toàn cây; count và navigation đúng plain/hoa-thường/regex.
- [ ] Match offsets UTF-16 khớp textarea/source; tiếng Việt/emoji/zero-width/multiline không bị tách surrogate hoặc lặp vô hạn.
- [ ] Plain search escape metacharacters; plain replacement giữ `$1/$&/$$` literal; regex replacement giữ expansion JavaScript/capture/named groups như baseline.
- [ ] Previous/next match wrap trong kết quả; file trước/sau vẫn không wrap. Highlight có fallback block nếu source không map được chính xác ra text render.
- [ ] Replace one/all giữ source ngoài match, draft các bài khác, current scope/path; không search lại replacement trong cùng replace-all.
- [ ] Empty query không chèn text; zero results/invalid regex disable thay thế; invalid regex không sửa source.
- [ ] Query cap2.000 ký tự, match cap20.000, timeout2.5s, output5MiB UTF-8, giới hạn expansion giữ nguyên; capped replace-all không thay một phần.
- [ ] Regex gây backtracking không khóa UI; worker bị terminate, URL blob thu hồi, search tiếp sau timeout thành công.
- [ ] Đổi query/source/file/scope hoặc đóng findbar khi đang chạy không áp kết quả cũ. Chuyển draft/unified không làm stale replacement.
- [ ] Ctrl/Cmd+F/H, Enter/Shift+Enter, replace Enter/Ctrl+Enter, Escape/close/Back và focus return hoạt động theo phương án đã duyệt.

## 9. Đổi tên file

**Nguồn:** `app.js:162–215`, `workspace.js:renamedDocumentPath`, `DocumentStore.rename`, `Policy.renameName`. **Bao phủ:** U Workspace/Policy, B Revision/Reading, S Native; **A bắt buộc**.

- [ ] Long press550ms/contextmenu/F2 trên title và row hoạt động; di chuyển>10px hủy hold, không rename khi scroll, không phát click mở bài sau hold.
- [ ] Rename row chưa chọn không tự chuyển current document. Input nhận cả extension, chọn basename ban đầu; Cancel/close không đổi tên.
- [ ] Validate trim/NFC, basename≤180, reject separator/control/path traversal/invalid symbols/trailing dot/empty; collision cùng sibling/file/folder báo lỗi.
- [ ] Chặn stale target khi scope thay, disable input/button và cancel trong lúc busy; error giữ scope/current/draft.
- [ ] Android chỉ gửi `{fileId,name}`; opaque ID phải thuộc scope. Giữ original read capability/maxBytes sau đổi extension và dùng URI do provider trả về, không tự xây URI rename mới.
- [ ] Rename `.md→.txt→.notes` vẫn đọc/điều hướng/export trong phiên; sau restart, loại unsupported có thể không được scan lại. Không tự thay hợp đồng này.
- [ ] Cập nhật map files/drafts/originals, active path/title/tree/navigation và remembered URI đúng; links dùng tên cũ không tự rewrite.
- [ ] Browser fallback chỉ đổi metadata tên trong phiên, không tuyên bố đã đổi file thật trên đĩa.
- [ ] **A:** read-only grant cũ vẫn đọc được; rename báo cần quyền ghi và chọn lại scope; provider không hỗ trợ rename/collision/error đều phục hồi.
- [ ] **A:** rename với tree grant thực và standalone persisted grant, provider trả document ID mới, khởi động lại/đọc lại; không giả lập quyền bằng URI do shell tự tạo.

## 10. Xuất/lưu bản Markdown

**Nguồn:** `app.js:454–473`, `native.js:nativeExport`, `MainActivity.java:207–215,265–290`. **Bao phủ:** B Reading/UI Blob, U transport, S Native; A output provider.

- [ ] Finish active inline edit trước xuất; dùng source mới nhất/correct basename và extension, tiếng Việt/emoji đúng UTF-8.
- [ ] Browser dialog link/copy/readonly fallback usable; close thu hồi Blob URL/xóa export buffer; download-to-disk cần kiểm chứng riêng môi trường cho phép.
- [ ] Android begin/append/finish token/size/chunk64KiB đúng; exact byte count, không xuất dữ liệu của source cũ do race.
- [ ] ACTION_CREATE_DOCUMENT đúng filename và MIME, local-only; picker cancel báo hủy, lỗi ghi giữ draft trong RAM và có thể thử lại.
- [ ] Bấm lưu liên tiếp không mở nhiều export/picker; busy feedback mới không đổi guard/khóa picker.
- [ ] Không ghi trực tiếp lên URI nguồn, không tự clear dirty của file gốc vì đã xuất bản sao; không hứa lưu mọi draft khi chỉ lưu bài hiện tại.
- [ ] **A:** lưu nội bộ/thẻ nhớ, provider-local allowlist, tình huống tên trùng, grant bị thu hồi, bộ nhớ đầy; đối chiếu byte output thực.

## 11. SAF và ranh giới native

**Nguồn:** `MainActivity`, `DocumentStore`, `Policy`, `native.js`, manifest. **Bao phủ:** U Policy/Native, APK validation, S chỉ renderer; A bắt buộc.

- [ ] Origin/entry URL exact, nonce/channel trusted, top-level only; không addJavascriptInterface/arbitrary path/URI API.
- [ ] Metadata index theo generation, page≤32; read opaque ID, offset/chunk/byte caps, lỗi stale scope không đọc scope cũ.
- [ ] Tree picker yêu cầu read/write/persistable/prefix/local-only; takePersistable chỉ read/write flags **thực trả về**, không nâng quyền read-only.
- [ ] Tree chỉ externalstorage provider, standalone/CSS/export local authorities allowlist; cloud/network/unknown provider bị từ chối như baseline.
- [ ] Picker cancel/failure không mất scope trước; cleanup grant mới thất bại không thu hồi nhầm grant cũ; scope commit thành công mới thay dữ liệu UI.
- [ ] Chọn scope mới release quyền không còn cần, standalone chỉ persist khi provider hỗ trợ, grant tạm vẫn dùng trong phiên.
- [ ] Gỡ scope release persisted read/write, xóa metadata/source/drafts/images/session token; **không xóa file vật lý** hoặc appearance.
- [ ] CSS import không release/replace grant tree. Export không làm scope mới. Background picker không làm hết phiên sai.
- [ ] Manifest zero permissions, backup/debug/cleartext tắt, reader sandbox/CSP/network block giữ nguyên sau rebuild.
- [ ] **A:** mất quyền ngoài app, di chuyển/xóa file bên ngoài, SD card rút/reinsert và provider không trả persistable flag: lỗi có hướng chọn lại, không crash.

## 12. Startup, phiên đọc và Back

**Nguồn:** `SessionPolicy`, lifecycle MainActivity, `app.js:583–602,587`, `startup-ui.cjs/session-ui.cjs`. **Bao phủ:** U SessionPolicy, S Startup/Session; A thật chưa có.

- [ ] Startup render đúng saved theme/font/CSS và last article ngay frame đầu thấy được; không lộ welcome/default styling trung gian, chỉ một initial document render.
- [ ] Chờ font offline xong trước reveal; chờ lâu có status sau800ms, channel20s có lỗi; restore/preference failure vẫn mở shell usable.
- [ ] Thử riêng không có MessagePort, nonce sai, channel đến muộn: ghi nhận baseline shell còn pending dù có toast20s; nếu sửa G7 phải có đường phục hồi được duyệt mà không nới trust/origin.
- [ ] Embedded appearance malformed/host cũ dùng fallback; native HTML substitutions không đổi script CSP hash.
- [ ] Rời app599.999ms khôi phục last document nếu grant còn; **600.000/600.001ms** không mở document cũ.
- [ ] Hết phiên giữ folder/tree list nhưng không bài active; standalone scopes được gỡ; mở lại lần nữa không tự mở bài đầu tùy ý.
- [ ] Hết phiên áp dụng cả process còn sống và recreate; elapsedRealtime cho live process, wall timestamp cho restart; thiếu timestamp/clock backwards xử lý đúng.
- [ ] Picker mở/lưu/CSS không tính như bỏ app; lifecycle/configChanges/orientation không làm expire nhầm.
- [ ] Chỉ metadata/URI được persist, draft không restore từ đĩa; trước10 phút không được tuyên bố có khôi phục draft khi process đã bị đóng.
- [ ] Appearance không expire và không mất khi Forget; remembered document checkpoint dùng session token hiện tại, bỏ stale token.
- [ ] Back theo thứ tự hiện tại: rename busy → mode/open/font menu → active inline edit → dialog trên cùng → drawer → findbar → read mode → dirty/exit.
- [ ] Khi có draft, native Ở lại/Lưu bài đang mở/Thoát bỏ sửa hoạt động; các draft khác không âm thầm mất do bỏ qua `hasDrafts`.
- [ ] **A:** home/return, lock/unlock, doze, process kill, rotation/keyboard, renderer crash/reopen; kiểm tra không mất appearance/grants ngoài hợp đồng.

## 13. Cổng UI/UX theo nhóm thiết kế

**Mỗi nhóm chỉ cần chạy suite liên quan và các invariant chung; không lặp mọi suite khi chưa có thay đổi/rủi ro mới.** Trước bản phát hành cuối mới chạy toàn bộ và bổ sung Android thật.

- [ ] **G1 focus/semantics:** sidebar đóng không còn tab stop ngoài màn; mở/đóng/back/scrim trả focus đúng; row có role tương tác/current; help/export có tên; dialog trên cùng điều khiển focus, không xuyên nền. Browser/Native UI + keyboard + TalkBack.
- [ ] **G2 editor:** có đường keyboard bắt đầu/thoát sửa, Shift+Tab không sửa nhầm dữ liệu; indent/commit/cancel/caret/IME đúng. Workspace/Search/Reading và Android keyboard bắt buộc.
- [ ] **G3 palette/focus:** đo text/selected/primary/focus/error trên12 theme, cả hover/pressed/disabled semantics; cập nhật visual expectation focus rename theo duyệt. Theme previews/Startup/Preferences và ảnh sáng/tối.
- [ ] **G4 targets/layout:** đối chiếu target Android48dp với scale thực; thử320/360/390/600/844ngang/1280 và max text; đủ chức năng/long names, safe insets, keyboard. Không bỏ prev/next hoặc thu hẹp source ngoài ý muốn.
- [ ] **G5 typography/spacing:** shell/source/reader đọc rõ, đủ glyph tiếng Việt, fonts offline; reader layout đổi phải chạy exact source/export, inline anchor và progress tests.
- [ ] **G6 icons/copy:** icon cùng ngôn ngữ hình thức, accessible names/hidden decorative đúng, hướng dẫn menu và TXT khớp; không thêm icon dependency.
- [ ] **G7 feedback/motion:** busy/cancel/error còn responsive, không double operation; reduced motion phủ startup/switch/drawer/toast/reader/header; no layout jump khi toolbar/focus đổi. Startup/Session/Reading/Native UI.
- [ ] **G8 native:** fallback WebView cũ sáng/tối đọc được; native confirm/exit/crash đồng bộ palette; system bars/IME/insets/SAF/lifecycle không đổi. A thật cần thiết trước kết luận đạt.

## 14. Chốt baseline và phát hành

- [ ] Review diff chỉ phạm vi nhóm đã duyệt; không sửa lỗi version/probe/emulator cũ lẫn vào patch UI mà không ghi rõ.
- [ ] Giữ test chức năng/dữ liệu/security; assertion visual cũ chỉ thay theo thiết kế được duyệt, không xóa để che regression.
- [ ] Rebuild renderer từ source; CSP hash/asset APK/palette/font/license khớp; Gradle dùng asset mới nếu phát hành bằng Gradle.
- [ ] Chạy unit/Java/APK checks liên quan, sáu browser suite ở lượt tích hợp cuối; baseline tham chiếu439 assertions, không ép số mới phải giống nếu thêm/bớt assertion có lý do được review.
- [ ] Cập nhật instrumentation cũ ở công việc riêng trước khi dùng nó để chứng minh Android; không gắn nhãn simulated native là native device test.
- [ ] Xác minh chữ ký bằng chứng thư phù hợp bản cài thử, alignment/compiled version và hash artifact; không đưa signing secrets vào source/docs/APK.
- [ ] Báo cáo kết quả pass/fail/not-run theo môi trường, chụp ảnh mới sáng/tối/portrait/landscape và lưu riêng bằng chứng lịch sử. Ghi rõ hạn chế Android nào còn lại.
