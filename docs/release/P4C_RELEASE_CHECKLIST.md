# P4C — Release checklist1.2.0

29/10/2026 · **READY FOR P4D — signed direct APK, NOT UPLOADED**.

## Identity, version, signing

- [x] Kênh được người dùng đổi sang APK trực tiếp/GitHub, không Google Play; P4B có banner cập nhật phạm vi, giữ evidence lịch sử.
- [x] Kiểm kê APK local và toàn bộ2release hiện thấy ở GitHub; binary SHA khớp server metadata, code lớn nhất115. Tagv1.1.6 thực chứa metadata1.1.5/115.
- [x] Duyệt/apply1.2.0/code120, appId/namespace `vn.markread.local`, min26/target35/compile35 không đổi.
- [x] Local release key PKCS12/RSA3072 được challenge/verify và khớp certificate mọi APK cũ đã kiểm; không tạo/thay khóa hoặc dùng debug key.
- [x] Signing đọc env/local ignored metadata/password files, pin public fingerprint; missing-store/wrong-alias bị chặn, APK không đổi trong negative tests.
- [x] Không ghi password/private key/keystore vào report, source hoặc artifact; secret scan Git-visible và ignore paths đạt trong phạm vi đã nêu.

## Build và packaging

- [x] Gradle8.9/AGP8.7.3/JDK17 giữ nguyên; assembleRelease offline `-RerunTasks` thành công,44tasks; lintVitalRelease đạt.
- [x] Không disable lint/SSL hoặc thêm baseline để bỏ lỗi. Bỏ hardcoded debuggable trong source Manifest, giữ release buildType=false và kiểm compiled APK.
- [x] Không bật R8/minify/resource shrink, không thêm dependency/permission/network/telemetry hoặc đổi Java/bridge/editor logic.
- [x] APK release thực tồn tại, apksigner/certificate/v2, zipalign/CRC, Manifest/version/SDK/non-debuggable/zero permission đạt.
- [x] Offline HTML/CSS/JS/font/KaTeX/notices exact;23Lucide và12theme regression đạt.
- [x] Open Book foreground/background/monochrome/round và10legacy PNG có trong resource graph; resolve qua AAPT table sau filename optimization, không giả tên file resource giữ nguyên.
- [x] APK/checksum/metadata/changelog nằm riêng `dist/releases/v1.2.0/`; APK cũ không bị ghi đè. Hash copy trùng candidate đã cài/test.

## Tests và update

- [x]2383/2383 kế thừa;2negative Gradle signing checks mới; **2385/2385 automated**.
- [x] Palette2220/2220, launcher81/81, release APK18/18; inherited security25 cũng chạy trên signed APK cuối, không cộng trùng vào tổng.
- [x] Baseline release thật từ GitHub cài vào AVD mới; chọn SAF, đổi theme/font/CSS, sửa và lưu fixture trước update.
- [x] Install-r115→120 cùng UID/cert, không uninstall/clear data.
- [x]44native assertions cuối: Settings/CSS/grants, Reader/Editor, nested/saved files, Search/Replace Undo/Redo, Android input, export/source hashes, Back và cold relaunch đạt.
- [x] Bảo toàn byte original/tệp con/bản xuất trước; bản xuất sau khớp expected; hoàn nguyên fixture sạch và trả tùy chọn QA, đóng riêng AVD5558.
- [x] Giữ raw attempt/harness failures riêng, không nhận là PASS và không giả thử Android bằng screenshot browser.

## Giới hạn vẫn phải công bố

- [ ] Máy thật, API26/OEM launcher và provider read-only/cloud/SD/low-storage: **NOT TESTED**.
- [ ] P4C full Gboard Telex/VNI/all composition variants, FPS: **NOT TESTED**; không thay bằng chứng R2 bằng claim mới.
- [ ] TalkBack: **NOT TESTED — accepted limitation**, không là blocker riêng, không bỏ semantics/ARIA/focus.
- [x] Draft/Undo/caret RAM không cam kết qua update/process death; hướng dẫn export trước update.
- [x] Giữ known limitations native execCommand/cross-field history, provider technical toast và coverage; không tuyên bố universal-device readiness/60FPS.

## Chưa thực hiện — thuộc bước sau có duyệt

- [ ] Không tạo/upload GitHub Release, tag, commit hoặc push trong P4C.
- [ ] Không tạo bản Play/AAB hoặc yêu cầu Console/upload certificate.
- [ ] P4D cần người dùng review APK/report, xác định tag/title/body/assets cuối và cho phép thao tác publish riêng. Không lấy READY FOR P4D làm quyền tự upload.

Nguồn: [report](P4C_REPORT.md), [native upgrade validation](P4C_UPDATE_VALIDATION.md), [kết quả máy](../../test-results/ui-p4c/RESULTS.json).
