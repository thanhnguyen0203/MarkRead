# P2A — MarkRead UI Foundations: Design Tokens & Focus

**27/10/2026 · phạm vi G3 của P1 · trạng thái: hoàn tất triển khai, chờ duyệt.** Không thực hiện P2B–P2G.

## 1. Mốc trước thay đổi và phạm vi

- HEAD trước P2A: `5efe52f094f4ad74804b378a80ef63ce6fc5b9ac` (`docs(ui): establish MarkRead design system P1`). Không có thay đổi ở file được Git theo dõi. Các tài liệu P0 trong `docs/ui-redesign/` và cache skill là file chưa được theo dõi **đã có từ trước**, giữ nguyên.
- Baseline P0: **439/439**: web unit 79, sáu browser suite 54+62+46+27+17+53, JVM Policy 69, JVM SessionPolicy 7, APK validation 25. Bundle/asset cũ có SHA-256 `ffbe73dfd33846de368ff2207c1ac766bda2d530d6a1cf495fba10ec5dacc359`.
- Đã đối chiếu đủ P0/P1, đặc biệt MASTER, COMPONENTS, ACCESSIBILITY, MOTION và IMPLEMENTATION_PLAN. Dùng `ui-ux-pro-max` để tra focus keyboard, focus appearance và tương phản. Không thay bố cục, kích thước vùng chạm, icon, sự kiện nghiệp vụ, bridge, Java, theme IDs/metadata, preference schema, Gradle hay dependency.

## 2. Thay đổi và file

- `web/src/tokens.js` **mới**: resolver sRGB/contrast hữu hạn theo MASTER, tính và cache một lần cho từng theme; xuất token semantic, component alias và 13 alias cũ. Giữ nguyên primitive 12 palette trong `themes.js`.
- `web/src/app.js`: theme preview dùng màu chữ đã resolve; `uiSettings()` đặt token lên `body`; `readerStyle()` đặt cùng token lên `:root` của iframe. Background root và `color-scheme` tiếp tục lấy theme hiện có, giúp native window/WebView đồng bộ. Không đổi lưu/khôi phục theme, CSS parser, lịch render hay event handlers.
- `web/src/app.css`: trạng thái default/hover/pressed/selected/disabled theo token; toolbar/sidebar/menu/settings/form có màu phân biệt. Focus neutral 2px, không animate. Chữ phụ của hàng tệp không bị giảm opacity; switch disabled dùng token thay cho opacity toàn track. Không đổi geometry/layout.
- `web/src/paper.css`: reader text/link/quote/search/error dùng token; link/summary/inline editor có focus neutral. Caret và font/source geometry không đổi.
- `app/src/main/assets/index.html`: asset Android tự chứa được **build từ source** và đồng bộ byte với `web/dist/MarkRead.html` (file build ignored). Không sửa tay bundle.
- `web/tests/tokens.test.mjs` và `web/tests/foundations-ui.cjs` **mới**: đo token 12 theme và computed style, tương tác, CSS riêng, editor. `web/tests/ui.cjs` và `web/tests/reading-ui.cjs`: chỉ cập nhật ba assertion thị giác cũ liên quan outline/rename focus, giữ nguyên số lượng và assertion nghiệp vụ.
- Báo cáo này: `docs/ui-redesign/P2A_REPORT.md`. Tài liệu P0/P1 không đổi.

## 3. Token đã triển khai

Primitive `bg/panel/surface/accent/selected/quote/code` của 12 theme giữ nguyên. Semantic CSS variables trên shell và iframe:

- Nền/bề mặt: `--mr-bg`, `--mr-surface`, `--mr-surface-elevated`, `--mr-selected`, `--mr-disabled-surface`, `--mr-quote`, `--mr-code`.
- Chữ và hành động: `--mr-text-primary`, `--mr-text-secondary`, `--mr-heading`, `--mr-accent-fill`, `--mr-accent-text`, `--mr-on-accent`, `--mr-selected-text`, `--mr-disabled-text`, `--mr-syntax1`, `--mr-syntax2`.
- Biên/trạng thái: `--mr-border`, `--mr-border-control`, `--mr-focus`, `--mr-hover`, `--mr-pressed`, biến thể hover/pressed cho surface/bg/selected và `--mr-accent-hover`, `--mr-accent-pressed`.
- Ngữ nghĩa: `--mr-error`, `--mr-success`, `--mr-warning`, `--mr-info`.
- Component alias: `--mr-button-bg`, `--mr-file-current-bg`, `--mr-field-border`, `--mr-reader-link`.

Alias legacy `--bg/--panel/--surface/--text/--heading/--muted/--accent/--line/--selected/--quote/--code/--syntax1/--syntax2` vẫn được xuất trong đúng CSS scope. `--accent` bây giờ là **foreground đã hiệu chỉnh**; primary/switch dùng `--mr-accent-fill` và `--mr-on-accent` nên Sepia và các theme sáng không còn phụ thuộc `panel/accent` có tương phản thấp. CSS riêng được nối sau stylesheet reader như cũ; `var(--accent)` vẫn dùng được nhưng độ sáng có thể thay đổi. Custom CSS chỉ thuộc iframe, không đổi shell. `--font/--size/--width/--leading` vẫn theo preference trước đó.

Resolver cố định 18 nền thử (6 base × default/hover/pressed), mục tiêu nội bộ 4.8:1 cho text/semantic/focus, 3.2:1 cho control border; action fill không đổi. Không tính contrast trong event scroll hoặc khi gõ.

## 4. Focus và trạng thái tương tác

- `:focus` là fallback nhìn thấy cho WebView không hiểu `:focus-visible`. Trong `@supports selector(:focus-visible)`, chỉ pointer focus của button/link/summary được làm trong suốt; keyboard focus giữ outline neutral 2px, offset 2px. Không có `outline:none` toàn cục. Text field giữ indicator và caret khi được focus; rename có border control rõ và outline neutral bên trong field. Theme tile giữ selected border/check ở trong, focus ring ở ngoài.
- Pressed đổi fill, bỏ scale `.97` ở trạng thái này nên không gây giật vị trí. Hover chỉ trên fine pointer. Pressed/hover của selected dùng nền selected riêng, không xóa `aria-pressed`, `aria-selected`, `aria-current` hay `disabled` thực tế. Disabled dùng màu token và opacity 1, không biến điều khiển thành enabled.
- Source textarea và inline `.block-source` không có thay đổi DOM/focus handler, value, selection hay render scheduling. Test browser xác nhận source focus/caret/selection còn nguyên; composition được mô phỏng bằng sự kiện, **không thay thế thử IME Android thật**.
- Focus ring của inline editor dùng outline neutral thay cho start marker đề xuất trong P1. Đây là lựa chọn P1 cho trường hợp marker chưa được đo đủ diện tích; cần đánh giá trên thiết bị thật trước khi coi hoàn tất accessibility của editor.

## 5. Kết quả kiểm thử trên bundle cuối

- **Baseline cũ: 439/439 đạt, 0 fail.** Web unit cũ 79; browser `ui` 54, `revision-ui` 62, `reading-ui` 46, simulated `native-ui` 27, `session-ui` 17, `startup-ui` 53; JVM Policy 69, SessionPolicy 7; APK validation 25. Hai assertion Reading và một assertion UI chỉ đổi kỳ vọng focus thị giác đã được duyệt trong P1, không xóa ca test hay đổi nghiệp vụ.
- **Test mới: 39/39 đạt, 0 fail.** 12 node unit cases trong `tokens.test.mjs` cho các theme/tokens/contrast; 27 browser assertions trong `foundations-ui.cjs` cho 12 palette đã render, preview/alias, keyboard vs touch focus, pressed/release, selected/disabled, rename/editor/caret, CSS riêng và lỗi JS. Tổng Node unit hiện **91 = 79 cũ + 12 mới**; số browser test mới **27**. Tổng kiểm tra tự động theo cách đếm baseline là **478 = 439 cũ + 39 mới**.
- Palette checker P1 được chạy lại trên bản sao riêng trong `build/ui-p2a/`: **2.220/2.220** phép đo, 0 fail, đủ 12 theme. Đây là phép đo số học riêng, **không cộng thêm vào 478 test cases**. Min text 4.802:1, control border 3.201:1, primary 4.818:1. Unit mới còn đối chiếu output resolver thực với các giá trị đặc tả và 18 nền/trạng thái.
- `npm run build` đạt. `node --check` cho app/tokens/test đạt; `css-tree` parse cả `app.css` và `paper.css` với **0 lỗi**. CSP hash của script bundle và font offline đạt qua APK validation. `web/dist/MarkRead.html` và `app/src/main/assets/index.html` cùng SHA-256 **`ba2602e80a4f1ced1fa6ef9f4496250cc400cc3889245342871adaa4ecf09dd4`**.
- ECJ compile Java, D8, AAPT2, zipalign/check đạt; APK **không ký** với asset mới ở `build/ui-p2a/native/aligned.apk` qua 25/25 validation. APK phát hành cũ trong `dist/` giữ nguyên SHA-256 `5a0ee4e950df4ca30963b0669337b7ab731f7b65c493be35cde9f3fad6eefa90`, chứng thư/chữ ký cũ verify đạt. APK mới chưa được ký/cài đặt.
- Log và screenshot thử nghiệm nằm ở `build/ui-p2a/` (ignored); không ghi đè bằng chứng P0/P1. `git diff --check` không báo whitespace error.

## 6. Chưa kiểm thử được và rủi ro còn lại

- **Gradle `assembleDebug`: chưa chạy.** Preflight không có `JAVA_HOME`, Android SDK đầy đủ, Gradle 8.9 distribution cache hoặc `gradle` trên PATH; chạy wrapper lúc này sẽ tải distribution/plugin, ngoài phạm vi không thêm dependency. ECJ/D8/AAPT2 là đường compile/package độc lập, không phải bằng chứng Gradle đạt.
- **Chưa chạy Android thật/emulator**, WebView tối thiểu 100, TalkBack, bàn phím/IME tiếng Việt thật, system font scaling, rotation/insets và SAF/provider/grant thật. Browser dùng Chrome cục bộ; `@supports selector(:focus-visible)` fallback được xác minh bằng CSS và browser hiện tại, chưa đo trên WebView 100. Signed APK P2A để cài cũng chưa có.
- CSS riêng được quyền override màu reader/focus theo cơ chế cũ; người dùng đặt màu tương phản thấp có thể tự giảm accessibility. Alias `--accent` dùng cho CSS riêng có thể ra RGB khác palette gốc. Native background/theme mapping giữ nguyên vì 12 background primitive không đổi; dialog native light/dark thuộc G8.
- Các phát hiện P0 ngoài G3 còn mở: focus sidebar đóng và semantics (A01/A04), đường keyboard editor (A02/A03), target/layout/font scale (A06/A09/A10), feedback/dialog/icon/motion/native (A05/A11–A15). Không coi P2A đã giải quyết chúng. Startup animation trong reduced motion vẫn thuộc G7.

## 7. Rollback và điều kiện chuyển P2B

Rollback source về HEAD trước P2A: restore **chỉ** `web/src/app.js`, `app.css`, `paper.css`, hai test cũ và `app/src/main/assets/index.html`; xóa hai test mới và `web/src/tokens.js` của P2A; rồi chạy lại `npm run build` trong `web/` để đồng bộ `web/dist/` ignored. Giữ nguyên P0/P1 và các file untracked đã tồn tại trước P2A. Không rollback bằng cách chạy `build_apk.py` ở checkout gốc vì nó có thể đụng signing/artifact.

P2B chỉ bắt đầu sau khi chủ dự án duyệt diff và báo cáo P2A. Điều kiện kỹ thuật: baseline 439, 39 test mới, palette checker 12 theme và bundle/asset checksum tiếp tục đạt; ghi nhận riêng kết quả WebView 100, TalkBack/IME/SAF thật trước khi tuyên bố đạt accessibility hoặc phát hành Android. P2B là nhóm focus/semantics của drawer/dialog và không nằm trong lượt này.
