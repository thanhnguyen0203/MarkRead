# P4D — Kế hoạch commit và tag để duyệt

29/10/2026 · **PROPOSED — chưa commit, push hoặc tag.** Xem [publication manifest](../../test-results/ui-p4d/PUBLICATION_MANIFEST.json) để duyệt từng file/hash; [source inputs](../../test-results/ui-p4d/SOURCE_INPUTS.json) pin byte đầu vào ứng dụng.

## Cơ sở Git đã xác minh

- Repository `thanhnguyen0203/MarkRead`, public, tài khoản connector `thanhnguyen0203` có quyền admin/push.
- Branch làm việc `feature/ui-ux-redesign`, HEAD `d5a7e5b6741e8ca15b5a09b3289ae16124bbc03c`; không có upstream.
- Remote chỉ thấy `main`, SHA `a41a13a5e0e437a83fcd89b6f193292b5fdda9b1`, cũng là default branch. So sánh `origin/main...HEAD`: 0 behind / 3 ahead; ba commit local `5efe52f`, `7fe84d0`, `d5a7e5b`.
- Ba commit đó có thêm ba Python bytecode cache và file rác tên bắt đầu `sibility improvements` (nội dung là output Git). Không đưa các commit này thẳng lên remote. Không sửa/xóa chúng hoặc thay lịch sử branch hiện tại.

## Hai commit đề xuất

Tạo branch riêng **`codex/release-v1.2.0` từ remote main SHA đã nêu**, trong checkout cách ly sau khi được duyệt. Dùng đúng file manifest; không `git add .`, không copy `.agents`, không copy thư mục ignored. Không đổi branch/workspace đang có draft thay đổi của người dùng. Nếu remote main, tag/release hoặc input hashes đã đổi khi thực thi, dừng để đánh giá lại.

1. **`release: capture verified MarkRead 1.2.0 source and tests`** — lưu mã nguồn cuối P2–P4C và bộ test/build scripts/resource launcher theo nhóm `source-and-tests`. Đây là snapshot tích hợp từ workspace đã nghiệm thu, không giả dựng các commit lịch sử P3/P4 riêng lẻ. Bao gồm `.gitattributes` giữ byte các input build, public certificate pin và signing guard. Dependency versions giữ nguyên; không có keystore/password/config máy.
2. **`docs: prepare Quiet Ink 1.2.0 release and validation evidence`** — nhóm `docs-and-evidence`: tài liệu P0–P4D, nguồn thiết kế icon, README/hướng dẫn, release notes VI, fixture và bằng chứng kiểm thử. Các bản sao công bố của tài liệu có user-home prefix được thay bằng placeholder theo manifest; bản gốc trong workspace không đổi. Giữ nguyên assertions/evidence, không biến FAIL attempt thành PASS. Không thêm bản notes EN chưa được biên tập.

Nhánh mới giữ nguyên ancestry của `main`, tránh mang cache/file rác của ba commit chưa push vào lịch sử công bố. Không force-push, rebase hoặc merge main trong bước này. Nội dung P2–P4C vẫn được lưu bằng snapshot đã kiểm; không bỏ source chỉ vì nó chưa commit ở branch cũ.

## APK và source provenance

APK P4C được build khi workspace còn dirty; **không tồn tại commit build gốc để viện dẫn**. Không gắn tag vào HEAD cũ và không khẳng định APK được build từ một SHA chưa tồn tại.

Manifest pin toàn bộ input production đang kiểm. APK chứa exact renderer/notice hiện tại; source Java, JS/CSS và icon được đối chiếu snapshot P4C cùng những thay đổi version/signing P4C đã báo cáo. `.gitattributes` ngăn `core.autocrlf=true` đổi byte HTML/CSS/JS khi commit/checkout, đặc biệt HTML mixed EOL và CSP inline script. Không đổi byte file ứng dụng để giải quyết vấn đề này.

Sau hai commit, **phải checkout/export commit cuối và so sánh SHA-256 từng input production với SOURCE_INPUTS.json**, cùng renderer trong APK, trước khi tạo tag. Commit SHA và tree sẽ được ghi lại khi thực sự tạo; hiện là **PENDING**, không dùng SHA dự đoán. Đây là source-equivalence verification cho artifact dirty-build có sẵn, không phải bằng chứng reproducible APK bit-for-bit rebuild; không build lại APK chỉ để tạo lịch sử Git giả.

## Thao tác remote cần duyệt riêng

- Push branch mới bằng refspec chính xác `codex/release-v1.2.0:codex/release-v1.2.0`; không push `main` hoặc tất cả branch.
- Tạo annotated tag mới `v1.2.0` trỏ vào commit cuối đã kiểm, push đúng `refs/tags/v1.2.0`; kiểm lại tag chưa tồn tại trước khi tạo/push, không overwrite/move tag.
- Tạo **Draft Release**, stable (`prerelease=false`), title **MarkRead v1.2.0 — Quiet Ink**, notes từ [VI](RELEASE_NOTES_v1.2.0_VI.md). Chỉ upload hai file APK/SHA đã kiểm. Không publish, không chủ động đặt Latest, không dùng `--clobber`.
- Sau upload, đọc lại release ID/link/draft/tag/commit/body; tải lại hai assets để kiểm size/SHA/bytes, kiểm cert APK tải lại. Nếu fail, giữ draft, báo cáo; không tự Publish hoặc thay asset khác để vượt gate.

Connector GitHub hiện có đủ khả năng đọc metadata/quyền nhưng không có API tạo Release/upload binary. `gh` chưa có trên PATH. Khi được duyệt, có thể dùng giao diện GitHub đã đăng nhập để tạo draft/upload; danh tính và quyền của phiên thực thi đó phải kiểm lại, không tự lấy token từ credential store hoặc từ connector. Nếu không có phiên phù hợp, ghi rõ bước chưa thực hiện, không báo Draft đã tạo.

**Duyệt kế hoạch không đồng nghĩa duyệt Publish.** Trước Publish cần người dùng kiểm draft, tài nguyên tải lại, SHA commit/tag, nội dung notes, ảnh và hướng dẫn; nếu thay đổi nội dung phải cập nhật manifest/review lại phần tương ứng.
