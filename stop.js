const fs = require('fs');
const path = require('path');

// Đường dẫn đến file PID
const pidFile = path.join(__dirname, 'app.pid');

// Kiểm tra xem file PID có tồn tại không
if (fs.existsSync(pidFile)) {
  // Đọc PID từ file
  const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
  
  try {
    // Gửi tín hiệu SIGTERM để dừng tiến trình
    process.kill(pid, 'SIGTERM');
    console.log(`Đã gửi tín hiệu dừng đến tiến trình với PID: ${pid}`);
    
    // Xóa file PID
    fs.unlinkSync(pidFile);
  } catch (error) {
    console.error(`Không thể dừng tiến trình: ${error.message}`);
    
    // Xóa file PID nếu tiến trình không còn tồn tại
    if (error.code === 'ESRCH') {
      fs.unlinkSync(pidFile);
      console.log('Đã xóa file PID.');
    }
  }
} else {
  console.log('Không tìm thấy file PID. Ứng dụng có thể không đang chạy.');
} 