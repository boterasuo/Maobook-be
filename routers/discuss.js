const express = require ("express");
const router = express.Router();
const connection = require("../utils/db");
const { checkLogin } = require("../middlewares/auth");
const path = require("path");
const moment = require("moment");

   
 // 討論文列表
router.get("/dicuss-list", async (req, res, next) => {
    let [data, field] = await connection.execute(
      `
      SELECT 
  	discussion.*,
    COUNT(discussion_like.user_id) AS likes, 
    COUNT(discussion_comments.user_id) AS comments,
    discussion_category.name AS Category
    
    FROM social_discussion AS discussion
    
    JOIN discussion_comments ON discussion_comments.id = discussion_comments.discussion_id
    JOIN discussion_like ON discussion.id = discussion_like.discussion_id
    JOIN discussion_category ON discussion.category_id = discussion_category.id
    
    GROUP BY discussion_comments.discussion_id;
    `
    );
    res.json(data);
  });

  
module.exports = router;