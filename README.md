# HRM Auto Task Extension

🤖 Chrome Extension tự động điền báo cáo công việc hằng ngày cho HRM Đại học Đông Á

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/chrome-extension-orange)

## ✨ Tính năng

- ⏰ **Tự động chạy theo lịch** - Đặt giờ và ngày trong tuần để extension tự động điền báo cáo
- 🔐 **Lưu thông tin đăng nhập** - Tự động login vào HRM
- 📝 **Điền form tự động** - Điền tên công việc, chi tiết, và ngày tháng
- 🧪 **Chế độ Test** - Chạy thử mà không submit để kiểm tra
- 📊 **Lịch sử hoạt động** - Xem log các lần chạy để debug
- 👁️ **Show/Hide Password** - Toggle hiển thị mật khẩu
- 🚫 **Chống duplicate** - Chỉ chạy 1 lần/ngày, không lặp lại

## 📦 Cài đặt

### Cách 1: Từ Release (Khuyên dùng)

1. Tải file `.zip` từ [Releases](https://github.com/luan-thnh/hrm-auto-extension/releases)
2. Giải nén file
3. Mở Chrome, vào `chrome://extensions/`
4. Bật **Developer mode** (góc phải trên)
5. Click **Load unpacked** và chọn thư mục vừa giải nén

### Cách 2: Clone từ source

```bash
git clone https://github.com/luan-thnh/hrm-auto-extension.git
```

Sau đó load unpacked như cách 1.

## 🚀 Sử dụng

1. **Click icon extension** trên toolbar Chrome
2. **Điền thông tin**:
   - Username & Password HRM
   - Tên công việc (Task)
   - Chi tiết công việc (Detail)
   - Giờ chạy (ví dụ: 9:00 AM)
   - Chọn các ngày trong tuần
3. **Click "Save & Activate"** để lưu và kích hoạt
4. Extension sẽ **tự động chạy** vào đúng giờ đã đặt

### Chế độ Test

- Click **"Chạy thử ngay (Test)"** để kiểm tra
- Chế độ test chỉ điền form, **KHÔNG submit**
- Kiểm tra form đúng rồi để extension tự động submit vào lịch

### Xem lịch sử

- Click tab **"Lịch sử"** để xem log các lần chạy
- Hữu ích để debug khi có vấn đề

## 📁 Cấu trúc

```
hrm-auto-extension/
├── manifest.json      # Extension manifest (MV3)
├── background.js      # Service worker - xử lý alarm & scheduling
├── content.js         # Content script - tương tác với trang HRM
├── popup.html         # Giao diện popup
├── popup.css          # Styles
├── popup.js           # Logic popup
├── icons/             # Icons extension
└── meo.jpg            # Avatar mèo 🐱
```

## 🔧 Cách hoạt động

```
1. Alarm chạy mỗi phút kiểm tra điều kiện
2. Nếu đúng ngày + đúng giờ + chưa chạy hôm nay:
   → Mở tab HRM (nếu chưa có)
   → Inject content script
   → Login (nếu cần)
   → Điền form công việc
   → Submit (nếu không phải test mode)
   → Đánh dấu đã hoàn thành
```

## ⚠️ Lưu ý

- Extension cần quyền truy cập `https://hrm.donga.edu.vn/*`
- Chỉ hoạt động khi Chrome đang mở
- Nếu đã chạy thành công trong ngày, sẽ không chạy lại

## 🐛 Troubleshooting

| Vấn đề                     | Giải pháp                                     |
| -------------------------- | --------------------------------------------- |
| Extension không chạy       | Kiểm tra đã "Save & Activate" chưa            |
| Chạy nhưng không điền form | Reload extension trong `chrome://extensions/` |
| Login không thành công     | Kiểm tra lại username/password                |
| Form không submit          | Có thể selector nút Lưu đã thay đổi           |

## 📄 License

MIT License - Xem file [LICENSE](LICENSE)

## 👨‍💻 Author

Created by **V99** với sự hỗ trợ của AI 🤖

---

⭐ Nếu thấy hữu ích, hãy star repo này nhé!
