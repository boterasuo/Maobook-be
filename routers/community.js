const express = require ("express");
const router = express.Router();
const connection = require("../utils/db");
const { checkLogin } = require("../middlewares/auth");
const path = require("path");
const moment = require("moment");

// 卡片細節頁：slider
// router.post("/card-detail", async (req, res) => {
//   let [data, fields] = await connection.execute(
//     //抓出所有卡片內容 再JOIN users抓使用者頭像
//         `SELECT social_dairy.*, users.image FROM social_dairy JOIN users ON social_dairy.user_id = users.id ORDER BY created_at DESC;`);
//       res.json(data);
//     });


    // 四張卡片
    // /api/cards
router.get("/daily/card", async (req, res, next) => {
  let [data, field] = await connection.execute("SELECT * FROM social_dairy LEFT JOIN users ON social_dairy.user_id = users.id LIMIT 4");
  // console.log("returnUserInfo: ", returnUserInfo);
  // LEFT　JOIN users ON social_dairy.user_id = users.id 
  res.json(data)
});

// 全部資料
router.get("/daily/card-list", async (req, res, next) => {
  let [data, field] = await connection.execute("SELECT * FROM social_dairy ORDER BY created_at DESC");
  // console.log("returnUserInfo: ", returnUserInfo);
  res.json(data)
});

// 日常按讚
router.get("/daily/likes", async (req, res, next) => {
  let [data, field] = await connection.execute("SELECT * FROM diary_like JOIN social_dairy ON diary_like.diary_id = social_diary.id");
  // console.log("returnUserInfo: ", returnUserInfo);
  res.json(data)
});





// /api/daily-post/add
const multer = require("multer");
// 圖片存的位置
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, "..","public", "daily-img"));
    },
    filename: function(req, file, cb) {
        console.log("multer-filename", file);
        const ext = file.originalname.split(".").pop();
        // TODO: 有時間的話檔名改用 uuid
        cb(null, `member-${Date.now()}.${ext}`);
    },
});


module.exports = router;
