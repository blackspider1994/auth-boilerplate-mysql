module.exports = function(sequelize,DataTypes){
const {User,Role}=sequelize.models;

Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });


}