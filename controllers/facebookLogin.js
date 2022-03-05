const express = require("express");
const router = express.Router();
const connection = require("../utils/db");
// const passport = require("../config/passport")
const passport = require("passport")

// router.get("/", passport.authenticate("facebook", {
//     failureRedirect: "/auth/facebook/fail",
//     scope: ["email"] 
// }));

// router.get("/callback",
//     passport.authenticate("facebook", { 
//         successRedirect: "/auth/facebook/success",
//         failureRedirect: "/auth/facebook/fail",
//         scope: ["email"] 
//     }),
//     (req, res) => {
//         res.setHeader("Access-Control-Allow-Origin", "https://localhost:3000")
//     }
// );

// router.get("/fail", (req, res, next) => {
//     res.json({msg: "FB 登入失敗"})
// })

// router.get("/success", (req, res, next) => {
//     console.log("success", req.user, req.sessionID);
//     res.json({data: req.user});
// })

module.exports.facebook = (req, res, next) => {
  passport.authenticate('facebook-token', function(error, user, info) {
    // do stuff with user
    // if (req.sessionID && user) {
      console.log("user", user);
        let returnMember = {id: user.id}
        res.json(returnMember);
    // }
  })(req, res, next);
}

// router.post('/:access_token',
//   passport.authenticate('facebook-token'),
//   function (req, res) {
//     // do something with req.user
//     console.log("FB req.user", req.user);
//     res.send(req.user? 200 : 401);
//   }
// );

// module.exports = router