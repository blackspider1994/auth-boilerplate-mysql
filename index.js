const path = require('path');
// load dependencies
const env = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
var { expressjwt: jwt } = require("express-jwt");

const app = express();

//Loading Routes
const webRoutes = require('./routes/web');
const { sequelize } = require('./models/index');
const errorController = require('./app/controllers/ErrorController');

env.config();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.use(
	jwt({
		secret: process.env.JWT_TOKEN_KEY,
		algorithms: ["HS256"],
	}).unless({ path: ["/api/sign-up", "/api/login", "/api/reset-password", "/api/forget-password", "/api/verify", "/api/test"] })
);
app.use((req, res, next) => {
	req.db = sequelize;
	next();
})
app.use('/api', webRoutes);

sequelize
	// .sync({ force: true })
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
