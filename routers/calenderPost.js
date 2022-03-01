const express = require('express')
const router = express.Router()
const connection = require('../utils/db')

// 行事曆撰寫  拿取寵物名字的API
router.get('/:user_id', async (req, res, next) => {
  // http://localhost:3002/api/calenderPost
  let [data, fields] = await connection.execute(
    // 'SELECT user_id AS user_id, GROUP_CONCAT(DISTINCT NAME) AS NAME FROM pets WHERE user_id = ? GROUP BY user_id ORDER BY user_id;',
    'SELECT user_id AS user_id, name AS petname, id AS petsid FROM pets WHERE user_id = ? ;',
    [req.params.user_id]
  )
  res.json(data)
})

module.exports = router
