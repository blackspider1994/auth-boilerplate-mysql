const path = require('path');
// load dependencies
const env = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
var { expressjwt: jwt } = require("express-jwt");
//const ngrok = require('ngrok');
const app = express();

//Loading Routes
const webRoutes = require('./routes/web');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
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
	}).unless({ path: ["/api/auth/sign-up", "/api/auth/login", "/api/auth/reset-password", "/api/auth/forget-password", "/api/auth/verify", "/api/test","/api/ping","/api/googleplay/webhooks"] })
	);
app.use((req, res, next) => {
	req.db = sequelize;
	next();
})
app.use('/api', webRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/admin', adminRoutes);

sequelize
	// .sync({ force: true })
	//.sync({ alter: true  })
	.sync()
	.then(async() => {
		app.listen(process.env.PORT);

		//pending set timezone
		console.log("App listening on port " + process.env.PORT);
		// await ngrok.connect(process.env.PORT, function (err, url) {
		// 	console.log(`Node.js local server is publicly-accessible at ${url}`);
		// }); 
	}) 
	.catch(err => {
		console.log(err);
	});
