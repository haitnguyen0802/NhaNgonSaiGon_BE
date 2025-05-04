-- Script để cấp quyền cho người dùng từ IP 101.99.33.19
-- Lưu ý: Bạn cần chạy script này với tài khoản có quyền GRANT (thường là tài khoản root)

-- Cấp quyền từ IP cụ thể
GRANT ALL PRIVILEGES ON nhangonsaigon.* TO 'nhangonsaigon'@'101.99.33.19' IDENTIFIED BY 'nhangonsaigon_phamduytien';

-- Áp dụng thay đổi
FLUSH PRIVILEGES; 