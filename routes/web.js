const express = require('express');
const router = express.Router();
const HomeController = require('../app/controllers/HomeController');
const AuthController = require('../app/controllers/AuthController');

router.get('/ping', (req,res)=>{
    res.status(200).send("Server is accessable !!")
});
router.get('/', HomeController.homePage);
// router.get('/login', AuthController.loginPage);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/verify', AuthController.accountVerify);
// router.get('/sign-up', AuthController.signUpPage);
router.post('/sign-up', AuthController.signUp);
// router.get('/forgot-password', AuthController.forgotPasswordPage);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);


module.exports = router;