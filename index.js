const path = require('path');
// load dependencies
const env = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
var { expressjwt: jwt } = require("express-jwt");

const app = express();

//Loading Routes
const webRoutes = require('./routes/web');
const sequelize = require('./config/database');
const errorController = require('./app/controllers/ErrorController');

env.config();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());


app.use(webRoutes);
app.use(errorController.pageNotFound);
app.use(
	jwt({
	  secret: process.env.JWT_TOKEN_KEY,
	  algorithms: ["HS256"],
	}).unless({ path: ["/sign-up","/login"] })
  );
sequelize
	// .sync({force : true})
	.sync({ alter: true  })
	// .sync()
	.then(() => {
		app.listen(process.env.PORT);
		//pending set timezone
		console.log("App listening on port " + process.env.PORT);
	})
	.catch(err => {
		console.log(err);
	});
