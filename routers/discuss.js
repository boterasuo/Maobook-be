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
  LEFT JOIN discussion_comment ON discuss.id
  GROUP BY discuss.id
  ) AS combiner

   LEFT JOIN discussion_like ON combiner.id = discussion_like.discussion_id
   GROUP BY combiner.id
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

// 新增貼文
router.post("/Add", async (req, res, next) => {
  let [data, field] = await connection.execute(
    `INSERT INTO social_diary(id, user_id, category_id, tittle, content, created_at) VALUES ('${req.body.id}','${req.session.member.id},'${req.body.categoryID}','${req.body.tittle}','${ req.body.content},'${req.body.content},NOW(),'${Tags})`);
  res.json(data);
});


// 分頁功能
router.get("/discuss-pages", async (req, res, next) => {
    // 取目前在第幾頁
    // 如果網址後面沒有設定 req.query.page 那就設成1
    let page = req.query.page || 1;
    console.log("取得討論頁數", page);

    // 取得目前的總筆數
    let [total] = await connection.execute(
      `
      SELECT COUNT(*) AS total FROM social_discussion
      `
      );
    console.log("討論total",total);//[{total:15}]
    total = total[0].total;//total= 15
    
    //  計算總共有幾頁
    const perPage = 5;
    // latpage: 總共有幾頁
    const lastPage = Math.ceil(total / perPage);

    // 計算SQL要的offset(位移)
    let offset = (page - 1) * perPage;
    // 取得資料
    let [data] = await connection.execute(
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
  LEFT JOIN discussion_comment ON discuss.id
  GROUP BY discuss.id
  ) AS combiner

   LEFT JOIN discussion_like ON combiner.id = discussion_like.discussion_id
   GROUP BY combiner.id
  ) AS secondCombine
  
  LEFT JOIN discussion_category ON discussion_category.id = secondCombine.category_id
  LEFT JOIN users ON users.id = secondCombine.user_id
  ORDER BY created_at LIMIT ? OFFSET ?
  `,[perPage,offset]
    );
    
    //  準備要response
    res.json({
      pagination: { total, perPage, page, lastPage}, 
      data,
    });
});



module.exports = router;
