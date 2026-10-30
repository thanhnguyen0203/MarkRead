# P4D — MarkRead v1.2.0 GitHub Release Preparation

29/10/2026 · **LOCAL PREPARATION COMPLETE — AWAITING USER APPROVAL**. Chưa commit, tạo branch/tag, push, tạo Draft Release hoặc upload. **Chưa hoàn thành gate Draft Release trên GitHub.** Không Publish hoặc đặt Latest.

## Repository và trạng thái Git

Repository chính xác: [thanhnguyen0203/MarkRead](https://github.com/thanhnguyen0203/MarkRead), public. Connector đang đăng nhập `thanhnguyen0203`, quyền admin/push đã kiểm. Default/remote branch là `main`, SHA `a41a13a5e0e437a83fcd89b6f193292b5fdda9b1`; branch hiện tại `feature/ui-ux-redesign`, HEAD `d5a7e5b6741e8ca15b5a09b3289ae16124bbc03c`, không upstream, 3 commit ahead/0 behind. Index trống trước và sau chuẩn bị; các thay đổi P3C–P4C có sẵn chưa commit được giữ nguyên.

Tại lần kiểm read-only: remote chỉ có `main`, 5 tag `v1.1.2`–`v1.1.6`, 2 release public `v1.1.5`/`v1.1.6`. Local chưa có tag; **v1.2.0 không tồn tại ở local/remote/releases**. Connector `/tags` trả INVALID_ARGUMENT; đã kiểm lại bằng endpoint Git refs hợp lệ, không suy 400 là không có tag. [Evidence GitHub](../../test-results/ui-p4d/GITHUB_AUDIT.json). Phải kiểm lại ngay trước mọi mutation vì remote có thể thay đổi.

Ba commit chưa push có 3 cache `.pyc` và file output Git rác đã tracked. Không xóa/sửa hoặc force-push lịch sử đó. [Kế hoạch hai commit](P4D_COMMIT_PLAN.md) đề xuất branch **codex/release-v1.2.0 từ remote main**, snapshot source/tests cuối rồi docs/evidence. Manifest duyệt liệt kê file/hash và loại trừ rõ cache/file rác/signing/build/SDK. Giữ nguyên 172 file skill đã có trên main; không đưa thêm cache skill. Không merge/push main trong kế hoạch.

## Artifact P4C đã kiểm lại

Hai tài nguyên dự kiến upload, giữ nguyên byte từ P4C:

- [MarkRead-v1.2.0.apk](../../dist/releases/v1.2.0/MarkRead-v1.2.0.apk): **7.184.639 byte**; SHA-256 **`a1ffba49a0e48008ba04e63b20baa35cfeaa2f69e8a0b8e844aa60a2743f5995`**.
- [MarkRead-v1.2.0.sha256](../../dist/releases/v1.2.0/MarkRead-v1.2.0.sha256): **86 byte**, format `<apk-sha>  MarkRead-v1.2.0.apk` + LF; SHA-256 của chính file checksum **`5db9502ecb32242d0f92d43fa7d20e8d0b4049c8db45ed0a988254d3816a0f88`**.

Certificate SHA-256: **`52a8a4d97bf264d0d43914f71408f6ccdaf6622951c55246157239aae13c2b54`**; apksigner verify/v2 thành công và khớp APK release cũ thật. zipalign và ZIP CRC đạt. Metadata compiled: `vn.markread.local`, **1.2.0/code 120**, min26/target35/compile35, MainActivity đúng, **non-debuggable, zero permissions**; backup/cleartext disabled. Renderer/notices exact, CSP hash hợp lệ, fonts/offline assets đủ. Launcher foreground/background/monochrome, normal/round adaptive và 10 PNG resolve đúng resource graph sau AAPT optimization. Không key, QA helper hoặc file private trong APK.

Không sửa, ký lại hoặc build lại APK; không viết lại checksum. Dist folder vẫn có 4 file P4C; chỉ APK/SHA dự kiến đính kèm release. Metadata/changelog dist là tài liệu local, không upload secrets hoặc toàn bộ dist. Các link local build/dist trong báo cáo lịch sử dùng trong workspace; source ZIP/TAR public không kèm những artifact ignored này, phải lấy APK/SHA ở GitHub Releases sau Publish.

[18 kiểm tra APK P4D](../../test-results/ui-p4d/APK_VERIFICATION.json).

## Commit/tag và nguồn build

APK được build ở P4C trên workspace dirty. **Không có SHA commit build gốc**, không tự gán HEAD cũ cho artifact. Commit phát hành cuối/tag **PENDING** cho đến khi người dùng duyệt kế hoạch và thực thi. [SOURCE_INPUTS.json](../../test-results/ui-p4d/SOURCE_INPUTS.json) pin byte production inputs, [PUBLICATION_MANIFEST.json](../../test-results/ui-p4d/PUBLICATION_MANIFEST.json) pin các file công bố.

Phát hiện `core.autocrlf=true` làm clean filter đổi byte HTML mixed-EOL và các input renderer. Thêm **`.gitattributes`** giới hạn trên input app/renderer/build để giữ nguyên byte đã kiểm, không đổi source hoặc dependency. Sau commit phải checkout/export và so sánh input SHA với manifest + renderer/notice trong APK, rồi mới annotated tag `v1.2.0` vào commit cuối. Đây là kiểm source-equivalence của artifact đã có, không tuyên bố APK được build từ SHA tương lai hoặc reproducible bit-for-bit rebuild.

## Tài liệu và ảnh

- [Release notes VI](RELEASE_NOTES_v1.2.0_VI.md): title **MarkRead v1.2.0 — Quiet Ink**, Quiet Ink/Settings/Library/Reader/Search, 23 Lucide, motion, Open Book, Undo/Replace/Gboard/LaTeX, native compatibility, cập nhật và giới hạn đúng bằng chứng P3/P4. Link nguồn dùng URL tag đầy đủ để hoạt động khi dán body GitHub. Chưa cần notes EN.
- [README](../../README.md): giới thiệu, tính năng, Android/WebView, ảnh thật, GitHub Releases/download, offline/privacy, cài/cập nhật, giới hạn và build được cập nhật theo 1.2.0. Bỏ các chỉ dẫn 1.1.x lỗi thời khỏi trang giới thiệu; lịch sử giữ ở CHANGELOG/báo cáo cũ.
- [Hướng dẫn](../../HUONG_DAN_CAI_DAT.md): kiểm SHA bằng PowerShell, sideload, cập nhật không uninstall, SAF, export, Search/Regex, rename, CSS, session10phút và giới hạn.
- 3 ảnh P4C Reader/Editor/CSS đã xem trực tiếp, fixture trên AVD API35/320×640; không chỉnh ảnh, không giả device thật. README không có đường dẫn user-home hoặc signing secrets. Link v1.2.0 chưa public được ghi rõ.
- Báo cáo này, [publication checklist](P4D_PUBLICATION_CHECKLIST.md) và [commit plan](P4D_COMMIT_PLAN.md); thêm evidence P4D riêng, không ghi đè P0–P4C.

## Kiểm thử và phạm vi security/privacy

**Chạy lại tại P4D:** APK18/18, launcher81/81, palette2220/2220 (12theme), kiểm inherited APK security25/25, doc/link/asset/hash/source-scope/secret checks ghi trong [VERIFICATION.json](../../test-results/ui-p4d/VERIFICATION.json). 23 Lucide registry hiện có được giữ; app source không thay byte so với snapshot đầu P4D. Không cộng các lần kiểm lại vào tổng baseline cũ.

**Kế thừa P4C, không gọi là chạy lại:** automated2385/2385 (2383cũ+2signing), native upgrade44/44, assembleRelease/lintVitalRelease thành công. P4D không có lý do rebuild hoặc chạy lại runtime/IME/SAF vì không sửa ứng dụng. Bằng chứng và raw attempts cũ còn nguyên.

Scan các file Git-visible và bản sao dự kiến công bố: không phát hiện password release thực, bản sao keystore, PEM private-key marker hoặc token theo các pattern đã kiểm. Signing material/local.properties/build/dist/SDK/cache ignored và không nằm trong proposed file manifest. Scan không chứng nhận forensic mọi secret/token trong lịch sử public hoặc nội dung mọi blob không liên quan.

Các tài liệu lịch sử có user-home prefix được tạo **bản sao công bố đã thay bằng placeholder** trong ignored `build/ui-p4d/publication/`, có hash before/after trong manifest; không sửa bản gốc P0/P1. Placeholder là vệ sinh đường dẫn trong tài liệu, không đổi kết quả test hay API ứng dụng. Các ảnh release được dùng là fixture tổng hợp; tên file/hash/URI thử nghiệm trong evidence có nguồn QA theo báo cáo từng phase.

## Thực thi và các gate còn chờ

- **PASS:** repository/account/quyền ghi được connector xác minh; artifact/checksum/signature/local docs đã chuẩn bị.
- **PENDING USER APPROVAL:** tạo hai commit/branch riêng, push branch/tag; cần chấp thuận theo yêu cầu P4D mục6.
- **NOT CREATED:** tag v1.2.0, Draft Release, release ID/link, uploaded assets. Không báo đã kiểm download khi chưa upload.
- **PENDING USER APPROVAL:** tạo Draft Release stable, không prerelease; body từ notes VI, 2assets exact. Không tự đặt Latest hoặc Publish.
- **TOOL LIMITATION:** `gh` không có trên PATH; connector có read/git operations nhưng không có create-release/upload-binary. Sau duyệt dùng giao diện GitHub đã đăng nhập nếu có, kiểm lại danh tính/quyền phiên thực thi; nếu không có phiên phù hợp thì báo bước còn thiếu. Không đọc trộm token hoặc nhận connector read access là CLI đã đăng nhập.

Sau khi tạo draft được duyệt: đối chiếu tag/commit/body, state draft=true/prerelease=false, tên/size/digest asset; tải lại APK/SHA và kiểm hash/cert. Chỉ khi đó mới có link Draft cho người dùng review. Publish cần chấp thuận tiếp theo, không nằm trong hành động tự động của P4D.

## Giới hạn và rollback

TalkBack **NOT TESTED — accepted limitation**. Máy thật/API26/OEM/provider/IME exhaustive/FPS chưa nghiệm thu; provider toast kỹ thuật và RAM draft/history giới hạn vẫn công bố. Không có issue mới của APK được phát hiện trong kiểm lại P4D.

Rollback phần P4D local: khôi phục riêng README/hướng dẫn từ `build/ui-p4d/before/`; bỏ đúng `.gitattributes`, notes/3doc P4D và evidence mới nếu không cần. Không reset HEAD, xóa công việc P3/P4 cũ, private key, APK hoặc dữ liệu app. Publication preview nằm trong build ignored; không phải checkout hay Git ref. Chưa có remote mutation để rollback. Sau khi duyệt/push không tự xóa/move tag, force-push hoặc Publish; xử lý thay đổi cần review mới.

**Dừng chờ duyệt commit/push/tag và Draft Release.** Local preparation sẵn sàng review; không gắn nhãn P4D đã phát hành.
