const express = require("express");
const router = express.Router();
const connection = require("../utils/db");
const { checkLogin } = require("../middlewares/auth");

// /api/member
// checkLogin 中間件會對 member 這個 router 有效
router.use(checkLogin);

router.get("/", (req, res, next) => {
    console.log("member API ", req.session.member);
    res.json(req.session.member);
});

router.get("/info", async (req, res, next) => {
    let [userInfo] = await connection.execute("SELECT * FROM users WHERE id=?", [req.session.member.id]);
    console.log("會員詳細資料", userInfo);
    userInfo = userInfo[0];
    let returnUserInfo = {
        id: userInfo.id,
        name: userInfo.name,
        image: userInfo.image,
        email: userInfo.email,
        gender: userInfo.gender,
        mobile: userInfo.mobile,
        birthday: userInfo.birthday,
        address: userInfo.living_address,
    };
    console.log("returnUserInfo: ", returnUserInfo);
    res.json({
        data: returnUserInfo,
    })
});

module.exports = router;