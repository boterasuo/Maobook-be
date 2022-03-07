const express = require("express");
const router = express.Router();
const connection = require("../utils/db")

const tpLoginController = require("../controllers/thirdPartyLogin.js");

router.get("/auth/facebook", tpLoginController.facebook);
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
});

router.get("/auth/google", tpLoginController.google);
router.post("/google/login", async (req, res, next) => {
  console.log("req.body", req.body);
  let [getGoogleuser] = await connection.execute(
      "SELECT * FROM users WHERE id=?", [req.body.userId]
  );
  if (getGoogleuser.length > 0) {
    getGoogleuser = getGoogleuser[0];
      let returnMember = {
          id: getGoogleuser.id,
          name: getGoogleuser.name,
          email: getGoogleuser.email,
          image: getGoogleuser.image,
        }
        // 如果比對成功 --> 記錄在 session
        // 寫 session
        req.session.member = returnMember
      
        res.json({
          data: returnMember,
        })
  }
});


module.exports = router