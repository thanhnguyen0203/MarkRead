# MarkRead launcher — Quiet Ink

P4A · 29/10/2026. Original vector artwork; không lấy đường nét Lucide làm logo. Bộ23 Lucide trong WebView giữ nguyên. Chọn **A / Open Book**; B / Reading Mark và C / Markdown Page là các phương án nghiên cứu, không đóng gói vào APK.

## Nguồn và chỉnh sửa

`concepts.json` là nguồn hình học và màu. Mỗi path dùng even-odd fill để các khe đọc là khoảng trong suốt thật; không giả bằng màu background. `A/B/C-color.svg` có nền graphite; `*-foreground.svg` chỉ có hình sage, nền trong suốt; `*-monochrome.svg` đen đục trên nền trong suốt. `previous/` giữ ba XML launcher trước P4A cùng SVG chuyển từ đúng path cũ để so sánh/rollback; không chứa source app hoặc dữ liệu người dùng.

- Graphite **#202326**; Sage **#91C7B0** từ MASTER.
- Canvas108×108; hình A khoảng50×49.3, centered optical axis x54, khe gáy4; hai khe đọc dày3 đơn vị, không stroke mảnh. Geometry được đo bằng canvas offline tại10samples/đơn vị, bán kính điểm vẽ lớn nhất31.946 so với safe radius33. Không coi đo raster là chứng minh vector hình thức.
- Lớp foreground không có shadow, clipping mask hoặc góc bo sẵn. Radius ở preview và legacy round là cách hiển thị thử/asset fallback, không nằm trong foreground adaptive.
- Monochrome dùng cùng alpha silhouette và negative space; Android tự chọn màu theo wallpaper/system theme. Các màu themed trong preview HTML chỉ là mô phỏng, không phải token được gửi cho launcher.

## Tái sinh offline

Từ thư mục gốc repository:

```powershell
python scripts/Generate-LauncherIcons.py
# Dùng NODE_PATH và MARKREAD_CHROMIUM trỏ tới QA Playwright/Chromium đã cài.
node scripts/Render-LauncherIcons.cjs
python scripts/Generate-LauncherIcons.py --check
python tests/check_launcher_icons.py test-results/ui-p4a/ICON_CHECK.json
.\scripts\Build-AndroidDebug.ps1 -Offline -RerunTasks
```

Không cài package hoặc tải browser để chạy generator. Nếu không có runtime QA, vẫn có thể tái sinh SVG/Android XML bằng Python standard library; PNG/previews phải render lại khi có browser và review trước build. Không sửa file generated riêng lẻ rồi bỏ qua source.

Generator Python tạo9SVG +7Android XML. Renderer dùng runtime kiểm thử sẵn có để tạo10PNG legacy và2sheet PNG/HTML, không gửi request mạng. `--check` của Python chỉ so sánh byte, không sửa tài nguyên. Kiểm thử kiểm tra PNG CRC/dimensions, reference/API layers, nguồn/vector parity, safe zone, silhouette và contrast; xem [report](../../../docs/release/P4A_ICON_REPORT.md).

## Android

- `mipmap-anydpi-v26`: foreground/background, hoạt động từ minSdk26 hiện tại.
- `mipmap-anydpi-v33`: thêm monochrome, dùng khi Android13+ và launcher bật themed icons.
- Hai tên resource `ic_launcher` và `ic_launcher_round` cùng hình adaptive; Android/OEM áp mask. Manifest chỉ đổi roundIcon sang tên round riêng.
- `mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi`: normal/round48/72/96/144/192px. Dự phòng cho consumer cần bitmap; không tuyên bố MarkRead hỗ trợ Android dưới minSdk26.

Tham chiếu platform: [Android adaptive icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive). Tài liệu Android hiện chuyển hướng sang trang chung có nhãn Compose; quy tắc108dp/layers/monochrome vẫn áp dụng resource XML Java hiện có. Không đưa Compose vào ứng dụng.
