# P3F-R — Release readiness cập nhật

29/10/2026. **READY FOR P4** theo [gate P3F-R2](P3F_R2_RELEASE_READINESS.md), thay kết luận NOT READY lịch sử28/10.

- **PASS:** no known Blocker/High trong các luồng đã nghiệm thu; native typing/caret/clipboard/Undo/Search/Back/dirty-state, SAF main/lifecycle/file-safety, generated LaTeX contrast12 themes.
- **PASS:**2297 automated, palette2220, APK18; native core28/SAF18/Undo23,12 math themes trên cùng final APK. Build Gradle thành công, package/signature hợp lệ, certificate/version/appId/permissions/dependencies/Dex không đổi.
- **NOT TESTED — accepted limitation:** TalkBack theo quyết định người dùng; không đánh dấu PASS, không chặn P4 và không bỏ semantic HTML/ARIA/focus.
- **NOT TESTED:** VNI, physical/API26/WebView100, provider chỉ đọc/cloud/SD/low-storage, every IME variant và FPS. Không suy universal production acceptance từ gate API35/WebView124.
- **Low OPEN:** provider missing/moved có thể trả thông báo technical tiếng Anh; data safety đạt. AVD từng có System UI modal; đã loại ảnh bị che, lặp kiểm trên UI thật sau recovery và giữ evidence sự cố môi trường.

APK giữ riêng: [MarkRead-P3FR2-debug.apk](../../build/ui-p3fr2/MarkRead-P3FR2-debug.apk). [Chi tiết, evidence, rollback](P3F_R2_RELEASE_READINESS.md). Chưa build release-signed artifact. **Dừng, không triển khai P4.**
