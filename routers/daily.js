const express = require("express");
const router = express.Router();
const connection = require("../utils/db");
const { checkLogin } = require("../middlewares/auth");
const path = require("path");
const moment = require("moment");

// 日常文 - 卡片列表
router.get("/card-list", async (req, res, next) => {
  let [data, field] = await connection.execute(
    `
    SELECT 
    Card.id, Card.image, Card.tittle, Card.content,Card.created_at,
    users.name as poster, users.image AS avatar,
   Card.likes, Card.comments, Card.tags
  
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
    LEFT JOIN diary_comments ON diary.id = diary_comments.diary_id
    GROUP BY diary.id
 ) AS C
 LEFT JOIN diary_like ON C.id = diary_like.diary_id
    GROUP BY C.id
) Card

  LEFT JOIN users ON Card.user_id = users.id
  `
  );
  res.json(data);
});

// 新增貼文
router.post("/Add", async (req, res, next) => {
  // uploader.single("image");
  // 剔除空格
  // let fsTag = 
  // let mdTag = ;
  // let lsTag = ;
  // 合併Tags
  const Tags = req.body.fsTag+','+req.body.mdTag+','+req.body.lsTag
  // const Tags = Tag.toString();
  // console.log('Tag',Tag);
  console.log('Tags',Tags);

  let [data, field] = await connection.execute(
    `INSERT INTO social_diary(id, user_id, image, tittle, content, created_at, tags) VALUES (?,?,?,?,?,?,?)`,
    [
      req.body.id,
      req.session.member.id,
      req.body.image,
      req.body.tittle,
      req.body.content,
      req.body.createdAt,
      Tags,
    ]
  );
  res.json(data);
  console.log('req.body',req.body);
});

// 對應的留言列表 (貼文 x 留言內容)
router.get("/comment-list/:diaryId", async (req, res) => {
  let [data, fields] = await connection.execute(
    ` SELECT comments.id, comments.diary_id, users.name, users.image AS avatar, comments.comment, comments.created_at
  FROM diary_comments AS comments
  JOIN users on comments.user_id = users.id
  WHERE comments.diary_id = ?
  ORDER BY comments.created_at DESC
  `,
    [req.params.diaryId]
  );
  res.json(data);
});

// router.get("/comment-list/:diaryId", async (req, res) => {
//   let [data, fields] = await connection.execute(
// ` SELECT comments.id, comments.diary_id, users.name, users.image AS commenter, comments.comment, comments.created_at
// FROM diary_comments AS comments
// JOIN users on comments.user_id = users.id
// WHERE comments.diary_id = ?
// ORDER BY created_at DESC `,[req.params.diaryId])
//   res.json(data);
// });

// 送出貼文留言API
router.post("/AddComment", async (req, res, next) => {
  //  req.session.member.id取得登入會員id
  let [data, fields] = await connection.execute(
    `INSERT INTO diary_comments (id, diary_id, user_id, comment, created_at	) VALUES ('${req.body.id}','${req.body.cardID}','${req.session.member.id}','${req.body.comment}',NOW())`
  );
  res.json(data);
});

router.get("/card-pages", async (req, res, next) => {
  let page = req.query.page || 1;
  console.log("取得日常頁數", page);

  // 取得目前的總筆數
  let [total] = await connection.execute(
    `
  SELECT COUNT(*) AS total FROM social_diary
  `
  );
  console.log("日常total: ", total); //[{total:15}]
  total = total[0].total; //total= 15

  //  計算總共有幾頁
  const perPage = 8;
  // latpage: 總共有幾頁
  const lastPage = Math.ceil(total / perPage);

  // 計算SQL要的offset(位移)
  let offset = (page - 1) * perPage;
  // 取得資料
  let [data] = await connection.execute(
    `
    SELECT 
    Card.id, Card.image, Card.tittle, Card.content,Card.created_at,
    users.name as poster, users.image AS avatar,
   Card.likes, Card.comments, Card.tags
  
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
    LEFT JOIN diary_comments ON diary.id = diary_comments.diary_id
    GROUP BY diary.id
 ) AS C
 LEFT JOIN diary_like ON C.id = diary_like.diary_id
    GROUP BY C.id
) Card

  LEFT JOIN users ON Card.user_id = users.id
   ORDER BY created_at LIMIT ? OFFSET ?`,
    [perPage, offset]
  );

  // 準備要response
  res.json({
    pagination: { total, perPage, page, lastPage },
    data,
  });
});

// 按讚 先篩選
router.post("/give-like", async (req, res, next) => {
  //  req.session.member.id取得登入會員id
  let [data, fields] = await connection.execute(
    `
  INSERT IGNORE INTO diary_like(user_id, diary_id) VALUES ('${req.session.member.id}','${req.body.cardID}')
  `
  );
  res.json(data);
});

// 對應的按讚列表 (貼文 x 按讚內容)
router.post("/like-list/:userID/:cardID", async (req, res) => {
  let [data, fields] = await connection.execute(
    `
SELECT likes.*, users.name
FROM diary_like AS likes
JOIN users on likes.user_id = users.id 
WHERE likes.user_id = ? AND likes.diary_id = ? `
,[req.params.userID, req.params.cardID]
  );
  res.json(data);
});

// 處理圖片和資料驗證們
const multer = require("multer");
// 圖片存的位置
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, "..","public", "uploads"));
    },
    filename: function(req, file, cb) {
        console.log("multer-filename", file);
        const ext = file.originalname.split(".").pop();
        cb(null, `member-${Date.now()}.${ext}`);
    },
});

const uploader = multer({
    storage: storage,
    // 過濾圖片
    fileFilter: function(req, file, cb) {
        console.log("file.mimetype", file.mimetype);
        if(
            file.mimetype !== "image/jpeg" &&
            file.mimetype !== "image/jpg" &&
            file.mimetype !== "image/png" 
        ) {
            cb(new Error("不接受的檔案型態"), false);
        } else {
            cb(null, true);
        }
    },
    // 檔案尺寸
    limits: {
        fileSize: 1024 * 1024,
    }
});


module.exports = router;
