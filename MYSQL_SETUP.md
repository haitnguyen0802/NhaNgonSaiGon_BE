# Hướng dẫn cấu hình MySQL trên cPanel

## 1. Kiểm tra thông tin cơ sở dữ liệu

1. Đăng nhập vào cPanel
2. Tìm và mở mục "MySQL Databases"
3. Xác nhận tên cơ sở dữ liệu, tên người dùng và mật khẩu

## 2. Cấp quyền truy cập cho người dùng

### Cách 1: Sử dụng giao diện cPanel

1. Trong cPanel, tìm và mở mục "Remote MySQL"
2. Thêm tên host `s103d190-u2.interdata.vn` vào danh sách được phép
3. Nếu không có tùy chọn nhập hostname cụ thể, bạn có thể thử thêm '%' để cho phép truy cập từ mọi host

### Cách 2: Sử dụng phpMyAdmin

1. Trong cPanel, tìm và mở phpMyAdmin
2. Đăng nhập với thông tin tài khoản MySQL có quyền quản trị
3. Chọn tab "SQL" và chạy các lệnh sau:

```sql
GRANT ALL PRIVILEGES ON nhangonsaigon.* TO 'nhangonsaigon'@'s103d190-u2.interdata.vn' IDENTIFIED BY 'nhangonsaigon_phamduytien';
FLUSH PRIVILEGES;
```

4. Nếu bạn muốn cho phép kết nối từ mọi host, hãy sử dụng:

```sql
GRANT ALL PRIVILEGES ON nhangonsaigon.* TO 'nhangonsaigon'@'%' IDENTIFIED BY 'nhangonsaigon_phamduytien';
FLUSH PRIVILEGES;
```

### Cách 3: Liên hệ hỗ trợ hosting

Nếu bạn không có quyền thực hiện các thao tác trên, hãy liên hệ nhà cung cấp hosting để họ giúp:
- Cung cấp cho họ hostname máy chủ (`s103d190-u2.interdata.vn`)
- Yêu cầu họ cấp quyền cho người dùng MySQL `nhangonsaigon` kết nối từ hostname này
- Hoặc yêu cầu họ cấp quyền từ tất cả các host (%)

## 3. Các trường hợp đặc biệt

### Nếu bạn không thể thay đổi quyền MySQL

Một số hosting giới hạn việc thay đổi quyền MySQL. Trong trường hợp này, bạn có thể thử các giải pháp thay thế:

1. **Sử dụng biến môi trường để cấu hình kết nối**:
   
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=nhangonsaigon
   DB_USER=nhangonsaigon
   DB_PASSWORD=nhangonsaigon_phamduytien
   ```

2. **Thay đổi cấu hình ứng dụng**: Thay vì kết nối qua hostname, bạn có thể thử kết nối qua socket UNIX nếu hosting hỗ trợ:

   Trong file `src/config/database.js`, hãy thử bổ sung:
   ```javascript
   socketPath: '/var/lib/mysql/mysql.sock', // Đường dẫn có thể khác tùy hosting
   ```

3. **Kiểm tra cách cPanel cấu hình Node.js**: Một số cPanel có thể cấu hình Node.js chạy trong môi trường có sẵn với biến môi trường khác. 