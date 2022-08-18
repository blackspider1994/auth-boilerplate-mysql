const {  Model } = require('sequelize');
module.exports = function(sequelize,DataTypes){
class Session extends Model {}

const SessionModal= Session.init({
	sid: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	SessionId: DataTypes.STRING,
	expires: DataTypes.DATE,
	data: DataTypes.TEXT,
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  modelName: 'Session' // We need to choose the model name
});

// the defined model is the class itself
console.log("Session Modal created ",Session === sequelize.models.Session); // true
return SessionModal;
}