const express = require ("express");
const router = express.Router();
const connection = require("../utilis/db");

//行事曆 測試中
router.get("/helpcalendar", async (req, res) => {
    let [data, fields] = await connection.execute
    ("SELECT day(date) AS day FROM case_give WHERE year(date) = ? AND month(date)= ?",
[req.params.year,req.params.month]);
    res.json(data);
  });

//該日案件列表（行事曆點開）
router.get("/dayhelps", async (req, res) => {
  let [data, fields] = await connection.execute(
    `SELECT * FROM case_give WHERE status=0 AND day(date)= ${req.params.date}`);
      //還需要join id from case_give = case_id from case_take 顯示應徵人數
  res.json(data);
});

//互助專區
router.get("/helplist", async (req, res) => {
  let [data, fields] = await connection.execute(
    `SELECT * FROM case_give WHERE status=0 AND region = ${req.params.region}`);
      //還需要join user_id_giver from case_give = id from users 的 image 顯示使用者頭像
  res.json(data);
});

//發案表單
router.post("/helppost", async (req, res) => {
  let [data, fields] = await connection.execute(
    `INSERT INTO case_give (user_id_giver, category_id, tags, date, region, price, title, content, created_at, status, image) VALUES
    ('[${req.params.id}', '${req.params.categoty}', '${req.params.tag}', '${req.params.date}', '${req.params.region}', '${req.params.price}', '${req.params.title}', '${req.params.content}', '${GETDATE()}}','0', '${req.params.image}')`);
  res.json(data);
});

//案件細節頁（案件列表或互助專區點開）
router.get("/helpdetails", async (req, res) => {
  let [data, fields] = await connection.execute(
    `SELECT * FROM case_give WHERE status=0 AND id = ${req.params.id}`);
      //還需要join user_id_giver from case_give = id from users 的 image & name 顯示使用者頭像和暱稱
  res.json(data);
});

//案件細節頁：接案者應徵表單
router.post("/helpdetails", async (req, res) => {
  let [data, fields] = await connection.execute(
    `INSERT INTO case_take (user_id_taker, contact, content, status) VALUES
    ('[${req.params.id}', '${req.params.contact}', '${req.params.content}', '0')`);
  res.json(data);
});

//案件細節頁：發案者編輯案件內容
router.put("/helpdetails", async (req, res) => {
  let [data, fields] = await connection.execute(
    `UPDATE case_give SET title=? date=? price=? region=? content=? category=? tags=? img=? WHERE id = ${req.params.id}`, [req.params.title,req.params.date, req.params.price, req.params.region, req.params.content, req.params.category, req.params.tags, req.params.img]);
  res.json(data);
});


  module.exports = router;