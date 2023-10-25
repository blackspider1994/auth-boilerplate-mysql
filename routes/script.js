const express = require('express');
const router = express.Router();
const AuthController = require('../app/controllers/AuthController');
const WebhooksController = require('../app/controllers/WebhooksController');
const ScriptController = require('../app/controllers/ScriptController');
router.get('/ping', (req,res)=>{
    res.status(200).send("Server is accessable !!")
});

router.get('/bizbscript', ScriptController.bizbScript);
module.exports = router;