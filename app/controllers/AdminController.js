const crypto = require('crypto');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
// const nodemailer = require("nodemailer");
const validator = require('validator');

const sendMail = require('../../helpers/nodeMailer')

exports.createUser = (req, res, next) => {
	const { User } = req.db.models;
	const createdBy = req?.auth?.data?.userId;	
	const {email,role}=req.body;
	const adminUserPassword=email.split("@")[0];
	User.findOne({
		where: {
			id: createdBy
		}
	}).then(user => {
		if (user) {
			return bcrypt
				.hash(adminUserPassword, 12)
				.then(async hashedPassword => {
					const token = await jwt.sign({
						data: { email: req.body.email }
					}, process.env.JWT_VERIFY_TOKEN, { expiresIn: `${process.env.VERIFY_TOKEN_EXPIRY}` });

					const user = new User({
						fullName: req.body.fullName,
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
							html: `<b>Verify email at <a href=${process.env.VERIFY_URL}/verify?verificationToken=${result.verificationToken}>Click Here to verify Email</a></b>`, // html body
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
