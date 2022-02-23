const express = require("express");
const router = express.Router();
const connection = require("../utils/db");
// const bcrypt = require("bcrypt");
// const path = require("path");
const moment = require("moment");
const cors = require("cors");


// RESTful API 的列表
// router.get("/", async (req, res, next) => {
//     let [data, fields] = await connection.execute("SELECT  day(date) AS date, GROUP_CONCAT(DISTINCT category_id) AS category_id FROM Schedules WHERE DATE(date) BETWEEN ? AND ?  group by DATE(date) order by DATE(date);",['2022-02-01','2022-02-31']);
//     data.map(d => {
//         d.category_id = d.category_id.split(",");
//     });
    // res.send ==> 純文字
    // res.render ==> server-side render 會去找樣板
//     res.json(data);
//   });




module.exports = router;