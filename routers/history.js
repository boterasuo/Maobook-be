const express = require('express')
const nodemailer = require('nodemailer')
const router = express.Router()
const connection = require('../utils/db')
const { sendCaseMail } = require('./nodemailer')


// 修改案件狀態API
router.post('/caseState', async (req, res, next) => {
  // http://localhost:3002/api/history/caseState/
 
  console.log(req.body)
  let [result] = await connection.execute(
    'UPDATE case_give SET status=? WHERE id=? ',
    [req.body.category,req.body.noteDate]
  )
  // 寄信
  let email = req.body.takenemail
  let mailType = req.body.category
  sendCaseMail(email,mailType)

  //console.log(email);


  res.json({ message: 'ok' })

})




// 應徵者  拿取應徵者資料的API
router.get('/:case_id', async (req, res, next) => {
  // http://localhost:3002/api/history
  let [data, fields] = await connection.execute(
    // 'SELECT user_id AS user_id, GROUP_CONCAT(DISTINCT NAME) AS NAME FROM pets WHERE user_id = ? GROUP BY user_id ORDER BY user_id;',
    'SELECT case_id AS case_id, user_id_taker AS user_id_taker, content AS content, status AS status, users.name AS takerName, users.email AS takerEmail, users.mobile AS takerMobile, users.image AS takerImage FROM case_take LEFT JOIN users ON user_id_taker = users.id WHERE case_id = ?;',
    [req.params.case_id]
  )
  res.json(data)
})




module.exports = router