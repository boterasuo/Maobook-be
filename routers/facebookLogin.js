const express = require("express");
const router = express.Router();

const fbController = require("../controllers/facebookLogin.js");

router.get("/auth/facebook", fbController.facebook);

module.exports = router