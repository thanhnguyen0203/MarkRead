# Không gian cho những ý tưởng

Đọc chậm một chút, ghi lại điều cần nhớ. MarkRead giữ **chữ đậm**, *chữ nghiêng*, ~~gạch bỏ~~ và tiếng Việt: Nguyễn, học tập, sáng tạo — Unicode 💠.

## Một nhịp đọc rõ ràng

Đây là đoạn văn có [liên kết tới phần cuối](#kết-luận), một đoạn `inline_code()` và công thức $a^2+b^2=c^2$ trong dòng.

> Một ghi chú có khoảng thở, giữ nguyên nội dung và ý nghĩa.
>
> **Chữ cần nhấn mạnh** vẫn rõ trên nền trích dẫn.

### Danh sách có phân cấp

1. Đọc chương thứ nhất.
2. Ghi chép và đối chiếu.
   - Ý chính của tài liệu.
   - Ví dụ có Unicode và ký tự & < >.
     - Một nhánh sâu hơn để kiểm tra thụt lề.

- [x] Giữ cấu trúc Markdown.
- [ ] Chọn font phù hợp với cách đọc.

#### Ghi chú cấp bốn

Một đoạn ngắn, không thêm card quanh từng khối.

##### Ghi chú cấp năm

Nội dung tiếp theo vẫn dùng font bài đọc đã chọn.

###### Ghi chú cấp sáu

Phân cấp bằng chữ và khoảng cách.

## Code và khoảng trắng

```javascript
function readDocument(name) {
  const message = "Xin chào, " + name;
  return message; // Giữ khoảng trắng và thụt dòng.
}
const longLine = "abcdefghijklmnopqrstuvwxyz_abcdefghijklmnopqrstuvwxyz_abcdefghijklmnopqrstuvwxyz_abcdefghijklmnopqrstuvwxyz_abcdefghijklmnopqrstuvwxyz";
```

## Bảng và công thức

| Chủ đề | Ghi chú | Trạng thái |
| --- | --- | --- |
| Typography | Chữ rõ, khoảng cách vừa đủ | Đã đọc |
| Unicode | Tiếng Việt & ký tự 💠 | Giữ nguyên |
| Mã dài | a_very_long_unbroken_value_that_requires_local_horizontal_scrolling_in_a_table_cell_123456789 | Cần đối chiếu |

$$
\frac{\sqrt{a^2+b^2}}{\displaystyle\sum_{i=1}^{n} x_i}+\int_{0}^{\infty} e^{-x^2}\,dx=\frac{\sqrt{\pi}}{2}
$$

![Ảnh mẫu tỉ lệ 3:1](sample.png)

<details><summary>Đọc thêm ghi chú</summary><p>Disclosure native, giữ semantics và keyboard.</p></details>

---

## Kết luận

Văn bản là trọng tâm. Chú thích dạng [^ghi-chu] chỉ được xử lý nếu parser hiện có hỗ trợ.

[^ghi-chu]: Không thêm extension parser trong bản thiết kế giao diện.
