require('dotenv').config()
const FacebookTokenStrategy = require('passport-facebook-token');
const connection = require("../utils/db");
const moment = require('moment')

// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_CLIENT_ID,
//     clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//     callbackURL: "http://localhost:3002/auth/facebook/callback"
//     },
//     function (accessToken, refreshToken, profile, done) {
//         console.log("profile", profile);
//         return done(null, profile);
//     }
// ));

module.exports = function (passport) {
  passport.serializeUser((user, done) => {
    console.log('Inside serialize User callback')
    done(null, user.id)
  })

  passport.use(new FacebookTokenStrategy({
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      fbGraphVersion: 'v3.0'
    }, 
    async function(accessToken, refreshToken, profile, done) {
      console.log("profile", profile);
      // User.findOrCreate({facebookId: profile.id}, function (error, user) {
      //   return done(error, user);
      // });
      let user = {
        'email': profile.emails[0].value,
        'name' : profile.displayName,
        'image': profile.photos[0].value,
      }
      let [findUser] = await connection.execute("SELECT * FROM users WHERE fb_id = ?", [profile.id]);
      // console.log("findUser", findUser);
      if (!findUser.length) {
        // 若資料庫內無資料 --> 初次FB登入 --> 寫入資料庫
        let signUpTime = moment().format('YYYY-MM-DD kk:mm:ss')
        let [createFBuser] = await connection.execute(
          "INSERT INTO users (name, email, image, fb_id, token, valid, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
            profile.displayName, 
            profile.emails[0].value, 
            profile.photos[0].value, 
            profile.id,
            accessToken, 
            1, 
            signUpTime]);
        user = {...user, 'id':createFBuser.insertId}          
      }
      return done(null, user);
    }
  ))

}
// passport.serializeUser(function (user, cb) {
//     cb(null, user);
// });

// passport.deserializeUser(function (obj, cb) {
//     cb(null, obj);
// });

// module.exports = passport;
