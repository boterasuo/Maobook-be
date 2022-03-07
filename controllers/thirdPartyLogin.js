const express = require("express");
const router = express.Router();
const connection = require("../utils/db");
// const passport = require("../config/passport")
const passport = require("passport")

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

module.exports.google = (req, res, next) => {
  passport.authenticate('google-oauth-token', function(error, user, info) {
    // do stuff with user
    // if (req.sessionID && user) {
      console.log("user", user);
        let returnMember = {id: user.id}
        res.json(returnMember);
    // }
  })(req, res, next);
}