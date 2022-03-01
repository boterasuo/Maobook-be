const express = require('express')
const router = express.Router()
const connection = require('../utils/db')

// 行事曆撰寫  送出表單
// /api/calenderForm/register
router.post('/register', async (req, res, next) => {
  // 合併tagOne,tagTwo
  const Tag = req.body.tagOne + ',' + req.body.tagTwo
  console.log(Tag)

  let [result] = await connection.execute(
    'INSERT INTO schedules (pet_id, date, importance, tags, category_id, title, status	) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      req.body.pets,
      req.body.date,
      req.body.important,
      Tag,
      req.body.category,
      req.body.textareaValue,
      0,
    ]
  )

  console.log(req.body)
  res.json({ message: 'ok' })
})

module.exports = router
