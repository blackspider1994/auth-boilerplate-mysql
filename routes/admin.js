const express = require('express');
const router = express.Router();
const AdminController = require('../app/controllers/AdminController');

router.post('/', AdminController.createUser);


module.exports = router;