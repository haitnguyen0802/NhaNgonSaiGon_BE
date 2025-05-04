const cron = require('node-cron');
const AuthKey = require('../models/AuthKey');
const emailService = require('./emailService');

/**
 * Scheduler service for managing automated tasks
 */
class Scheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Initialize scheduler and start jobs
   */
  init() {
    this.setupDailyKeyGeneration();
    console.log('Scheduler initialized successfully');
  }

  /**
   * Setup daily key generation job at midnight Vietnamese time (UTC+7)
   */
  setupDailyKeyGeneration() {
    // Schedule at 17:00 UTC (00:00 Vietnam time, UTC+7)
    const job = cron.schedule('0 17 * * *', async () => {
      console.log('Running daily key generation job');
      try {
        await this.generateAndSendDailyKey();
        console.log('Daily key generated and sent successfully');
      } catch (error) {
        console.error('Error in daily key generation job:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.jobs.push(job);
  }

  /**
   * Generate and send a new authentication key
   */
  async generateAndSendDailyKey() {
    // Lấy tất cả địa chỉ email quản trị viên
    const adminEmails = emailService.getAdminEmails();
    const primaryEmail = adminEmails[0]; // Sử dụng email đầu tiên làm email chính cho database
    
    // Generate a new key
    const key = AuthKey.generateSecureKey(32);
    const expiresAt = AuthKey.getNextMidnight();
    
    // Deactivate all active keys
    await AuthKey.update(
      { isActive: false },
      { where: { isActive: true } }
    );
    
    // Create a new key in the database
    const authKey = await AuthKey.create({
      username: 'duytien_nhangonsaigon',
      key,
      email: primaryEmail,
      expiresAt,
      failedAttempts: 0,
      isActive: true
    });
    
    // Send the key via email to all admin emails
    const emailResult = await emailService.sendAuthKey(adminEmails, key, expiresAt);
    
    if (!emailResult.success) {
      throw new Error('Failed to send email: ' + emailResult.error);
    }
    
    return { success: true, authKey, emailResult };
  }
}

module.exports = new Scheduler(); 