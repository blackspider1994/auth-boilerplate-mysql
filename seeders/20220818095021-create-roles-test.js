'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
     return queryInterface.bulkInsert('Roles', [{
      id: '1',
      name: 'Super Admin',
      policy:'{"test":"123"}',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Admin',      policy:'{"test":"123"}',


      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'User',
      policy:'{"test":"123"}',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     return queryInterface.bulkDelete('Roles', null, {});

  }
};
