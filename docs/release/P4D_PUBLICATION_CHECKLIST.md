# P4D — Publication checklist v1.2.0

29/10/2026 · **LOCAL READY FOR REVIEW / REMOTE ACTIONS NOT APPROVED**.

## Đã kiểm local

- [x] Đọc P4A/P4B/P4C, update validation, release checklist, changelog và P3F-R2 readiness; giữ phân phối APK trực tiếp, không Google Play.
- [x] Repository/account/quyền: `thanhnguyen0203/MarkRead`, login `thanhnguyen0203`, admin/push. Remote/default `main`; branch hiện tại `feature/ui-ux-redesign`, HEAD d5a7e5b, 3ahead/0behind, index trống.
- [x] Tag/release v1.2.0 chưa tồn tại khi kiểm; không xóa/move tag hoặc tạo release trùng.
- [x] APK P4C tồn tại, 7.184.639byte, SHA a1ffba49a0e48008ba04e63b20baa35cfeaa2f69e8a0b8e844aa60a2743f5995; canonical/dist exact.
- [x] File SHA 86byte đúng tên APK/hash/LF, không viết lại khi kiểm.
- [x] Release1.2.0/code120/appIdvn.markread.local, min26/target35, non-debuggable; cert52a8…2b54 khớp APK release cũ, apksigner/v2/zipalign/CRC đạt.
- [x] Zero permissions, không tăng network access; renderer/notices/fonts/CSP/23Lucide/theme/launcher resources đúng.
- [x] APK18, inherited security25, launcher81, palette2220 chạy lại tại P4D đạt; baseline2385/native44/build PASS là evidence P4C được kế thừa, không gọi là chạy mới.
- [x] Release notes VI, README, hướng dẫn cài/cập nhật/SAF/checksum và ảnh AVD thật đã chuẩn bị; link v1.2.0 chưa public có nhãn đúng.
- [x] Không đổi app source, version, signing, dependency hoặc byte APK; `.gitattributes` chỉ giữ exact build inputs qua Git.
- [x] Proposed file/hash manifest và source-input manifest đã tạo; scan signing/password/token patterns không thấy vấn đề trong phạm vi đã ghi.
- [x] Bản sao công bố tài liệu có user-home prefix được vệ sinh; bản gốc giữ nguyên. Cache `.pyc` và stray output trong 3commit local không đi vào nhánh mới đề xuất; không rewrite branch cũ.
- [x] Không private/SDK/cache/build/dist/APK trong source commit; chỉ upload 2release assets khi được duyệt.

## Chờ người dùng duyệt trước remote actions

- [ ] Duyệt [hai commit](P4D_COMMIT_PLAN.md), branch mới `codex/release-v1.2.0` từ main SHA a41a13a và exact file manifest; không push branch làm việc có cache/rác.
- [ ] Duyệt push branch mới và annotated tag `v1.2.0`, không push/merge main hoặc force-push.
- [ ] Duyệt tạo Draft Release **MarkRead v1.2.0 — Quiet Ink**, stable, body notes VI, upload APK/SHA đã pin. Duyệt này không cho phép Publish/Latest.

## Phải kiểm khi thực thi sau duyệt

- [ ] Refresh account/quyền/remote branch/tags/releases; dừng nếu có thay đổi ảnh hưởng kế hoạch, tag/release đã có hoặc file/hash drift.
- [ ] Có phiên GitHub có khả năng tạo draft/upload; `gh` hiện thiếu, connector không có API này. Không nhận tool read-only là write session đã xác minh.
- [ ] Tạo checkout cách ly và commit đúng file manifest; giữ workspace/index/branch gốc. Ghi SHA commit/tree thật vào báo cáo.
- [ ] Export/checkout commit cuối, đối chiếu toàn bộ production input SHA với SOURCE_INPUTS.json và renderer/notice với APK; không tự nhận dirty-build là built-from-commit.
- [ ] Kiểm staged diff và secrets lần cuối; không keystore/password/token/config máy, dữ liệu cá nhân, cache/SDK/build.
- [ ] Tạo tag mới đúng commit, push đúng branch/tag bằng refspec cụ thể, không overwrite/tag move; remote tag resolve đúng SHA.
- [ ] Tạo duy nhất một Draft Release, draft=true, prerelease=false, không đặt Latest; ghi release ID/link thật.
- [ ] Chỉ 2assets đúng tên: MarkRead-v1.2.0.apk (7.184.639byte), MarkRead-v1.2.0.sha256 (86byte). Không clobber existing asset.
- [ ] Tải lại assets, kiểm size/SHA/format checksum/cert và so với local P4C; body/title/tag đúng.
- [ ] Cập nhật báo cáo/checklist về kết quả thực tế, dừng để người dùng kiểm draft. Không đổi NOT TESTED thành PASS.

## Chỉ người dùng duyệt Publish ở bước sau

- [ ] Người dùng review Draft URL, notes, ảnh, instructions, APK đã tải lại và giới hạn.
- [ ] Tag/commit/source/asset hashes nhất quán, mọi pending gate ở trên đã giải quyết.
- [ ] Xin chấp thuận Publish riêng; không coi duyệt tạo Draft là duyệt Publish hoặc Latest.

Máy thật/API26/OEM/provider/IME exhaustive/FPS: **NOT TESTED**. TalkBack: **NOT TESTED — accepted limitation**. Không riêng TalkBack chặn phát hành; vẫn giữ semantic/ARIA/focus. [Báo cáo đầy đủ](P4D_REPORT.md).
