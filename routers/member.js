const express = require("express");
const router = express.Router();
const { checkLogin } = require("../middlewares/auth");

// /api/member
// checkLogin 中間件會對 member 這個 router 有效
router.use(checkLogin);

router.get("/", (req, res, next) => {
    res.json(req.session.member);
});

module.exports = router;