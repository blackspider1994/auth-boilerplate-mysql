const express = require('express');
const router = express.Router();
const AuthController = require('../app/controllers/AuthController');
const WebhooksController = require('../app/controllers/WebhooksController');
router.get('/ping', (req,res)=>{
    res.status(200).send("Server is accessable !!")
});

router.get('/user', AuthController.getUser);
router.post('/googleplay/webhooks', WebhooksController.googlePlayWebhooks);
router.post('/stripe/webhooks', WebhooksController.stripeWebhooks);
router.post('/testfunction', WebhooksController.testFunction);
module.exports = router;