# MarkRead Design System — MASTER

**P1 · bản đề xuất 1.0 · 27/10/2026 · chờ duyệt triển khai P2.** Chỉ là đặc tả; không có token/CSS/Java/asset nào ở đây đã được áp vào ứng dụng. Kiến trúc đích: **Java Android + WebView + HTML/CSS/JavaScript thuần**.

## 1. Thẩm quyền, phạm vi và tài liệu liên quan

- **BẮT BUỘC** là yêu cầu nghiệm thu khi triển khai nhóm P2 được duyệt. **TÙY CHỌN** cần bằng chứng lợi ích và không được làm chậm phần bắt buộc. **GIỮ NGUYÊN** là hợp đồng chức năng từ P0, không phải một mẫu thiết kế có thể bỏ.
- Đọc [AUDIT](../../docs/ui-redesign/AUDIT.md), [FILE_MAP](../../docs/ui-redesign/FILE_MAP.md), [BASELINE](../../docs/ui-redesign/BASELINE.md), [REGRESSION_CHECKLIST](../../docs/ui-redesign/REGRESSION_CHECKLIST.md). Các file P0 không bị sửa trong P1.
- Master quy định token/theme/layout; [COMPONENTS](COMPONENTS.md) quy định hành vi; [MOTION](MOTION.md), [ICONS](ICONS.md), [ACCESSIBILITY](ACCESSIBILITY.md) quy định chuyên biệt; [IMPLEMENTATION_PLAN](../../docs/ui-redesign/IMPLEMENTATION_PLAN.md) quy định thứ tự/cổng kiểm thử. Không tạo page override trong P1: một workspace và các overlay đã được mô tả ở COMPONENTS. Override sau này không được hạ accessibility, phá offline hoặc thay hợp đồng dữ liệu.
- `MASTER.md` có sẵn trước P1 là đầu ra sinh chung: màu cream/amber, hướng landing page, Google Fonts và các mẫu component mâu thuẫn nhau. Đã đọc, lưu bản trước ở ignored `build/ui-design-p1/MASTER.before.md`, rồi cập nhật theo yêu cầu P1 này. Không giữ hướng dẫn tải font hoặc CSS mẫu không phù hợp.

## 2. Bản sắc: Quiet Ink

Một không gian đọc bằng **graphite, nét chữ ấm và điểm nhấn sage**; chiều sâu đến từ các cấp surface, khoảng thở và chữ rõ. Giữ bài đọc là mặt phẳng chính, không đóng mỗi đoạn thành card. Accent dùng cho hành động/selection, không phủ viền xanh quanh mọi phần tử. Typography và thao tác có thứ bậc rõ; decoration ít, không glassmorphism, neumorphism, gradient trang trí hay animation xuất hiện từng đoạn.

Lý do: phù hợp đọc lâu và chỉnh sửa Markdown, tiếp nối màu xanh dịu hiện có, giữ nhận diện 12 theme, ít paint/layout work và dễ triển khai bằng CSS variables hiện hữu. Không sao chép cấu trúc hay hình thức ứng dụng khác. Brand chữ `mr` và adaptive launcher hiện có giữ nguyên; Lucide dùng cho công cụ, không thay brand.

Nghiên cứu bằng skill `ui-ux-pro-max`:

- `notes writing`, domain product → **Notes & Writing App**, Minimalism & Swiss Style + Flat Design, editor focused: phù hợp.
- `minimalism swiss`, domain style → phân cấp chữ, khoảng trắng, tương phản, hiệu ứng nhẹ và chi phí thấp: dùng nguyên tắc; không áp grid 12 cột/hero/CTA của website.
- `keyboard focus visible`, domain ux → Focus States; `reduced motion interruption` → Reduced Motion: phù hợp và được cụ thể hóa trong các tài liệu chuyên biệt.
- Truy vấn `--design-system` ban đầu và lần thu hẹp vẫn trả mẫu hero/testimonials cùng phối font tải ngoài không phù hợp. **Không có một kết quả sinh tự động được xác minh cho toàn bộ MarkRead**; không lưu chúng thành quy tắc. Bản này là tổng hợp có chủ đích từ kết quả product/style đúng chủ đề, Quick Reference và source P0.
- Tra cứu hiệu năng trả kết quả quá rộng; không lấy chúng làm lý do thêm virtualization/framework. Dùng Quick Reference về main-thread, font, layout và kiểm chứng mã hiện có. Skill không có stack Java/WebView/plain CSS tương ứng; không giả là Compose/React Native/Tailwind. Yêu cầu Lucide của người dùng ưu tiên hơn khuyến nghị Phosphor trong dataset.

## 3. Kiến trúc token ba lớp

**BẮT BUỘC:** primitive → semantic → component. Primitive là palette/cỡ/khoảng cách; semantic diễn đạt vai trò; component chỉ tham chiếu semantic. Prefix mới **`--mr-*`** để tránh đụng CSS người dùng. Đây là tên **đề xuất**, chưa tồn tại trong source.

- Primitive: giữ 12 palette trong `web/src/themes.js`, spacing/type/motion scales dưới đây. Không lấy màu từ CSS fallback cũ làm palette thật.
- Semantic: `--mr-bg`, `--mr-surface`, `--mr-surface-elevated`, `--mr-text-primary`, `--mr-text-secondary`, `--mr-heading`, `--mr-accent-fill`, `--mr-accent-text`, `--mr-on-accent`, `--mr-border`, `--mr-border-control`, `--mr-hover`, `--mr-pressed`, `--mr-focus`, `--mr-selected`, `--mr-selected-text`, `--mr-disabled-text`, `--mr-disabled-surface`, `--mr-error`, `--mr-success`, `--mr-warning`, `--mr-info`.
- Component: ví dụ `--mr-button-bg` → accent-fill hoặc surface; `--mr-file-current-bg` → selected; `--mr-field-border` → border-control; `--mr-reader-link` → accent-text. Không tạo tên token cho từng file/cụ thể từng màn nếu cùng vai trò.
- Shell và iframe là **hai CSS scope**; variables không tự đi qua iframe. `uiSettings()` và `readerStyle()` là vị trí nối được xác minh, không có module tokens mới sẵn có. P2 truyền cùng palette đã resolve vào hai scope, giữ `settings.css` cuối reader stylesheet.

## 4. Color tokens

### 4.1 Palette Dark chuẩn và vai trò

Giữ các primitive Dark hiện có; đổi cách sử dụng/foreground để tăng độ rõ:

- `bg #202326`: nền bài và workspace; `surface #1b1e20`: sidebar/vùng phụ; `surface-elevated #282c2f`: menu, control, dialog. Không có yêu cầu mọi surface đều sáng dần so với canvas: nền phụ có thể lùi tối hơn.
- `text-primary #c8d0cb`; `heading #e8ece9`; `text-secondary #acb6b0` sau resolver. Chữ phụ vẫn phải đọc được, không mặc định opacity .5.
- `accent-fill #91c7b0`; `accent-text #91c7b0`; `on-accent #1b1e20`. Fill và foreground là hai vai trò khác nhau dù Dark có cùng accent hex.
- `border #39413b`: divider trang trí; `border-control #8e938f`: chỉ viền nhận diện field/control khi cần. Không dùng viền mạnh quanh mọi card/nút/đoạn văn.
- `selected #2b3934`; `selected-text = accent-text`; thêm check/current semantics. Hover/pressed mẫu trên elevated: `#2e3335` / `#35393b`.
- `focus = heading` (Dark `#e8ece9`): neutral, không dùng viền xanh nhấn mặc định. Vòng focus 2px + khoảng tách 2px chỉ cho keyboard/focus-visible; xem ACCESSIBILITY.
- `disabled-surface = surface`, disabled-text từ resolver mục4.2; không dùng opacity cho toàn bộ container. Lý do bị vô hiệu hiển thị bằng text-secondary nếu cần.
- Semantic seed Dark: error `#ff9b9b`, success `#9dccb0`, warning `#e6c786`, info `#a9c9f6`; Light: error `#b42332`, success `#246744`, warning `#855500`, info `#265f9e`. Resolve theo nền từng theme. Dùng text + icon/status, không chỉ đổi màu. Semantic colors mặc định đặt trên surface thường, không tự thêm tint container chưa đo.

### 4.2 Resolver hữu hạn, không tính contrast khi scroll

Đặc tả đủ để triển khai lại bằng JS thuần trong P2; không yêu cầu CSS `color-mix()` hoặc thư viện màu:

1. Với palette `p`, bases = `[p.bg,p.panel,p.surface,p.selected,p.quote,p.code]`. `mix(a,b,t)` nội suy **RGB sRGB đã mã hóa**, làm tròn từng kênh 8 bit. Không nhầm thao tác mix này với công thức luminance tuyến tính dùng đo contrast.
2. Trước khi sửa foreground, cố định hover(base) = mix(base, **p.text gốc**, .04), pressed(base) = mix(base,p.text gốc,.08). Có 18 nền gồm 6 base × 3 trạng thái. Tránh phụ thuộc vòng giữa text đã sửa và state.
3. `ensure(seed,target,backgrounds)`: thử seed, rồi mix seed về **đen nếu theme light**, **trắng nếu dark** theo từng bước1% từ1 đến100; lấy kết quả đầu có contrast tối thiểu≥target trên mọi nền. Text/heading/secondary/accent-text/semantic target **4.8:1**, control-border **3.2:1**. Nếu không có kết quả, báo lỗi ở bước build/QA, không âm thầm chọn màu thất bại.
4. Action fill giữ **p.accent gốc**. On-accent ưu tiên p.panel nếu đạt4.8; nếu không, chọn đen/trắng có contrast lớn hơn. Primary hover/pressed mix fill4%/8% về phía đối nghịch on-accent (on-accent luminance>.5 → đen; còn lại → trắng), làm tăng tương phản. Kiểm tra cả ba trạng thái≥4.5.
5. Border decorative giữ p.line; control-border = ensure(p.line,3.2). Focus = ensure(p.heading,4.8). Disabled seed=mix(p.muted,p.bg,.4), ensure3.2 (mục tiêu nội bộ cho disabled; không phải ngưỡng WCAG bắt buộc cho control disabled).
6. Syntax1/2 chỉ ensure4.8 trên p.code; code block không tự thêm hover. `quote/code` giữ nền gốc. Search current dùng selected với accent-text và marker; bình thường không tái dùng màu mark vàng hardcode.
7. Resolve/cache một lần mỗi theme hoặc build; không chạy vòng tìm màu/luminance trong mỗi event/frame. Khi render theme preview, dùng theme riêng của tile; focus ngoài tile lấy màu từ surface cha đang hiển thị.

Các giá trị đã tính cho 12 theme, theo thứ tự **secondary / accent-text / on-accent / control-border**:

- Dark `dark`: `#acb6b0 / #91c7b0 / #1b1e20 / #8e938f`.
- Light `light`: `#526057 / #2c684d / #f5f6f5 / #767a77`.
- Giấy `sepia`: `#5d5544 / #57572e / #ffffff / #757064`.
- Đen OLED `black`: `#9faea4 / #9dcea9 / #101211 / #868d88`.
- Tokyo Night `tokyo-night`: `#a6b0d4 / #8fb1f8 / #16161e / #8b8fa0`.
- Tokyo Night Light `tokyo-light`: `#41495f / #2d4978 / #d5d6db / #5f6268`.
- Xanh xám `blue-gray`: `#ced9df / #bbdde7 / #202c32 / #a9b2b6`.
- Nord `nord`: `#d9dfe8 / #cbe3ea / #272d38 / #b4b8c0`.
- Dracula `dracula`: `#c3cbe4 / #d9c0fc / #21222c / #a4a5b0`.
- Rosé Pine `rose-pine`: `#b8b2c8 / #ebbcba / #1f1d2e / #94919e`.
- Rừng xanh `forest`: `#c1d1c6 / #b9d5ab / #18231d / #a0aba3`.
- Gruvbox `gruvbox`: `#d5cbba / #e7c897 / #1d2021 / #a9a6a4`.

P1 đã chạy **2.220 phép kiểm tra số học**, 0 fail: tám foreground trên18 nền, focus/control-border trên18 nền, ba primary states và hai syntax colors cho mỗi theme. Min text **4.802**, min control **3.201**, min primary **4.818**. Script/log ở ignored `build/ui-design-p1/palette-check.mjs` và `palette-results.json`. Đây là kiểm tra đặc tả màu opaque, **không phải UI đã render hoặc chứng nhận accessibility**; alpha scrim, tile, selection, user CSS và native phải kiểm tra lại ở P2.

### 4.3 Quy tắc trạng thái

- Normal dùng token semantic; hover chỉ khi `(hover:hover) and (pointer:fine)`; touch không giữ hover sau nhả.
- Pressed đổi nền/brightness đã đo, không thêm border xanh hay scale toàn bộ text field. Release/cancel khôi phục ngay state cuối.
- Focus độc lập selected/pressed; selected giữ check/aria state, keyboard focus là vòng neutral nằm **ngoài** control.
- Disabled dùng native `disabled` khi vô hiệu thật; busy dùng disable/aria-busy phù hợp nhưng không làm mất thông báo lỗi. Không để style trông enabled mà handler bỏ qua im lặng.
- Error dùng semantic error + câu giải thích/aria-describedby; success không tự xóa dirty của nguồn sau export bản sao.

## 5. Typography

**BẮT BUỘC:** UI sans hệ thống để nhanh, chữ Việt rõ, không thêm font. Stack UI: `system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif`; Android dùng font hệ thống. Không gọi Google Fonts/Inter CDN.

Type scale tại cấu hình chữ chuẩn, authoring fallback bằng rem với root16px; Android có thể cấp effective metric riêng từng vai trò như quy định scaling dưới đây:

- UI body:16/24px,400; label/menu/file row:14/20px,500; hỗ trợ/hint:14/21px,400.
- Caption/meta không thiết yếu:12/18px,400 hoặc500; không dưới12px, không uppercase/letter spacing rộng cho đoạn hướng dẫn.
- Tên file trên header:14/20px,500; tên đầy đủ có accessible name, cho xem khi focus/mở đổi tên. Title dialog22/28px,600; section title18/24px,600.
- Source toàn bài:16/26px,400, monospace; số/count tabular. CSS editor14/22px monospace (text scale áp dụng). Không đổi source syntax hay tạo rich text editor.
- Letter spacing: body/controls0; heading−.01em tối đa, code0; brand/caption ngắn tối đa.06em, không áp lên nội dung tiếng Việt dài.
- Dùng weight400/500/600, không phụ thuộc weight650 tồn tại ở mọi font; không thêm font để ép khớp screenshot Windows.

**GIỮ NGUYÊN reader:** bốn ID sans/serif/merriweather/mono; font offline Merriweather regular-variable/italic đã có; defaults18px, leading1.8, width860; range12–32/1.2–2.4/480–1400 và precedence custom CSS. Reader heading dùng em: h1 1.8, h2 1.4, h3 1.2, h4–h6 tối thiểu1; line-height1.35, weight600. Đây là đề xuất metric mới cho P2, phải chạy Reading tests vì line-wrap/anchor thay đổi.

Mục tiêu đọc35–60 ký tự/dòng trên điện thoại,60–75 ở vùng rộng; chỉ là gợi ý default, **không clamp** width/font người dùng đã chọn. Source/reader có vùng cuộn riêng hiện có, không cuộn parent toàn bộ app.

Scaling: UI phải đáp ứng system font/display size và kiểm thử200%/mức lớn nhất. **Không dùng `saved size × Configuration.fontScale` làm phương trình font Android**: Android hiện có scaling phi tuyến. Đề xuất P2 Java tính effective metric theo từng cỡ bằng `TypedValue.applyDimension(COMPLEX_UNIT_SP, baseSize, displayMetrics)`, rồi chuyển sang CSSpx theo mapping WebView/density đã đo; gửi một bảng số transient cho UI roles và dải reader12–32, không lưu appearance. Giữ giá trị slider/`--size` cơ sở, thêm token effective riêng; custom CSS vẫn có quyền override reader. Browser không host dùng rem/base values và cơ chế text zoom của browser. API đã xác minh nhưng đường metadata **chưa tồn tại**; không kết hợp native effective metrics với nhân fontScale hoặc WebView textZoom lần nữa. Source/reader cùng dùng đúng metric của vai trò/cỡ, không áp một multiplier chung rồi gọi là native sp; chi tiết ACCESSIBILITY.

## 6. Spacing, geometry và elevation

- Scale px tại scale layout cơ sở: `space-0=0`, `1=4`, `2=8`, `3=12`, `4=16`, `5=20`, `6=24`, `8=32`, `10=40`, `12=48`, `16=64`. Dùng4/8 cho nhịp; ngoại lệ có lý do: stroke1/2, progress3.
- Shell inset mobile16, large24; reader mobile24, narrow320px20, wide48. Reader bottom64, có thể tăng theo viewport/content nhưng không thêm IME inset hai lần.
- Icon–label gap8; giữa action targets8; field/group gap16; section gap24/32; dialog padding24, hẹp16.
- Radius: nhỏ6 (badge/code), control10, row12, dialog20; pill999 chỉ track switch/chip thực sự. Không card từng đoạn bài đọc.
- Target web tối thiểu **48×48 CSSpx** trong layout đề xuất, xác minh thành **≥48dp** trên Android. Field/button min-height48; row min-height56, tăng theo text. Input value/thumb có thể nhỏ hơn target; thumb20, switch track44×26 nằm trong label-row≥56.
- Border1px decorative/control; keyboard focus2px offset2; không dùng border2px thường trực xanh. Dùng border-control chỉ nơi outline điều khiển cần nhận diện.
- Shadow:0 cho reader/rows/toolbar, level1 menu `0 4px 12px rgba(0,0,0,.16)`, level2 dialog `0 12px 32px rgba(0,0,0,.24)`; dark tăng alpha tối đa.32, light không quá.24. Đây là decoration không dùng phân biệt duy nhất; border/surface vẫn rõ. Scrim dark rgba(0,0,0,.56), light.40; không bắt buộc backdrop blur.
- Layer semantic: content0, header/progress10, scrim20, drawer30, menu40, toast50; **HTML modal top layer luôn cao hơn z-index này**. Thông báo khi modal mở đặt trong modal, không cố dùng z-index toast thắng top layer.

## 7. Responsive và insets

Quyết định theo **vùng WebView sử dụng được sau native insets**, không đo màn hình vật lý. Các ngưỡng dưới là layout spec P2, không phải source đã thay.

- Sidebar cố định chỉ khi viewport≥1024px, height≥600px và còn workspace≥640px sau sidebar280px. Ngoài ra dùng drawer `min(320px, viewport−48px)`; close button có48px target. Không ép sidebar ở844×390.
- TOC rộng208 chỉ khi read mode, height≥600 và còn reader≥640 sau sidebar/gap; tham chiếu viewport1280 trở lên. Split giữ truy cập ở width>820 như baseline; không tự nâng ngưỡng làm mất chức năng. Split không có TOC, cho dùng drawer để dành chiều rộng.
- Toolbar **workspace<680px**: hàng tên/menu/settings/more tối thiểu56; hàng action prev/next/search/save48 với gap8 và padding16; khoảng cách dọc4 + đáy4 → header tối thiểu112px. Ở320px, hàng title48+80+48+48+3×8+2×16=280px; action4×48+3×8+2×16=248px. Không giảm target để ép một hàng.
- Workspace≥680px: toolbar một hàng tối thiểu64, title flex, các control48px/gap8; sidebar đang cố định không cần hamburger. Tên file ưu tiên ít nhất160px, fallback hai hàng khi không đủ hoặc font scale lớn. Progress3px luôn sát dưới header; auto-hide lấy chiều cao thực, không hardcode54/60.
- Khi focus/keyboard editor/search, dialog/drawer/menu mở hoặc reduced motion, header không tự rút; không giấu control đang focus. Bình thường giữ hướng cuộn/định vị chủ động như P0; thay thuật toán chỉ ở nhóm motion riêng.
- Settings viewport width<720 hoặc height<600: một cột, category selector có nhãn/48px và menu5 nhóm cuộn dọc thay nav chữ cắt/scroll ngang. Rộng/cao đủ: nav200 + content tối đa520, dialog max760; giữ5 section.
- `100vh` là fallback, `100dvh` trong `@supports` nếu có; không yêu cầu `inert`, color-mix hay CSS mới mà thiếu đường thay thế ở WebView100. Không thêm overflow toàn app; code/table có vùng scroll riêng.
- `MainActivity.configureInsets()` đang cấp padding systemBars|IME. **BẮT BUỘC chỉ một nơi sở hữu insets**; không cộng thêm env(safe-area-inset-*)/keyboard height cho Android đã padded. Browser fallback được phân nhánh riêng. Resize vì IME không đổi sidebar mode một cách gây mất focus; reflow giữ source/anchor.

## 8. Theme architecture và tương thích CSS

**GIỮ NGUYÊN:** IDs/names/light flags của12 theme, appearance schema/storage key/defaults, custom CSS parser/giới hạn, không thêm theme hệ thống hoặc CSS mạng. Không cần dependency/theme engine.

Adapter đề xuất từ semantic sang13 alias cũ:

- `--bg→mr-bg`, `--panel→mr-surface`, `--surface→mr-surface-elevated`, `--text→mr-text-primary`, `--heading→mr-heading`, `--muted→mr-text-secondary`, `--accent→mr-accent-text`, `--line→mr-border`, `--selected→mr-selected`.
- `--quote/--code` giữ primitive quote/code; `--syntax1/--syntax2` dùng bản corrected trên code. `--font/--size/--width/--leading` tiếp tục được readerStyle xuất từ preference.
- **Xung đột đã biết:** legacy `--accent` từng vừa fill vừa text. Sửa alias sang accent-text sẽ làm CSS người dùng tham chiếu biến này đổi độ sáng nhẹ. Tách fill thành `--mr-accent-fill`; không hứa mọi RGB cũ bất biến. Giữ hue/ID/background, ghi rõ thay đổi tương phản khi triển khai. Primary không còn dùng `--panel` làm on-accent ở mọi theme: Sepia cần trắng.
- Giữ selector `body`, `#paper`, heading/table/pre và thứ tự style: resolved tokens + font + paper + math + **settings.css cuối**. Không dùng blanket `!important`, Shadow DOM hoặc `@layer` làm user CSS mất ưu tiên. Không rewrite/tự xóa user CSS hợp lệ; reset chỉ khi người dùng yêu cầu.
- User CSS có thể đổi contrast, reflow hoặc override legacy aliases; default accessibility chỉ bảo đảm khi không override. Shell/native/SAF phải vẫn usable để sửa/reset CSS. Không rò CSS sang shell; namespace không phải một security boundary thay sandbox.
- Native `setThemeColors()`/startup html background đang map theo ID: giữ mọi bg nguyên bản trong P2 token phase để tránh flash. Native fallback/AlertDialog cần palette foreground riêng; CSS không điều khiển OS SAF UI.

## 9. Hiệu năng và giới hạn

**BẮT BUỘC:** không animation danh sách hàng nghìn mục, không parser/Mermaid reload mỗi hover/focus/scroll, không rebuild iframe chỉ vì đổi state công cụ. Giữ Worker regex2.5s/20.000 matches, các byte caps, generation/session guards, draft RAM, export SAF và deadline phiên10 phút.

Giữ debounce nguồn280ms, tìm140ms, settings render80ms và startup status800ms ở giai đoạn visual; chúng là chính sách xử lý/feedback riêng, không thay bằng duration animation. Đo trước/sau trên cùng thiết bị/tệp; không tuyên bố latency từ Chrome desktop là WebView Android. Token resolver cache, SVG tĩnh nhỏ, font đã bundle và opacity/transform giới hạn diện tích. **TÙY CHỌN:** tối ưu list/render theo profiler ở patch riêng; không thêm virtualization trong design-token rollout.

## 10. Nghiệm thu P1

Đủ sáu tài liệu; cả15 finding A01–A15 và8 nhóm G1–G8 được truy vết trong IMPLEMENTATION_PLAN; tokens/component/motion/icon/accessibility có số đo, state, source hook, migration và giới hạn rõ. Palette math đạt2220 checks; link/file tồn tại;339 file source/P0 được bảo toàn so với snapshot đầu P1. Kết quả439 P0 là baseline trước đó, **không phải test UI redesign vừa chạy**. Dừng ở P1; không coi việc hoàn tất đặc tả là phê duyệt sửa UI P2.
