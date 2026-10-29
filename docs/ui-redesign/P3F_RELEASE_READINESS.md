# P3F — Release Readiness

**NOT READY — chưa chuyển P4.** Ngày28/10/2026. Hoàn thành vòng QA/đánh giá P3F; không đồng nghĩa mọi điều kiện phát hành đã đạt.

Đã đạt:

- 2.061 kế thừa + 36 mới = **2.097 automated PASS**, 0 fail; palette 2.220; 12 theme/23 SVG/offline/font/CSP/resource integrity.
- Gradle debug build thành công, 18 packaging/signature/alignment checks; APK build lại và APK cài emulator cùng SHA P3E.
- Có bằng chứng Android Emulator 15/API 35/WebView 124: tree picker/subfolder/read, save-copy đúng bytes/gốc không đổi, Unicode rename/extension, saved reopen/prev-next/empty/missing file, Home/rotation/clean recreation, cold restart và số đo native frames.
- Production source/permissions/signing/version/bridge/engine không đổi; không thêm dependency/network/telemetry.

Các cổng chưa đạt:

- **F01 High:** Replace không có Undo transaction. Cần phương án được duyệt hoặc quyết định chấp nhận giới hạn rõ ràng trước bước chuẩn bị release; không tự coi known issue là PASS.
- **F03/F04 High validation gaps:** IME tiếng Việt và TalkBack chưa có nghiệm thu sử dụng thực tế. Attempt input không đủ kết luận app lỗi/đạt; phải chạy lại với precondition đúng và người đánh giá lời đọc/gesture.
- **F02 Medium:** màu lỗi KaTeX không đạt contrast ở 9 theme; cần review giải pháp error presentation an toàn, không phá explicit formula colors/custom CSS.
- **F05/F06:** profile Android kiểm soát và coverage provider/quyền/lỗi ghi/WebView tối thiểu/API cũ/system scaling còn mở. Native frame sample hiện không cho phép tuyên bố 60 FPS.
- Không có fresh-install hoặc physical-device validation trong vòng này. Đã có runtime evidence, nhưng chưa đủ phủ toàn bộ release matrix.

Artifact để review/tiếp tục test:

- Debug APK: `app/build/outputs/apk/debug/app-debug.apk`, 7.606.382 byte.
- SHA-256: `a982db7123aab3e8cb75ecce8878d103fac9056c4d21c36cf0590f3a48a24b9d`.
- Không tạo APK release, không đổi versionName 1.1.5/versionCode 115 hoặc signing. Bản debug không phải artifact phát hành.
- [Report](P3F_REPORT.md), [matrix](P3F_TEST_MATRIX.md), [issues](P3F_KNOWN_ISSUES.md), [machine-readable results](../../test-results/ui-p3f/RESULTS.json).

Việc bắt buộc trước P4:

1. Review/duyệt kết quả P3F và giải quyết quyết định F01; mọi thay đổi editor/Undo cần phạm vi và test riêng.
2. Chạy manual Gboard Vietnamese Telex/VNI nếu hỗ trợ, native selection/copy-paste, composition và keyboard insets; nếu sai/mất source, đánh dấu Blocker trước mọi release work.
3. Chạy TalkBack speech/swipe/activation trên các workflow core; phân biệt service-enabled với acceptance.
4. Review F02 bằng contrast/semantic markers riêng, giữ math/custom CSS/explicit color contract.
5. Bổ sung SAF revoked/read-only/write-failure, min WebView/API cũ, max text/display scaling và profile tài liệu nặng ở môi trường kiểm soát.
6. Chạy lại regression/palette/build/APK và targeted native cases sau mọi patch; chỉ mở P4 khi có phê duyệt phạm vi và gate tương ứng đạt hoặc exception được quyết định rõ ràng.

Lệnh PowerShell để tiếp tục **manual QA** với emulator đang có:

```powershell
$adb = Join-Path (Get-Location) 'toolchain\android-sdk\platform-tools\adb.exe'
& $adb devices -l
& $adb -s emulator-5554 shell am start -n vn.markread.local/.MainActivity
& $adb -s emulator-5554 shell am start -a android.settings.INPUT_METHOD_SUBTYPE_SETTINGS --es input_method_id com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME
# Xác minh Vietnamese/Telex trong Gboard UI và khả năng tạo dấu ngoài app trước khi test MarkRead.
& $adb -s emulator-5554 shell am start -a android.settings.ACCESSIBILITY_SETTINGS
# Bật TalkBack bằng UI, chạy checklist thủ công và tắt/khôi phục theo nhu cầu sau kiểm thử.
```

Chỉ dùng fixture; không chạy legacy emulator script có uninstall/clear-data trên dữ liệu thật. Instrumentation QA riêng cần debug certificate/fixture session; không đưa test APK/driver vào release. Không tự sửa signing, permissions hoặc mở WebView debugging để vượt lỗi test.

Rollback P3F chỉ là bỏ các file QA/test/docs mới nếu cần; production không đổi. Giữ snapshot trước P3F và công việc P3C–P3E chưa commit; không reset về HEAD. **Dừng tại P3F, chưa triển khai P4.**
