'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add the status ENUM type and column
      await queryInterface.sequelize.query(`
        CREATE TYPE IF NOT EXISTS enum_collaborators_status AS ENUM ('active', 'inactive');
      `);
      
      await queryInterface.addColumn('collaborators', 'status', {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Migration error:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('collaborators', 'status');
      
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_collaborators_status;
      `);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Migration error:', error);
      return Promise.reject(error);
    }
  }
}; 