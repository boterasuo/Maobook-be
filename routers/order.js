const express = require('express')
const router = express.Router()
const connection = require('../utils/db')

const moment = require('moment')



router.post('/', async (req, res, next) => {


    let [result] = await connection.execute(
        'UPDATE users SET mailing_name=?,mailing_mobile=?,mailing_address=?,mailing_email=? WHERE id=? ',[req.body.name,
        req.body.mobile,
        req.body.address,
        req.body.email,
        req.body.user_id])

    let orderTime = moment().format('YYYY-MM-DD kk:mm:ss')
    console.log("time", orderTime)
    let [result2] = await connection.execute(
        'INSERT INTO user_order (user_id,order_time,payment_category_id,status) VALUES (?, ?, ?,?)',
        [
            req.body.user_id,
            orderTime,
            req.body.payment_category_id,
            1
        ]
    )
    console.log("insertId", result2.insertId)

    let all = req.body.cart
    await all.map(async (all) => {
        console.log(all.id)
        let [result3] = await connection.execute(
            'INSERT INTO order_detail ( user_order_id,product_id,amount) VALUES (?, ?, ?)',
            [
                result2.insertId,
                all.id,
                all.amount,
            ]
        )
    })
    console.log("id", all.id)

    console.log(req.body)
    res.json({ message: 'ok' })
})


module.exports = router;



//     name: '',
//     mobile: '',
//     address: '',
//     email: '',
//     user_id: user.id,
//     payment_category_id: '',
//     cart,
