const {  Model } = require('sequelize');
module.exports = function(sequelize,DataTypes){
class Role extends Model {}

const RoleModal= Role.init({
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
	
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  modelName: 'Role' // We need to choose the model name
});

// the defined model is the class itself
console.log("Role Modal created ",Role === sequelize.models.Role); // true
return RoleModal;
}