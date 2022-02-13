const express = require("express");
const router = express.Router();
const connection = require("../utils/db");
const bcrypt = require("bcrypt");
const path = require("path");
const moment = require("moment");


// npm i express-validator
const { body, validationResult } = require("express-validator");
const registerRules = [
    // 檢查 email password confirmPassword 是否符合格式
    body("name").isLength({min: 1}).withMessage("請填寫姓名欄位"),
    body("email").isEmail().withMessage("Email 欄位請填寫正確格式"),
    body("password").isLength({min: 8}).withMessage("密碼長度至少為 8"),
    body("confirmPassword")
        .custom((value, {req}) => {
            return value === req.body.password;
        })
        .withMessage("密碼驗證不一致"),];

// api/auth/register
router.post("/register", 
    registerRules,
    async (req, res, next) => {
        // 拿到驗證的結果
        console.log(req.body);
        const validateResult = validationResult(req);
        if (!validateResult.isEmpty()) {
            // validateResult 不是空的
            let error = validateResult.mapped();
            console.log("驗證錯誤訊息", error);
            let errKeys = Object.keys(error);
            console.log(errKeys);
            let errObj={};
            errKeys.forEach(key => errObj[key]=error[key].msg);
            console.log(errObj);
            return res.status(400).json(
                errObj
            );
        }

        // 檢查 email 是否已被註冊過
        let [member] = await connection.execute("SELECT * from users WHERE email=?", [req.body.email]);
        console.log(member);
        if (member.length > 0) {
            // 表示有查到 email --> 註冊過了
            return res.status(400).json({
                email: "這個 email 已經註冊過了",
            });
        }

        // 雜湊 password
        let hashPassword = await bcrypt.hash(req.body.password, 10);

        // 存到資料庫
        let signUpTime = moment().format("YYYY-MM-DD kk:mm:ss");
        // console.log(signUpTime);
        let [result] = await connection.execute("INSERT INTO users (name, email, password, valid, created_at) VALUES (?, ?, ?, ?, ?)", [req.body.name, req.body.email, hashPassword, 1, signUpTime]);
        console.log("儲存結果", result);
        res.json({message: "ok"});
    });

module.exports = router;