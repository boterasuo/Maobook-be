const express = require("express");
const router = express.Router();
const connection = require("../utils/db")

const fbController = require("../controllers/facebookLogin.js");

router.get("/auth/facebook", fbController.facebook);
router.post("/facebook/login", async (req, res, next) => {
    console.log("req.body", req.body);
    let [getFBuser] = await connection.execute(
        "SELECT * FROM users WHERE id=?", [req.body.userId]
    );
    if (getFBuser.length > 0) {
        getFBuser = getFBuser[0];
        let returnMember = {
            id: getFBuser.id,
            name: getFBuser.name,
            email: getFBuser.email,
            image: getFBuser.image,
          }
          // 如果比對成功 --> 記錄在 session
          // 寫 session
          req.session.member = returnMember
        
          res.json({
            data: returnMember,
          })
    }
})

module.exports = router