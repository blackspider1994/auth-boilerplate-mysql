const env = require('dotenv');
env.config();




module.exports = {
  "development": {
    host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_DATABASE, username: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, dialect: "mysql"
  },
  "test": {
    host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_DATABASE, username: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, dialect: "mysql"
  },
  "production": {
    host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_DATABASE, username: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, dialect: "mysql"
  }
};