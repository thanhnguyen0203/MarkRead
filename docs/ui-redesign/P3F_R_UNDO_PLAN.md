# P3F-R1 — native textarea transaction plan

28/10/2026. Phạm vi được đánh giá trước patch: sửa adapter commit của Replace, **không tạo history engine**, không thay search worker, parser, block mapping, persistence hoặc SAF.

Probe trước sửa: `setRangeText` không tạo Undo trong Chromium156; `execCommand('insertText')` trên textarea active tạo Undo/Redo đúng, kể cả khi textarea được chiếu tạm ngoài layout. Tài liệu [MDN execCommand](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand) nêu khả năng giữ undo buffer, nhưng API deprecated và yêu cầu compatibility tests. Không suy từ desktop rằng WebView đã đạt.

Phương án nhỏ nhất:

1. Dùng chính `#editor`, tính một khoảng thay đổi liên tục giữa source cũ/mới; mở rộng boundary để không cắt surrogate pair.
2. Focus textarea tạm trong cùng JS task, `inputmode=none`, giữ scroll và trả focus/selection trigger ngay. Khi Source ẩn, chỉ chiếu pane fixed/opacity0 trong task rồi trả nguyên style; không chuyển mode hoặc tạo DOM editor thứ hai.
3. Native `insertText` là một transaction; kiểm tra giá trị sau commit chính xác bằng kết quả worker. Chặn composition và suppress handler sourceInput chỉ trong commit đồng bộ; native Undo/Redo sau đó đi qua sourceInput bình thường.
4. Nếu không focus được (ví dụ modal đã mở) hoặc API không thực hiện được, không fallback sang thay `.value` như thành công. Trường hợp native result sai phải hoàn nguyên source cũ và báo lỗi an toàn.
5. Ctrl/Cmd+Z/Redo ở reader không có text field sẽ dùng native buffer của cùng textarea; text inputs, inline textarea, modal và composing giữ ownership hiện có. Không thêm nút hoặc history/persistence schema.

Rủi ro cần chứng minh: transaction grouping, history sau chuyển mode, surrogate/zero-length regex, selection, mutation khi modal chen ngang, native input event reentrancy, focus-visible, IME focus handoff và viewport/keyboard flicker. Không claim giữ history qua đổi file/reload: native textarea trước đó cũng reset khi nạp source khác; phải kiểm tra không undo nhầm file.

Gate: baseline2097 trước sửa; tests mới cho Replace một/all/nhiều block/captures/Vietnamese/emoji, chuỗi Undo/Redo, giữ nội dung typing trước Replace và native history sau Replace, read/source/split/unified, composing no-op, unsupported API fail-closed, modal interruption. Chạy trên Chromium và Android WebView124; WebView100/physical device chưa có phải ghi rõ. Nếu không đạt gate, rollback adapter, giữ issue High và lập đề xuất sâu riêng; không viết lại editor để ép test xanh.

Rollback: khôi phục `app.js` và generated asset từ snapshot `build/ui-p3fr/before/workspace`; bỏ module transaction mới. Không reset repo hoặc tác động dữ liệu người dùng.

Giới hạn baseline đã đo: sau khi chuyển qua các input Search, Ctrl+Z không đi lùi tới typing Source trước Search (cả APK/browser trước và sau). Adapter phục hồi chính xác draft trước mỗi Replace nhưng không sửa native history ownership giữa nhiều text fields. Không coi đây là một history engine xuyên field hoặc xuyên file.
