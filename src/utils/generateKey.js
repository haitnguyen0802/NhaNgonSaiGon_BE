require('dotenv').config();
const { connectDB } = require('../config/database');
const AuthKey = require('../models/AuthKey');
const emailService = require('./emailService');

/**
 * Sinh và gửi key xác thực mới
 */
async function generateAndSendKey() {
  try {
    await connectDB();
    
    const key = AuthKey.generateSecureKey(32);
    const expiresAt = AuthKey.getNextMidnight();
    
    // Vô hiệu hóa tất cả các key cũ
    await AuthKey.update(
      { isActive: false },
      { where: { isActive: true } }
    );
    
    // Lấy danh sách email từ emailService
    const adminEmails = emailService.getAdminEmails();
    const primaryEmail = adminEmails[0]; // Use the first email as primary for the database
    
    // Tạo key mới trong database
    const authKey = await AuthKey.create({
      username: 'duytien_nhangonsaigon',
      key,
      email: primaryEmail,
      expiresAt,
      failedAttempts: 0,
      isActive: true
    });
    
    // Gửi key qua email đến tất cả các địa chỉ trong adminEmails (riêng lẻ)
    const emailResult = await emailService.sendAuthKey(adminEmails, key, expiresAt);
    
    if (emailResult.success) {
      return { 
        success: true, 
        key, 
        expiresAt, 
        emailResult,
        emailCount: emailResult.recipients.length,
        recipients: emailResult.recipients
      };
    } else {
      return { 
        success: false, 
        error: emailResult.error 
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Nếu chạy file này trực tiếp
if (require.main === module) {
  generateAndSendKey()
    .then(result => {
      if (result.success) {
        console.log(`\n✓ Quá trình tạo key thành công`);
        console.log(`- Key đã được gửi đến ${result.emailCount} địa chỉ email`);
        console.log(`- Danh sách email: ${result.recipients.join(', ')}`);
        console.log(`- Thời gian hết hạn: ${result.expiresAt}`);
        console.log(`\nLưu ý: Mỗi người nhận sẽ chỉ thấy email của riêng họ.`);
      } else {
        console.error('\n✗ Quá trình tạo key thất bại:', result.error);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('Lỗi không mong muốn:', err);
      process.exit(1);
    });
}

module.exports = generateAndSendKey; 