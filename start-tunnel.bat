@echo off
title SSH Tunnel cho NhaNgonSaiGon

echo ===== SSH Tunnel cho NhaNgonSaiGon =====
echo.
echo Script này sẽ:
echo 1. Kiểm tra SSH Tunnel
echo 2. Thiết lập kết nối nếu cần
echo 3. Sao chép file cấu hình phù hợp
echo 4. Khởi động ứng dụng Node.js
echo.

REM Kiểm tra xem PuTTY đã được cài đặt chưa
where plink >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [CẢNH BÁO] Không tìm thấy plink.exe (một phần của PuTTY).
    echo Vui lòng tải và cài đặt PuTTY từ: https://www.putty.org/
    echo.
    pause
    exit /b
)

REM Kiểm tra xem SSH Tunnel đã hoạt động chưa
echo Kiểm tra SSH Tunnel...
powershell -Command "Test-NetConnection -ComputerName 127.0.0.1 -Port 3307 -InformationLevel Quiet" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [THÀNH CÔNG] SSH Tunnel đã hoạt động (cổng 3307).
) else (
    echo [THÔNG BÁO] SSH Tunnel chưa hoạt động. Đang thiết lập...
    
    REM Xác nhận thông tin đăng nhập
    set /p username=Nhập tên đăng nhập cPanel: 
    
    REM Khởi động SSH Tunnel (sử dụng plink từ PuTTY)
    start "SSH Tunnel" cmd /c "plink -ssh -L 3307:localhost:3306 %username%@admin.nhangonsaigon.com.vn -N"
    
    echo [THÔNG BÁO] Đang chờ kết nối được thiết lập...
    timeout /t 5 /nobreak >nul
    
    REM Kiểm tra lại kết nối
    powershell -Command "Test-NetConnection -ComputerName 127.0.0.1 -Port 3307 -InformationLevel Quiet" >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [THÀNH CÔNG] SSH Tunnel đã được thiết lập.
    ) else (
        echo [LỖI] Không thể thiết lập SSH Tunnel. Vui lòng thử lại thủ công.
        echo Xem hướng dẫn trong file SSH_TUNNEL.md
        pause
        exit /b
    )
)

REM Sao chép file cấu hình phù hợp
echo.
echo Chuẩn bị file cấu hình...

if exist .env.tunnel (
    copy /Y .env.tunnel .env >nul
    echo [THÀNH CÔNG] Đã sao chép file .env.tunnel thành .env
) else (
    echo [CẢNH BÁO] Không tìm thấy file .env.tunnel
    echo Vui lòng đảm bảo các thông tin kết nối trong file .env là chính xác:
    echo DB_HOST=127.0.0.1
    echo DB_PORT=3307
)

echo.
echo Tất cả đã sẵn sàng! Khởi động ứng dụng...
echo.

REM Khởi động ứng dụng Node.js
npm run dev

exit /b 