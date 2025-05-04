# Hướng dẫn kết nối từ xa đến MySQL trên cPanel

Khi phát triển ứng dụng Node.js cục bộ và kết nối đến cơ sở dữ liệu MySQL trên cPanel, bạn có thể gặp lỗi "Access denied" vì IP của bạn không được phép kết nối. Dưới đây là các giải pháp.

## Vấn đề

```
Access denied for user 'nhangonsaigon'@'101.99.33.19' (using password: YES)
```

Lỗi này xảy ra vì máy chủ MySQL trên cPanel chỉ cho phép kết nối từ các IP được phê duyệt hoặc từ localhost.

## Giải pháp 1: Sử dụng SSH Tunnel (Khuyến nghị)

SSH Tunnel cho phép bạn kết nối đến MySQL trên cPanel từ máy tính cục bộ một cách an toàn.

### Bước 1: Thiết lập SSH Tunnel

#### Windows (PuTTY)
1. Mở PuTTY và nhập thông tin máy chủ cPanel
2. Vào Connection > SSH > Tunnels
3. Source port: 3307, Destination: localhost:3306
4. Chọn Local và nhấn Add
5. Kết nối SSH

#### macOS/Linux
```bash
ssh -L 3307:localhost:3306 username@admin.nhangonsaigon.com.vn
```

### Bước 2: Cập nhật file .env.local
```
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=nhangonsaigon
DB_USER=nhangonsaigon
DB_PASSWORD=nhangonsaigon_phamduytien
```

### Bước 3: Khởi động ứng dụng
```bash
npm run dev
```

## Giải pháp 2: Thêm IP vào danh sách được phép

### Bước 1: Xác định IP công cộng của bạn
Truy cập trang web như [whatismyip.com](https://www.whatismyip.com/) để xác định IP

### Bước 2: Thêm IP vào Remote MySQL trong cPanel
1. Đăng nhập vào cPanel
2. Tìm và mở "Remote MySQL"
3. Thêm IP của bạn vào danh sách

### Bước 3: Hoặc thực hiện qua phpMyAdmin
```sql
GRANT ALL PRIVILEGES ON nhangonsaigon.* TO 'nhangonsaigon'@'101.99.33.19' IDENTIFIED BY 'nhangonsaigon_phamduytien';
FLUSH PRIVILEGES;
```

### Bước 4: Cập nhật file .env
```
DB_HOST=admin.nhangonsaigon.com.vn
DB_PORT=3306
DB_NAME=nhangonsaigon
DB_USER=nhangonsaigon
DB_PASSWORD=nhangonsaigon_phamduytien
```

## Giải pháp 3: Sử dụng database cục bộ cho phát triển

Nếu không thể kết nối đến MySQL từ xa, bạn có thể cân nhắc:
1. Cài đặt MySQL cục bộ
2. Sao lưu cơ sở dữ liệu từ cPanel và nhập vào MySQL cục bộ
3. Sử dụng cấu hình cục bộ cho phát triển

## Lưu ý quan trọng

### Phát triển cục bộ
- Sử dụng file `.env.local` với SSH Tunnel
- Không commit file này vào git

### Triển khai trên cPanel
- Sử dụng file `.env.production` và đổi tên thành `.env` khi triển khai
- Đảm bảo `DB_HOST=localhost` trong môi trường production

### Bảo mật
- Không lưu mật khẩu trong file kèm theo git
- Cân nhắc sử dụng biến môi trường của cPanel nếu có thể 