const express = require("express");
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

// 四張cards
router.get("/card", async (req, res, next) => {
  let [data, field] = await connection.execute(
    `
    SELECT 
    social_diary.id, social_diary.image, social_diary.tittle, social_diary.content,social_diary.created_at,
    users.name as poster, users.image AS avatar,
    GROUP_CONCAT(tag_name.name SEPARATOR ',') as tags
    FROM social_diary
    LEFT JOIN users ON social_diary.user_id = users.id
    LEFT JOIN diary_tags ON diary_tags.diary_id = social_diary.id
    LEFT JOIN tag_name ON diary_tags.tag_id = tag_name.id
    GROUP BY diary_id
    LIMIT 4
    `
  );
  res.json(data);
});


// 全部資料
router.get("/card-list", async (req, res, next) => {
  let [data, field] = await connection.execute(
    `
    SELECT 
    Card.id, Card.image, Card.title, Card.content,Card.created_at,
    users.name as poster, users.image AS avatar,
   Card.likes, Card.comments,
   GROUP_CONCAT(tag_name.name SEPARATOR ',') as tags

FROM
(
SELECT 
  	C.*,
    COUNT(diary_like.user_id) AS likes

 FROM
 (
    SELECT 
    diary.*,
    COUNT(diary_comments.user_id) AS comments
    FROM social_diary AS diary
    JOIN diary_comments ON diary.id = diary_comments.diary_id
    GROUP BY diary_comments.diary_id
 ) AS C
    JOIN diary_like ON C.id = diary_like.diary_id
    GROUP BY diary_like.diary_id
) Card

  LEFT JOIN users ON Card.user_id = users.id
  LEFT JOIN diary_tags ON diary_tags.diary_id = Card.id
  LEFT JOIN tag_name ON diary_tags.tag_id = tag_name.id
  GROUP BY diary_tags.diary_id
  `
  );
  res.json(data);
});

// 對應的按讚列表 (貼文 x 按讚內容) 
router.get("/like-list/:likeDiaryID", async (req, res) => {
  let [data, fields] = await connection.execute(
`
SELECT users.name, GROUP
FROM diary_like AS likes
JOIN users on likes.user_id = users.id 
WHERE likes.diary_id = ?`,[req.params.likeDiaryID]);
  res.json(data);
});

// 對應的留言列表 (貼文 x 留言內容) 
  router.get("/comment-list/:commentDiaryID", async (req, res) => {
    let [data, fields] = await connection.execute(
  ` SELECT comments.id, comments.diary_id, users.name, comments.comment, comments.created_at
  FROM diary_comments AS comments
  JOIN users on comments.user_id = users.id 
  WHERE comments.diary_id = ?`,[req.params.commentDiaryID]);
    res.json(data);
  });


// TODO: 新增貼文 ->檢查標籤/分類是否已存在
router.post("/add", async (req, res, next) => {
  let [data, field] = await connection.execute(
    "SELECT * FROM diary_like JOIN social_dairy ON diary_like.diary_id = social_diary.id"
  );
  // console.log("returnUserInfo: ", returnUserInfo);
  res.json(data);
});

//TODO: 修改貼文內容
router.put("/Edit", async (req, res) => {
  let [data, fields] = await connection.execute(
    `UPDATE case_give SET title=?, date=?, price=?, region=?, content=?, category=?, tags=?, img=? WHERE id = ${req.params.id}`, [req.params.title,req.params.date, req.params.price, req.params.region, req.params.content, req.params.category, req.params.tags, req.params.img]);
  res.json(data);
});

//TODO: 刪除貼文內容

module.exports = router;
