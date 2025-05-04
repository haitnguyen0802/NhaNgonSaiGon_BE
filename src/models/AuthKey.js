const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const AuthKey = sequelize.define('AuthKey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'duytien_nhangonsaigon'
  },
  key: {
    type: DataTypes.STRING(32),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: process.env.ADMIN_EMAIL || 'admin@nhangonsaigon.com.vn'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  failedAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'auth_keys',
  timestamps: true
});

// Static method to generate a new key
AuthKey.generateKey = function() {
  return crypto.randomBytes(16).toString('hex');
};

// Static method to generate a secure key with letters, numbers, and special characters
AuthKey.generateSecureKey = function(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
};

// Set expiration to next midnight Vietnam time (UTC+7)
AuthKey.getNextMidnight = function() {
  const now = new Date();
  // Setting to Vietnam timezone (UTC+7)
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  
  // Get tomorrow's date in Vietnam time
  const tomorrow = new Date(vietnamTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  // Convert back to UTC for storage
  const tomorrowUTC = new Date(tomorrow.getTime() - (7 * 60 * 60 * 1000));
  return tomorrowUTC;
};

module.exports = AuthKey; 