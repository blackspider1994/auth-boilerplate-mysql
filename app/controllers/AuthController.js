const crypto = require('crypto');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const validator = require('validator');
const User = require('../models/User');
const Session = require('../models/Session');
// const transporter=require('../../helpers/nodeMailer')
const message = (req) => {
	let message = req.flash('error');
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}

	return message;
}

const oldInput = (req) => {
	let oldInput = req.flash('oldInput');
	if (oldInput.length > 0) {
		oldInput = oldInput[0];
	} else {
		oldInput = null;
	}

	return oldInput;
}

exports.loginPage = (req, res, next) => {
	if (res.locals.isAuthenticated) {
		res.redirect('/');
	} else {
		res.render('login', { layout: 'login_layout', loginPage: true, pageTitle: 'Login', errorMessage: message(req), oldInput: oldInput(req) });
	}
};

exports.login = (req, res, next) => {
	try {
		const validationErrors = [];
		if (!validator.isEmail(req.body.email)) validationErrors.push('Please enter a valid email address.');
		if (validator.isEmpty(req.body.password)) validationErrors.push('Password cannot be blank.');
		if (validationErrors.length) {
			return res.status(400).send({ status: false, message: "Email and Password is required." });
		}
		User.findOne({
			where: {
				email: req.body.email
			}
		}).then(user => {
			if (user) {
				bcrypt
					.compare(req.body.password, user.password)
					.then(async doMatch => {
						if (doMatch) {
							// req.session.isLoggedIn = true;
							// req.session.user = .dataValues;
							// return req.session.save(err => {
							// 	console.log(err);
							// 	res.redirect('/');
							// });
							if (!user.dataValues.isVerified) {
								return res.status(200).send({ status: false, message: 'Email veification is required, verify your email and try again.' });

							}
							const token = await jwt.sign({
								data: { userId: user.dataValues.id }
							}, process.env.JWT_TOKEN_KEY, { expiresIn: '1h' });

							const refreshToken = await jwt.sign({
								data: { userId: user.dataValues.id }
							}, process.env.JWT_REFRESH_TOKEN_KEY, { expiresIn: '7d' });

							return res.status(200).send({ status: true, message: 'Login successfull.',  token, refreshToken });
						}
						else {
							return res.status(200).send({ status: false, message: 'Email or Password is incorrect.' });

						}

					})
					.catch(err => {
						console.log(err);
						return res.status(500).send({ status: false, message: 'Sorry! Somethig went wrong.', err });

					});
			} else {
				return res.status(200).send({ status: false, message: 'No user found with this email' });

			}
		}).catch(err => {
			console.log(err)
			return res.status(500)({ status: false, message: 'Sorry! Somethig went wrong.', err });
		});
	}
	catch (err) {
		return res.status(400).send({ status: false, message: 'Sorry! Somethig went wrong.', err });

	}
};

exports.logout = (req, res, next) => {
	if (res.locals.isAuthenticated) {
		req.session.destroy(err => {
			return res.redirect('/');
		});
	} else {
		return res.redirect('/login');
	}
};

exports.signUpPage = (req, res, next) => {
	res.render('sign_up', { layout: 'login_layout', signUpPage: true, errorMessage: message(req), oldInput: oldInput(req) });
};

exports.signUp = (req, res, next) => {
	console.log(" req.body.email", req.body)
	User.findOne({
		where: {
			email: req.body.email
		}
	}).then(user => {
		if (!user) {
			return bcrypt
				.hash(req.body.password, 12)
				.then(async hashedPassword => {
					const token = await jwt.sign({
						data: { email: req.body.email }
					}, process.env.JWT_VERIFY_TOKEN, { expiresIn: `${process.env.VERIFY_TOKEN_EXPIRY}` });

					const user = new User({
						fullName: req.body.name,
						email: req.body.email,
						password: hashedPassword,
						verificationToken: token
					});
					return user.save();
				})
				.then(async result => {
					let testAccount = await nodemailer.createTestAccount();

					// create reusable transporter object using the default SMTP transport
					let transporter = nodemailer.createTransport({
						host: "smtp.ethereal.email",
						port: 587,
						secure: false, // true for 465, false for other ports
						auth: {
							user: testAccount.user, // generated ethereal user
							pass: testAccount.pass, // generated ethereal password
						},
					});

					// send mail with defined transport object
					let info = await transporter.sendMail({
						from: '"Fred Foo 👻" <foo@example.com>', // sender address
						to: req.body.email, // list of receivers
						subject: "Verify Email", // Subject line
						text: "reset email", // plain text body
						html: `<b>Verify email at <a href=${process.env.VERIFY_URL}/verify?verificationToken=${result.verificationToken}>Click Here to verify Email</a></b>`, // html body
					});

					console.log("Message sent: %s", info.messageId);
					// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

					// Preview only available when sending through an Ethereal account
					console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
					// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
					return res.status(200).send({ status: true, message: "User created succcessfully.",  testURI: nodemailer.getTestMessageUrl(info) });

				});
		} else {

			return res.status(400).send({ status: false, message: "E-Mail exists already, please pick a different one." });
		}
	})
		.catch(err => {
			console.log(err)
			return res.status(400).send({ status: false, message: "Error creating user", err });
		});
};

exports.accountVerify = async (req, res, next) => {
	try {
		const { verificationToken } = req.query;
		var decoded = await jwt.verify(verificationToken, process.env.JWT_VERIFY_TOKEN);
		console.log("decode", decoded);
		User.findOne({
			where: {
				email: decoded.data.email
			}
		}).then(async user => {
			if (user && user.verificationToken === verificationToken) {
				let result = await user.update({ isVerified: true,verificationToken:null })
				if(result){
					res.redirect("https://google.com")

				}else{
					res.redirect("https://google.com")

				}

			}else{
				res.status(200).send({ message:"Invalid token",status:false })

			}
		}).catch(err => {
			console.log(err)
		});

	}
	catch (err) {
		console.log(err)
		return res.status(500).send({ status: false, message: "Something went wrong", err });

	}
};

exports.forgotPasswordPage = (req, res, next) => {
	if (res.locals.isAuthenticated) {
		return res.redirect('/');
	} else {
		return res.render('forgot_password', { layout: 'login_layout', loginPage: true, pageTitle: 'Forgot Password', errorMessage: message(req), oldInput: oldInput(req) });
	}
};

exports.forgotPassword = (req, res, next) => {
	const validationErrors = [];
	if (!validator.isEmail(req.body.email)) validationErrors.push('Please enter a valid email address.');

	if (validationErrors.length) {
		req.flash('error', validationErrors);
		return res.redirect('/forgot-password');
	}
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			console.log(err);
			return res.redirect('/forgot-password');
		}
		const token = buffer.toString('hex');
		User.findOne({
			where: {
				email: req.body.email
			}
		})
			.then(user => {
				if (!user) {
					req.flash('error', 'No user found with that email');
					return res.redirect('/forgot-password');
				}
				user.resetToken = token;
				user.resetTokenExpiry = Date.now() + 3600000;
				return user.save();
			}).then(result => {
				if (result) return res.redirect('/resetlink');
			}).catch(err => { console.log(err) })
	});
};