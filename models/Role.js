'use strict';
const {
	Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class Role extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here

			const { User, Role } = models;
			Role.hasMany(User, { foreignKey: 'role_id' });
			User.belongsTo(Role, { foreignKey: 'role_id' });
		}
		
	}
	Role.init({
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			allowNull: false,
			primaryKey: true
		},
		name: DataTypes.STRING,

		policy: {
			type: DataTypes.JSON,
			allowNull: true
		}

	}, {
		sequelize,
		modelName: 'Role',
	});
	return Role;
};