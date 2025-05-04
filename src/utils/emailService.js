const nodemailer = require('nodemailer');

// Array of admin email recipients
const ADMIN_EMAILS = [
  'tienduypham.nm@gmail.com',
  'hongthai2007.hongthai2007@gmail.com',
  'marketingemail.test1@gmail.com'
];

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Send authentication key via email
   * @param {string|array} email - Recipient email or array of emails
   * @param {string} key - Authentication key
   * @param {string} expiresAt - Expiration time
   * @returns {Promise} - Promise representing the send operation
   */
  async sendAuthKey(email, key, expiresAt) {
    // Use the email provided or fallback to the admin emails array
    const recipients = email ? 
      (Array.isArray(email) ? email : [email]) : 
      ADMIN_EMAILS;
    
    const expirationDate = new Date(expiresAt);
    const baseOptions = {
      from: `"Nhà Ngon Sài Gòn" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      subject: 'Mã đăng nhập mới cho Nhà Ngon Sài Gòn Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Nhà Ngon Sài Gòn - Mã Đăng Nhập</h2>
          <p>Xin chào,</p>
          <p>Đây là mã đăng nhập mới của bạn để truy cập vào hệ thống quản trị Nhà Ngon Sài Gòn:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center;">
            <p style="font-size: 18px; font-weight: bold; letter-spacing: 2px; font-family: monospace;">${key}</p>
          </div>
          
          <p>Thông tin đăng nhập:</p>
          <ul>
            <li><strong>Tên đăng nhập:</strong> duytien_nhangonsaigon</li>
            <li><strong>Mật khẩu:</strong> Mã đăng nhập ở trên</li>
            <li><strong>Thời hạn sử dụng:</strong> ${expirationDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</li>
          </ul>
          
          <p>Mã này sẽ hết hạn vào lúc 0h00 (Giờ Việt Nam). Sau thời điểm đó, một mã mới sẽ được gửi tự động.</p>
          
          <p>Nếu bạn không yêu cầu mã này, vui lòng liên hệ ngay với quản trị viên.</p>
          
          <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
            Email này được gửi tự động. Vui lòng không trả lời.
          </p>
        </div>
      `
    };

    try {
      // Send emails individually to each recipient
      const emailPromises = recipients.map(recipient => {
        const emailOptions = {
          ...baseOptions,
          to: recipient // Send to only one recipient at a time
        };
        return this.transporter.sendMail(emailOptions);
      });
      
      // Wait for all emails to be sent
      const results = await Promise.all(emailPromises);
      
      return { 
        success: true, 
        messageIds: results.map(info => info.messageId),
        recipients 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send test email to verify configuration
   * @returns {Promise} - Promise representing the send operation
   */
  async sendTestEmail() {
    const recipients = this.getAdminEmails();
    const now = new Date();
    
    try {
      // Send test email to each recipient individually
      const emailPromises = recipients.map(recipient => {
        const options = {
          from: `"Nhà Ngon Sài Gòn" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
          to: recipient, // Send to only one recipient at a time
          subject: 'Kiểm tra gửi email từ Nhà Ngon Sài Gòn',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
              <h2 style="color: #333; text-align: center;">Nhà Ngon Sài Gòn - Kiểm Tra Email</h2>
              <p>Xin chào,</p>
              <p>Đây là email kiểm tra từ hệ thống quản trị Nhà Ngon Sài Gòn.</p>
              <p>Nếu bạn nhận được email này, có nghĩa là cấu hình email của hệ thống đang hoạt động bình thường.</p>
              <p>Thời gian kiểm tra: ${now.toLocaleString('vi-VN')}</p>
              <p>Email gửi từ: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}</p>
              <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                Email này được gửi tự động từ hệ thống. Vui lòng không trả lời.
              </p>
            </div>
          `
        };
        
        return this.transporter.sendMail(options);
      });
      
      // Wait for all emails to be sent
      const results = await Promise.all(emailPromises);
      
      return {
        success: true,
        messageIds: results.map(info => info.messageId),
        responses: results.map(info => info.response),
        recipients
      };
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

  /**
   * Get the array of admin email recipients
   * @returns {Array} - Array of email addresses
   */
  getAdminEmails() {
    return ADMIN_EMAILS;
  }
}

module.exports = new EmailService(); 