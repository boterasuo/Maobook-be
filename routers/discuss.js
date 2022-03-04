const express = require("express");
const router = express.Router();
const connection = require("../utils/db");
const { checkLogin } = require("../middlewares/auth");
const path = require("path");
const moment = require("moment");

// 討論文列表
router.get("/bar-list", async (req, res, next) => {
  let [data, field] = await connection.execute(
    `
      SELECT 
      secondCombine.*, 
      Month(secondCombine.created_at) AS month,
      Day(secondCombine.created_at) AS date,
      users.image AS avatar,
      users.name As poster,
      discussion_category.name AS category
      FROM
    (
    SELECT 
      combiner.*,
    COUNT(discussion_like.user_id) AS likes
      FROM
    (
    SELECT 
    discuss.*,
    COUNT(discussion_comment.user_id) AS discussion
    FROM social_discussion AS discuss
    JOIN discussion_comment ON discussion_comment.discussion_id = discuss.id
    GROUP BY discussion_comment.discussion_id
    ) AS combiner
 
     LEFT JOIN discussion_like ON discussion_like.discussion_id = combiner.id
     GROUP BY discussion_like.discussion_id
    ) AS secondCombine
    
    LEFT JOIN discussion_category ON discussion_category.id = secondCombine.category_id
    LEFT JOIN users ON users.id = secondCombine.user_id
       
    `
  );
  res.json(data);
});

// 對應的按讚列表 (貼文 x 按讚內容)
router.get("/like-list/:likediscussionID", async (req, res) => {
  let [data, fields] = await connection.execute(
    `
SELECT users.name, GROUP
FROM discussion_like AS likes
JOIN users on likes.user_id = users.id 
WHERE likes.discussion_id = ?`,
    [req.params.likediscussionID]
  );
  res.json(data);
});

// 對應的留言列表 (貼文 x 留言內容)
router.get("/comment-list/:barId", async (req, res) => {
  let [data, fields] = await connection.execute(
    ` SELECT discussion.id, discussion.discussion_id, users.name, users.image AS avatar, discussion.comment, discussion.created_at
  FROM discussion_comment AS discussion
  JOIN users on discussion.user_id = users.id
  WHERE discussion.discussion_id = ?`,
    [req.params.barId]
  );
  res.json(data);
});

// 送出貼文留言API
router.post("/AddComment", async (req, res, next) => {
  //  req.session.member.id取得登入會員id
  let [data, fields] = await connection.execute(
    `INSERT INTO discussion_comment (id, discussion_id, user_id, comment, created_at	) VALUES ('${req.body.id}','${req.body.barID}','${req.session.member.id}','${req.body.comment}',NOW())`
 );
  res.json(data);
});



module.exports = router;
