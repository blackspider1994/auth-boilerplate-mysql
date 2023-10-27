const express = require('express');
const router = express.Router();
const AuthController = require('../app/controllers/AuthController');
const WebhooksController = require('../app/controllers/WebhooksController');
const FileController = require('../app/controllers/FileController');
const multer = require('multer');
const upload2 = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: function (req, file ,cb) {
      if (file.mimetype === 'audio/mpeg') {
        cb(null, true);
      } else {
        cb(null, false);
      }
    }
  })
router.get('/ping', (req,res)=>{
    res.status(200).send("Server is accessable !!")
});

router.get('/user', AuthController.getUser);
router.post('/googleplay/webhooks', WebhooksController.googlePlayWebhooks);
router.post('/stripe/webhooks', WebhooksController.stripeWebhooks);
router.post('/testfunction', WebhooksController.testFunction);
router.post('/fileupload/s3', FileController.fileUploadS3);
router.post('/fileupload/gcp',upload2.single("file"), FileController.fileUploadGCP);
router.delete('/fileupload/s3', FileController.deleteFileS3)
router.delete('/fileupload/gcp', FileController.deleteFileGCP);
module.exports = router;