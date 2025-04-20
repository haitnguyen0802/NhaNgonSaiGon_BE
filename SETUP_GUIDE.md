# Hướng dẫn thiết lập và khởi động ứng dụng NhaNgonSaiGon

## Mục lục

1. [Giới thiệu](#giới-thiệu)
2. [Phát triển trên máy tính cục bộ](#phát-triển-trên-máy-tính-cục-bộ)
   - [Phương pháp 1: Sử dụng SSH Tunnel](#phương-pháp-1-sử-dụng-ssh-tunnel-khuyến-nghị)
   - [Phương pháp 2: Kết nối trực tiếp](#phương-pháp-2-kết-nối-trực-tiếp)
3. [Triển khai lên cPanel](#triển-khai-lên-cpanel)
4. [Xử lý lỗi phổ biến](#xử-lý-lỗi-phổ-biến)
5. [Thông tin bổ sung](#thông-tin-bổ-sung)

## Giới thiệu

Dự án NhaNgonSaiGon đã được cập nhật để hỗ trợ cả việc phát triển cục bộ và triển khai lên cPanel một cách thuận tiện. Hướng dẫn này sẽ giúp bạn hiểu và thiết lập các môi trường làm việc khác nhau.

## Phát triển trên máy tính cục bộ

### Phương pháp 1: Sử dụng SSH Tunnel (Khuyến nghị)

SSH Tunnel cho phép bạn kết nối an toàn đến cơ sở dữ liệu MySQL trên cPanel từ máy tính cục bộ mà không cần thay đổi cấu hình bảo mật.

#### Thiết lập sử dụng script tự động

1. **Chạy script `start-tunnel.bat`**:
   - Double click vào file `start-tunnel.bat`
   - Script sẽ tự động thiết lập SSH Tunnel và khởi động ứng dụng
   - Nhập tên đăng nhập cPanel khi được yêu cầu

#### Thiết lập thủ công

1. **Thiết lập SSH Tunnel bằng PuTTY**:
   - Tải và cài đặt [PuTTY](https://www.putty.org/)
   - Mở PuTTY, nhập `admin.nhangonsaigon.com.vn` vào Host Name
   - Đi đến Connection > SSH > Tunnels
   - Source port: `3307`, Destination: `localhost:3306`, chọn Local
   - Nhấn Add, sau đó lưu session và kết nối

2. **Sử dụng file cấu hình phù hợp**:
   - Đổi tên `.env.tunnel` thành `.env` (hoặc sao chép nội dung)
   - Đảm bảo các thông tin kết nối là:
     ```
     DB_HOST=127.0.0.1
     DB_PORT=3307
     ```

3. **Khởi động ứng dụng**:
   ```bash
   npm run dev
   ```

### Phương pháp 2: Kết nối trực tiếp

Nếu bạn muốn kết nối trực tiếp đến cơ sở dữ liệu từ xa mà không qua SSH Tunnel:

1. **Cấp quyền cho IP của bạn**:
   - Đăng nhập vào cPanel
   - Tìm và mở "Remote MySQL"
   - Thêm IP của bạn vào danh sách được phép

2. **Sử dụng cấu hình kết nối trực tiếp**:
   ```
   DB_HOST=admin.nhangonsaigon.com.vn
   DB_PORT=3306
   ```

3. **Khởi động ứng dụng**:
   ```bash
   npm run dev
   ```

## Triển khai lên cPanel

Khi triển khai ứng dụng lên cPanel:

1. **Sao lưu file `.env` hiện tại** (nếu bạn đang sử dụng cho phát triển cục bộ)

2. **Tạo file `.env` cho cPanel**:
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

3. **Upload tất cả file lên cPanel** (không bao gồm `node_modules`)

4. **Cài đặt dependencies trên cPanel**:
   ```bash
   npm install --production
   ```

5. **Khởi động ứng dụng**:
   ```bash
   npm start
   ```

## Xử lý lỗi phổ biến

### Lỗi "Access denied"

Nếu gặp lỗi:
```
Access denied for user 'nhangonsaigon'@'101.99.33.19' (using password: YES)
```

**Nguyên nhân**: IP của bạn không được phép kết nối đến MySQL.

**Giải pháp**:
- Sử dụng SSH Tunnel (Phương pháp 1)
- Hoặc cấp quyền cho IP của bạn (Phương pháp 2)

### Lỗi "Connection refused" hoặc "ECONNREFUSED"

**Nguyên nhân**: Không thể thiết lập kết nối đến máy chủ.

**Giải pháp**:
- Kiểm tra kết nối internet
- Kiểm tra xem tên miền có chính xác không
- Kiểm tra xem cổng MySQL (3306) có đang mở trên máy chủ không

### Lỗi "SSH Tunnel không hoạt động"

**Nguyên nhân**: SSH Tunnel chưa được thiết lập hoặc đã bị ngắt kết nối.

**Giải pháp**:
- Đảm bảo PuTTY đang chạy và kết nối SSH Tunnel đang hoạt động
- Kiểm tra lại cấu hình Tunnel trong PuTTY

## Thông tin bổ sung

- **File `.env.tunnel`**: Cấu hình cho phát triển cục bộ với SSH Tunnel
- **File `.env.production`**: Cấu hình cho môi trường sản xuất trên cPanel
- **Script `start-tunnel.bat`**: Tự động thiết lập SSH Tunnel và khởi động ứng dụng

Để biết thêm chi tiết, vui lòng xem các file:
- `SSH_TUNNEL.md`: Hướng dẫn chi tiết về thiết lập SSH Tunnel
- `DEVELOPMENT_CONFIG.md`: Hướng dẫn về cấu hình phát triển
- `CPANEL_SETUP.md`: Hướng dẫn triển khai lên cPanel 