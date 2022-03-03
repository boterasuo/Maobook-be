const express = require("express");
const router = express.Router();

const fbMiddleware = require("../middlewares/facebookLogin.js");

router.get("/auth/facebook", fbMiddleware.facebook);

module.exports = router