# Hướng dẫn cài đặt ứng dụng Node.js trên cPanel

## 1. Chuẩn bị cơ sở dữ liệu

1. Đăng nhập vào cPanel
2. Tìm và mở MySQL Databases
3. Tạo cơ sở dữ liệu mới
4. Tạo hoặc chọn một người dùng MySQL
5. Thêm người dùng vào cơ sở dữ liệu với đầy đủ quyền
6. Ghi lại thông tin cơ sở dữ liệu (tên DB, tên người dùng, mật khẩu)

## 2. Upload ứng dụng

1. Nén toàn bộ dự án (không bao gồm thư mục `node_modules`) thành file ZIP
2. Trong cPanel, sử dụng File Manager để upload file ZIP đến thư mục muốn cài đặt (thường là `public_html` hoặc thư mục con trong đó)
3. Giải nén file ZIP

## 3. Cấu hình ứng dụng

1. Chỉnh sửa file `.env` với thông tin kết nối cơ sở dữ liệu đã tạo:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=tên_database_trên_cpanel
   DB_USER=username_database_cpanel
   DB_PASSWORD=password_database_cpanel
   JWT_SECRET=your_jwt_secret_key_change_this
   ```

2. Đảm bảo `NODE_ENV=production` trong file `.env`

## 4. Cài đặt dependencies và khởi chạy ứng dụng

1. Trong cPanel, tìm và mở "Setup Node.js App"
2. Tạo ứng dụng Node.js mới:
   - Chọn thư mục chứa ứng dụng đã upload
   - Chọn phiên bản Node.js (khuyến nghị v18.x hoặc mới hơn)
   - Nhập lệnh khởi động: `npm start`
   - Nhập file entry point: `server.js`
   - Lưu

3. Sau khi tạo ứng dụng, cần cài đặt dependencies:
   - Click vào "Run NPM Install" hoặc vào terminal của cPanel chạy lệnh:
     ```
     cd /đường_dẫn_đến_thư_mục_dự_án
     npm install --production
     ```

4. Khởi chạy ứng dụng:
   - Nhấn Start Node.js Application trên giao diện quản lý Node.js của cPanel
   - Hoặc chạy thủ công qua SSH: `node start.js`

## 5. Cấu hình domain hoặc subdomain

1. Trong cPanel, tìm và mở "Domains" hoặc "Subdomains"
2. Thêm domain hoặc subdomain mới, trỏ tới thư mục cài đặt

## 6. Cấu hình Proxy HTTP qua .htaccess

1. Đảm bảo file `.htaccess` đã được upload và có nội dung:
   ```
   RewriteEngine On
   RewriteRule ^$ http://127.0.0.1:PORT/ [P,L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ http://127.0.0.1:PORT/$1 [P,L]
   ```
   Thay `PORT` bằng cổng Node.js đã cấu hình trong cPanel

2. Đảm bảo module proxy của Apache đã được kích hoạt trên máy chủ

## 7. Quản lý ứng dụng

- Sử dụng file `start.js` để khởi động ứng dụng
- Sử dụng file `stop.js` để dừng ứng dụng
- Kiểm tra log trong các file `app.log` và `app-error.log`

## Gỡ lỗi phổ biến

1. **Lỗi kết nối cơ sở dữ liệu**: Kiểm tra thông tin kết nối trong file `.env`
2. **Ứng dụng không khởi động**: Kiểm tra file log lỗi `app-error.log`
3. **Lỗi 503 Service Unavailable**: Kiểm tra xem ứng dụng đã được khởi động chưa
4. **Lỗi CORS**: Cập nhật cấu hình CORS trong ứng dụng để cho phép domain mới 