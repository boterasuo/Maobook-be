const express = require('express')
const router = express.Router()
const connection = require('../utils/db')
const moment = require('moment')




// npm i express-validator
const { body, validationResult } = require('express-validator')
const sendorderrule = [
    // 檢查是否符合格式
    body('name').not().isEmpty().withMessage('此欄位不可為空'),
    body('email').isEmail().withMessage('Email 欄位請填寫正確格式'),
    body('payment').not().isEmpty().withMessage('請選擇一個'),
    body('address').not().isEmpty().withMessage('此欄位不可為空'),
    body("mobile").custom(value => {
        if (value.length > 0 && value !== "null") {
            const regMobile = /^09\d{8}$/;
            return regMobile.test(value);
        } else {
            return true;
        }
    }).withMessage("手機號碼格式不符")
]


router.post('/', sendorderrule, async (req, res, next) => {
    const validateResult = validationResult(req);

    if (!validateResult.isEmpty()) {
        let error = validateResult.mapped();
        console.log("訂單填寫錯誤", error);
        let errKeys = Object.keys(error);
        let errObj = {};
        errKeys.forEach(key => errObj[key] = error[key].msg);
        console.log(errObj);
        return res.status(400).json(
            errObj
        );
    };
    // 處理初始的 NULL string 或 空值
    if (req.body.name === "null" || req.body.name === "") {
        req.body.name = null;
    };
    if (req.body.address === "null" || req.body.address === "") {
        req.body.address = null;
    };
    if (req.body.mobile === "null" || req.body.mobile === "") {
        req.body.mobile = null;
    };
    if (req.body.email === "null" || req.body.email === "") {
        req.body.email = null;
    };







    let [result] = await connection.execute(
        'UPDATE users SET mailing_name=?,mailing_mobile=?,mailing_address=?,mailing_email=? WHERE id=? ', [req.body.name,
        req.body.mobile,
        req.body.address,
        req.body.email,
        req.body.user_id])

    let orderTime = moment().format('YYYY-MM-DD kk:mm:ss')
    console.log("time", orderTime)
    let [result2] = await connection.execute(
        'INSERT INTO user_order (user_id,order_time,payment,delivery,delivery_fee,status) VALUES (?, ?, ?, ?, ?, ?)',
        [
            req.body.user_id,
            orderTime,
            req.body.payment,
            req.body.delivery,
            req.body.delivery_fee,
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
