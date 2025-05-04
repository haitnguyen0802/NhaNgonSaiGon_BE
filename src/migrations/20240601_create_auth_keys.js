const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auth_keys', {
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Add index to improve query performance
    await queryInterface.addIndex('auth_keys', ['username', 'isActive']);
    await queryInterface.addIndex('auth_keys', ['email']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('auth_keys');
  }
}; 