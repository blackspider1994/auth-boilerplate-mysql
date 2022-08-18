const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const User = sequelize.define('users', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			allowNull: false,
			primaryKey: true
		},
		fullName: DataTypes.STRING,
		email: {
			type: DataTypes.STRING,
			allowNull: false
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false
		},
		isVerified: {
			type: DataTypes.BOOLEAN,
			defaultValue:false,
			allowNull: false
		},
		verificationToken: {
			type: DataTypes.STRING,
			allowNull: true
		},
		resetToken: {
			type: DataTypes.STRING,
			allowNull: true
		},
		resetTokenExpiry: {
			type: DataTypes.DATE,
			allowNull:true
		}
		

  	},
	{
		indexes: [
			// Create a unique index on email
			{
				unique: true,
				fields: ['email']
			}],
	});

module.exports = User;