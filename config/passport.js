require('dotenv').config()
const FacebookTokenStrategy = require('passport-facebook-token');
const GoogleOauthTokenStrategy = require('passport-google-oauth-token')
const connection = require("../utils/db");
const moment = require('moment');
const Fs = require("fs");
const path = require("path");
const axios = require("axios");
const { reject } = require('bcrypt/promises');

module.exports = function (passport) {

  passport.use(new FacebookTokenStrategy({
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      fbGraphVersion: 'v3.0'
    }, 
    async function(accessToken, refreshToken, profile, done) {
      console.log("profile", profile);
      console.log("accessToken", accessToken);
      // User.findOrCreate({facebookId: profile.id}, function (error, user) {
      //   return done(error, user);
      // });
      let user = {};
      const filename = `FB-${Date.now()}.jpg`;
      const urlPath = path.join(__dirname, "..", "public", "uploads", filename);

      async function downloadImage (success, fail) {
        const url = `https://graph.facebook.com/${profile.id}/picture?width=200&height=200&access_token=${accessToken}`
        // axios download
        let response = await axios({
          method: "GET",
          url: url,
          responseType: "stream",
        })
        // pipe the result stream into a file on disc
        const writer = Fs.createWriteStream(urlPath);
        response.data.pipe(writer);
        // return a promise and resolve when download finishes
        return new Promise((resolve, rject) => {
          writer.on("finish", () => {
            console.log("download success!")
            resolve(success);
          })
          writer.on("error", () => {
            console.log("download fail!")
            reject(fail);
          })
        })
      }

      
      
      let savedfilename = "/static/uploads/" + filename;
      let [findUser] = await connection.execute("SELECT * FROM users WHERE fb_id = ?", [profile.id]);
      // console.log("findUser", findUser);
      if (!findUser.length) {
        // 若資料庫內無資料 --> 初次FB登入 --> 寫入資料庫
        console.log("first login by FB!");
        // 先處理圖片下載 + 儲存
        async function Main() {
          const data = await downloadImage();
          console.log("DATA", data);
        }
        await Main();
        let signUpTime = moment().format('YYYY-MM-DD kk:mm:ss');
        let [createFBuser] = await connection.execute(
          "INSERT INTO users (name, email, password, image, fb_id, token, valid, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
            profile.displayName, 
            profile.emails[0].value,
            "fbPassword", 
            savedfilename, 
            profile.id,
            accessToken, 
            1, 
            signUpTime]);
        user = {...user, 'id':createFBuser.insertId};
                  
      } else {
        console.log("NOT first login by FB!")
        let [updateFBuser] = await connection.execute(
          "UPDATE users SET name=? WHERE fb_id=?", [
            profile.displayName, 
            profile.id,
          ]
          );
        let [searchFBuser] = await connection.execute(
          "SELECT id FROM users WHERE fb_id=?", [profile.id]
        )
        user = {...user, "id": searchFBuser[0].id,}
      }
      return done(null, user);
    }
  ))

  passport.use(new GoogleOauthTokenStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },async (accessToken, refreshToken, profile, done) => {
    console.log("profile", profile);
    let user = {};
    // 增加圖片解析度
    let filename = profile.photos[0].value.replace("=s96-c", "=s500-c");
    let [findUser] = await connection.execute("SELECT * FROM users WHERE google_id=?", [profile.id]);
    if (!findUser.length) {
      // 若資料庫內無資料 --> 初次google登入 --> 寫入資料庫
      console.log("first login by Google!")
      let signUpTime = moment().format('YYYY-MM-DD kk:mm:ss');
      let [createGoogleuser] = await connection.execute(
        "INSERT INTO users (name, email, password, image, google_id, token, valid, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
          profile.displayName, 
          profile.emails[0].value, 
          "googlePassword",
          filename, 
          profile.id,
          accessToken, 
          1, 
          signUpTime]);
      user = {...user, "id": createGoogleuser.insertId}
    } else {
      console.log("NOT first login by Google!")
        let [updateGoogleuser] = await connection.execute(
          "UPDATE users SET name=?, image=? WHERE google_id=?", [
            profile.displayName,
            filename, 
            profile.id,
          ]
          );
        let [searchGoogleuser] = await connection.execute(
          "SELECT id FROM users WHERE google_id=?", [profile.id]
        )
        user = {...user, "id": searchGoogleuser[0].id,}
    }
    return done(null, user);
  }))

}

