# Hướng dẫn sử dụng SSH Tunnel để kết nối MySQL từ xa

SSH Tunnel cho phép bạn kết nối đến MySQL từ máy tính của bạn mà không cần thêm IP vào danh sách được phép. Phương pháp này an toàn và hiệu quả.

## Windows (sử dụng PuTTY)

1. **Tải và cài đặt PuTTY** từ [putty.org](https://www.putty.org/)

2. **Mở PuTTY và cấu hình kết nối SSH**:
   - Nhập hostname của máy chủ cPanel (ví dụ: `admin.nhangonsaigon.com.vn`)
   - Nhập port SSH (thường là 22)
   - Đặt tên và lưu session để sử dụng lại sau này

3. **Cấu hình SSH Tunnel**:
   - Trong PuTTY, chọn "Connection" > "SSH" > "Tunnels"
   - Source port: `3307` (port trên máy local của bạn)
   - Destination: `localhost:3306` (MySQL trên máy chủ)
   - Chọn "Local" và nhấn "Add"
   - Quay lại session và lưu cấu hình

4. **Kết nối SSH**:
   - Nhấn "Open" để kết nối SSH
   - Nhập thông tin đăng nhập cPanel khi được yêu cầu

5. **Cập nhật file .env**:
   ```
   DB_HOST=127.0.0.1
   DB_PORT=3307
   DB_NAME=nhangonsaigon
   DB_USER=nhangonsaigon
   DB_PASSWORD=nhangonsaigon_phamduytien
   ```

## macOS/Linux (sử dụng Terminal)

1. **Mở Terminal và tạo SSH Tunnel** bằng lệnh:
   ```
   ssh -L 3307:localhost:3306 username@admin.nhangonsaigon.com.vn
   ```
   Thay `username` bằng tên đăng nhập cPanel của bạn.

2. **Cập nhật file .env**:
   ```
   DB_HOST=127.0.0.1
   DB_PORT=3307
   DB_NAME=nhangonsaigon
   DB_USER=nhangonsaigon
   DB_PASSWORD=nhangonsaigon_phamduytien
   ```

## Sử dụng với ứng dụng Node.js

1. **Đảm bảo SSH Tunnel đang chạy** trước khi khởi động ứng dụng Node.js

2. **Khởi động ứng dụng** bằng lệnh:
   ```
   npm run dev
   ```

3. **Kiểm tra kết nối**: Ứng dụng sẽ kết nối đến MySQL thông qua SSH Tunnel

## Lưu ý quan trọng

- SSH Tunnel phải luôn được mở khi bạn muốn kết nối đến MySQL
- Nếu bạn đóng kết nối SSH, kết nối MySQL cũng sẽ mất
- Phương pháp này chỉ sử dụng khi phát triển cục bộ, không cần cho ứng dụng đã triển khai trên cPanel