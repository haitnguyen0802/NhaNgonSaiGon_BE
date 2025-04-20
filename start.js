const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Đường dẫn đến ứng dụng
const appPath = path.join(__dirname, 'server.js');

// Đường dẫn đến file log
const logPath = path.join(__dirname, 'app.log');
const errorLogPath = path.join(__dirname, 'app-error.log');

// Tạo luồng ghi log
const out = fs.openSync(logPath, 'a');
const err = fs.openSync(errorLogPath, 'a');

// Kiểm tra xem ứng dụng đã chạy chưa
const isRunning = () => {
  try {
    const pidFile = path.join(__dirname, 'app.pid');
    if (fs.existsSync(pidFile)) {
      const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
      // Kiểm tra xem tiến trình có tồn tại không
      process.kill(pid, 0);
      return true;
    }
  } catch (e) {
    // Nếu có lỗi, tiến trình không tồn tại
    return false;
  }
  return false;
};

// Lưu PID của tiến trình
const savePid = (pid) => {
  const pidFile = path.join(__dirname, 'app.pid');
  fs.writeFileSync(pidFile, pid.toString());
};

// Khởi chạy ứng dụng
const startApp = () => {
  if (isRunning()) {
    console.log('Ứng dụng đã đang chạy');
    return;
  }

  const child = spawn('node', [appPath], {
    detached: true,
    stdio: ['ignore', out, err]
  });

  console.log(`Ứng dụng đã được khởi chạy với PID: ${child.pid}`);
  savePid(child.pid);
  
  // Tách tiến trình con
  child.unref();
};

startApp(); 