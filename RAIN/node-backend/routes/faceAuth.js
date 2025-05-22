var express = require("express");
var router = express.Router();
var faceAuthController = require("../controllers/faceAuthController");

router.post("/request", faceAuthController.startSession);

router.post("/verify", faceAuthController.verifyFace);

module.exports = router;
