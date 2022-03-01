const express = require('express')
const router = express.Router()
const connection = require('../utils/db')
const moment = require('moment')

// 行事曆記事事件API
router.get('/:year/:month', async (req, res, next) => {
  // http://localhost:3002/api/calendarE/:year/:month
  let [data, fields] = await connection.execute(
    'SELECT pet_id AS pet_id, DAY(DATE) AS DATE, importance AS importance, tags AS tags, category_id AS category_id, title AS title, status AS status FROM schedules WHERE year(date) = ? AND month(date)= ? ORDER BY DATE ASC;',
    [req.params.year, req.params.month]
  )
  data.map((d) => {
    d.tags = d.tags.split(',')
  })
  res.json(data)
})

module.exports = router
