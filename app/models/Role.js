const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Role = sequelize.define('roles', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			allowNull: false,
			primaryKey: true
		},
		name: DataTypes.STRING,
		
		policy: {
			type: DataTypes.JSON,
			allowNull:true
		}
		

  	},
	{
		indexes: [
			// Create a unique index on email
			// {
			// 	unique: true,
			// 	fields: ['email']
			// }
		],
	});

module.exports = Role;