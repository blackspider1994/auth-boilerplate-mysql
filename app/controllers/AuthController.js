const crypto = require('crypto');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
// const nodemailer = require("nodemailer");
const validator = require('validator');
const User = require('../models/User');
const Session = require('../models/Session');
const sendMail = require('../../helpers/nodeMailer')
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

							return res.status(200).send({ status: true, message: 'Login successfull.', token, refreshToken });
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

exports.signUp = (req, res, next) => {
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
					let emailResponse = await sendMail(
						{
							from: '"Fred Foo 👻" <foo@example.com>', // sender address
							to: req.body.email, // list of receivers
							subject: "Verify Email", // Subject line
							text: "reset email", // plain text body
							html: `<b>Verify email at <a href=${process.env.VERIFY_URL}/api/verify?verificationToken=${result.verificationToken}>Click Here to verify Email</a></b>`, // html body
						}

					)
					return res.status(200).send({ status: true, message: "User created succcessfully.", testURI: emailResponse.testURI });

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
		User.findOne({
			where: {
				email: decoded.data.email
			}
		}).then(async user => {
			if (user && user.verificationToken === verificationToken) {
				let result = await user.update({ isVerified: true, verificationToken: null })
				if (result) {
					res.redirect(process.env.VERIFY_RETURN_URL_SUCCESS)

				} else {
					res.redirect(process.env.VERIFY_RETURN_URL_FAIL)

				}

			} else {
				res.redirect(process.env.VERIFY_RETURN_URL_FAIL)

				// res.status(200).send({ message:"Invalid token",status:false })

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

exports.forgotPassword = async (req, res, next) => {
	const validationErrors = [];
	console.log("email",req.body.email )
	try {
		if (!validator.isEmail(req?.body?.email)) validationErrors.push('Please enter a valid email address.');

		if (validationErrors.length) {
			return res.status(400).send({ status: false, message: "Please enter a valid email address" });
		}

		User.findOne({
			where: {
				email: req?.body?.email
			}
		}).then(async user => {
			if (user) {

				const token = await jwt.sign({
					data: { email: req.body.email }
				}, process.env.JWT_RESET_TOKEN, { expiresIn: `${process.env.VERIFY_TOKEN_EXPIRY}` });

				user.resetToken = token;
				user.resetTokenExpiry = Date.now() + 3600000;
				const userSave = await user.save();
				if (!userSave) {
					return res.status(500).send({ status: false, message: "Something went wrong" });

				}
				let emailResponse = await sendMail(
					{
						from: '"Fred Foo 👻" <foo@example.com>', // sender address
						to: req.body.email, // list of receivers
						subject: "Reset password Email", // Subject line
						text: "reset email", // plain text body
						html: `<b>Verify email at <a href=${process.env.VERIFY_URL}/api/reset-password?verificationToken=${token}>Click Here to reset Password</a></b>`, // html body
					}

				);
				res.status(200).send({ message: "A link has been sent to your registered email. ", status: !!user, testURI: emailResponse.testURI })

			}else{
				res.status(200).send({ message: "A link has been sent to your registered email. ", status: !!user })

			}
		}).catch(err => {
			console.log(err)
		});;

	}
	catch (err) {
		console.log(err)
		return res.status(500).send({ status: false, message: "Something went wrong", err });

	}

};

exports.resetPassword = async (req, res, next) => {
	try {
		const { verificationToken,password } = req.body;
		var decoded = await jwt.verify(verificationToken, process.env.JWT_RESET_TOKEN);
		User.findOne({
			where: {
				email: decoded.data.email
			}
		}).then(async user => {
			if (user && user.resetToken === verificationToken) {
					return bcrypt
				.hash(password, 12)
				.then(async hashedPassword => {
			
				let result = await user.update({ password: hashedPassword, resetToken: null,resetTokenExpiry:null })
				if (result) {
					res.status(200).send({ message:"Password updated",status:true })


				} else {
					res.status(200).send({ message:"Err updating password try again",status:false })

				}
		
			})
			} else {
				// res.redirect(process.env.VERIFY_RETURN_URL_FAIL)

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