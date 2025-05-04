require('dotenv').config();
const emailService = require('./emailService');

/**
 * Test email functionality
 */
async function testEmail() {
  try {
    // Use the emailService to send test emails individually to each recipient
    return await emailService.sendTestEmail();
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        response: error.response
      }
    };
  }
}

// Nếu chạy file này trực tiếp
if (require.main === module) {
  testEmail()
    .then(result => {
      if (result.success) {
        console.log('\n✓ Email đã được gửi thành công!');
        console.log('- Số email đã gửi:', result.recipients.length);
        console.log('- Các địa chỉ nhận:', result.recipients.join(', '));
        console.log('\n===============================================');
        console.log('    KIỂM TRA GỬI EMAIL THÀNH CÔNG!           ');
        console.log('===============================================');
      } else {
        console.log('\nChi tiết lỗi:');
        console.log('- Mã lỗi:', result.error.code);
        console.log('- Thông báo lỗi:', result.error.message);
        
        if (result.error.response) {
          console.log('- Phản hồi từ server:', result.error.response);
        }
        
        console.log('\nGợi ý khắc phục:');
        
        if (result.error.code === 'EAUTH') {
          console.log('1. Kiểm tra lại tên đăng nhập và mật khẩu trong file .env');
          console.log('2. Xác nhận rằng tài khoản email đã được kích hoạt trên server');
          console.log('3. Đảm bảo mật khẩu email là chính xác');
          console.log('\nLưu ý: Bạn đang sử dụng email no-reply@nhangonsaigon.com.vn');
          console.log('Đối với port 465, hãy đảm bảo EMAIL_SECURE=true trong file .env');
        } else if (result.error.code === 'ESOCKET' || result.error.code === 'ETIMEDOUT') {
          console.log('1. Kiểm tra lại EMAIL_HOST=mail.nhangonsaigon.com.vn');
          console.log('2. Kiểm tra lại EMAIL_PORT=465 và EMAIL_SECURE=true');
          console.log('3. Xác nhận rằng bạn có thể kết nối đến máy chủ mail từ mạng hiện tại');
        } else {
          console.log('1. Kiểm tra lại tất cả cấu hình email trong file .env');
          console.log('2. Liên hệ nhà cung cấp hosting để được hỗ trợ');
        }
      }
    })
    .catch(console.error);
}

module.exports = testEmail; 