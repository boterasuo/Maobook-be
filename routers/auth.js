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

// 登入的 Router
router.post("/login", async (req, res, next) => {
    // 確認有無這個帳號
    let [member] = await connection.execute("SELECT * FROM users WHERE email=?", [req.body.email]);
    console.log("會員資料: ", member);
    if (member.length === 0) {
        // 查不到 --> 尚未註冊
        return res.status(400).json({
            msg: "尚未註冊！",
        });
    };
    member = member[0];

    // 若帳號存在 --> 比對密碼
    let result = await bcrypt.compare(req.body.password, member.password);
    if (!result) {
        // 如果比對失敗
        return res.status(400).json({
            msg: "帳號或密碼錯誤！",
        });
    };
    // 整理需要的資料
    let returnMember = {
        id: member.id,
        name: member.name,
        email: member.email,
        image: member.image,
    };
    // 如果密碼比對成功 --> 記錄在 session
    // 寫 session
    req.session.member = returnMember;

    res.json({
        data: returnMember,
    });

});

// 登出的 Router
router.get("/logout", (req, res, next) => {
    req.session.member = null;
    res.sendStatus(202);
});

module.exports = router;