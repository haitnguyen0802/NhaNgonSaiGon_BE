-- Script để cấp quyền cho người dùng từ host s103d190-u2.interdata.vn
-- Lưu ý: Bạn cần chạy script này với tài khoản có quyền GRANT (thường là tài khoản root)

-- Cấp quyền từ host cụ thể
GRANT ALL PRIVILEGES ON nhangonsaigon.* TO 'nhangonsaigon'@'s103d190-u2.interdata.vn' IDENTIFIED BY 'nhangonsaigon_phamduytien';

-- Hoặc cấp quyền từ tất cả các host (an toàn hơn nếu bạn không chắc chắn host sẽ thay đổi)
-- GRANT ALL PRIVILEGES ON nhangonsaigon.* TO 'nhangonsaigon'@'%' IDENTIFIED BY 'nhangonsaigon_phamduytien';

-- Áp dụng thay đổi
FLUSH PRIVILEGES; 