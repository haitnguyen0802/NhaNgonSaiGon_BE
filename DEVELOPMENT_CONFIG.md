# Hướng dẫn phát triển ứng dụng NhaNgonSaiGon

## Giải thích cơ chế hoạt động

Dự án NhaNgonSaiGon có thể chạy trong hai môi trường:

1. **Môi trường sản xuất trên cPanel** - khi ứng dụng đã được triển khai
2. **Môi trường phát triển cục bộ** - khi bạn phát triển trên máy tính cá nhân

Hệ thống đã được cập nhật để tự động phát hiện môi trường và áp dụng cấu hình phù hợp.

## Cấu hình cho phát triển cục bộ

Để phát triển cục bộ, bạn có hai tùy chọn:

### Tùy chọn 1: Sử dụng SSH Tunnel (Khuyến nghị)

1. **Thiết lập SSH Tunnel**:
   - Xem hướng dẫn trong file `SSH_TUNNEL.md` để thiết lập kết nối
   - SSH Tunnel sẽ chuyển tiếp kết nối cục bộ đến cơ sở dữ liệu từ xa

2. **Tạo file `.env.local`**:
   ```
   PORT=5000
   NODE_ENV=development
   DB_HOST=127.0.0.1
   DB_PORT=3307
   DB_NAME=nhangonsaigon
   DB_USER=nhangonsaigon
   DB_PASSWORD=nhangonsaigon_phamduytien
   JWT_SECRET=nhangonsaigon_phamduytien
   JWT_EXPIRES_IN=90d
   ```

3. **Sử dụng file `.env.local`**:
   - Hãy đổi tên file `.env.local` thành `.env` khi phát triển cục bộ
   - Đổi tên file `.env` thành `.env.production` để sử dụng sau này

### Tùy chọn 2: Dùng địa chỉ domain thực tế (Yêu cầu cấu hình bảo mật bổ sung)

Nếu bạn muốn kết nối trực tiếp đến máy chủ MySQL từ xa:

1. **Yêu cầu cấp quyền truy cập từ xa**:
   - Liên hệ quản trị viên cPanel để cấp quyền cho IP của bạn
   - Hoặc thêm IP của bạn vào danh sách được phép trong Remote MySQL của cPanel

2. **Sử dụng file `.env` với cấu hình**:
   ```
   PORT=5000
   NODE_ENV=development
   DB_HOST=admin.nhangonsaigon.com.vn
   DB_PORT=3306
   DB_NAME=nhangonsaigon
   DB_USER=nhangonsaigon
   DB_PASSWORD=nhangonsaigon_phamduytien
   JWT_SECRET=nhangonsaigon_phamduytien
   JWT_EXPIRES_IN=90d
   ```

## Cấu hình cho môi trường sản xuất

Khi triển khai lên cPanel, bạn nên sử dụng:

```
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nhangonsaigon
DB_USER=nhangonsaigon
DB_PASSWORD=nhangonsaigon_phamduytien
JWT_SECRET=nhangonsaigon_phamduytien
JWT_EXPIRES_IN=90d
```

## Cơ chế tự động phát hiện môi trường

File `src/config/database.js` đã được cập nhật để:

1. Tự động phát hiện môi trường đang chạy (cPanel hoặc máy tính cục bộ)
2. Kiểm tra xem SSH Tunnel có hoạt động không (cổng 3307)
3. Hiển thị cảnh báo và gợi ý nếu cấu hình không phù hợp
4. Tự động tìm socket MySQL phù hợp nếu đang chạy trên cPanel

## Cách xử lý các lỗi phổ biến

### Lỗi "Access denied" từ máy cục bộ

Nếu bạn gặp lỗi:
```
Access denied for user 'nhangonsaigon'@'101.99.33.19' (using password: YES)
```

Điều này có nghĩa là:
- Bạn đang kết nối trực tiếp từ máy tính cục bộ đến MySQL từ xa
- MySQL từ chối kết nối vì IP của bạn không được phép

**Giải pháp**: Sử dụng SSH Tunnel như mô tả trong tùy chọn 1.

### Lỗi "Host not found"

Nếu bạn gặp lỗi:
```
getaddrinfo ENOTFOUND admin.nhangonsaigon.com.vn
```

Điều này có nghĩa là:
- Không thể phân giải tên miền thành địa chỉ IP
- Có thể là vấn đề DNS hoặc lỗi đánh máy

**Giải pháp**: Kiểm tra kết nối internet và đảm bảo tên miền chính xác.

## Khởi động ứng dụng

Sau khi cấu hình phù hợp, khởi động ứng dụng:
```bash
npm run dev
```

Ứng dụng sẽ tự động phát hiện môi trường và cấu hình phù hợp.