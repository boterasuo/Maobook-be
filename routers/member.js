const express = require("express");
const router = express.Router();
const connection = require("../utils/db");
const { checkLogin } = require("../middlewares/auth");
const path = require("path");
const moment = require("moment");

// /api/member
// checkLogin 中間件會對 member 這個 router 有效
router.use(checkLogin);

router.get("/", (req, res, next) => {
    // console.log("member API ", req.session.member);
    res.json(req.session.member);
});

// /api/member/info
router.get("/info", async (req, res, next) => {
    let [userInfo] = await connection.execute("SELECT * FROM users WHERE id=?", [req.session.member.id]);
    // console.log("會員詳細資料", userInfo);
    userInfo = userInfo[0];
    let returnUserInfo = {
        id: userInfo.id,
        name: userInfo.name,
        image: userInfo.image,
        email: userInfo.email,
        gender: userInfo.gender,
        mobile: userInfo.mobile,
        birthday: userInfo.birthday,
        address: userInfo.living_address,
    };
    // console.log("returnUserInfo: ", returnUserInfo);
    res.json({
        data: returnUserInfo,
    })
});

const multer = require("multer");
// 圖片存的位置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "..", "public", "uploads"));
    },
    filename: function (req, file, cb) {
        console.log("multer-filename", file);
        const ext = file.originalname.split(".").pop();
        // TODO: 有時間的話檔名改用 uuid
        cb(null, `member-${Date.now()}.${ext}`);
    },
});

const uploader = multer({
    storage: storage,
    // 過濾圖片
    fileFilter: function (req, file, cb) {
        console.log("file.mimetype", file.mimetype);
        if (
            file.mimetype !== "image/jpeg" &&
            file.mimetype !== "image/jpg" &&
            file.mimetype !== "image/png"
        ) {
            cb(new Error("不接受的檔案型態"), false);
        } else {
            cb(null, true);
        }
    },
    // 檔案尺寸
    limits: {
        fileSize: 1024 * 1024,
    }
});

// /api/member/edit
// 後端檢查: 姓名欄位, 生日, 手機格式
const { body, validationResult } = require("express-validator");
const userEditRules = [
    body("name").not().isEmpty().withMessage("此欄位不可為空"),
    body("mobile").custom(value => {
        if (value.length > 0 && value !== "null") {
            const regMobile = /^09\d{8}$/;
            return regMobile.test(value);
        } else {
            return true;
        }
    }).withMessage("手機號碼格式不符"),
    body("birthday").custom(value => {
        if(value.length > 0 && value !== "null") {
            const today = Date.parse(moment().format("YYYY-MM-DD"));
            const birthday = Date.parse(value);
            return birthday <= today;
        } else {
            return true;
        }
    }).withMessage("請選擇早於今天的日期"),
];
router.post("/edit",
    uploader.single("image"),
    userEditRules,
    async (req, res, next) => {
        console.log("編輯會員資料", req.body);

        const validateResult = validationResult(req);
        if (!validateResult.isEmpty()) {
            let error = validateResult.mapped();
            console.log("會員編輯錯誤", error);
            let errKeys = Object.keys(error);
            let errObj = {};
            errKeys.forEach(key => errObj[key] = error[key].msg);
            console.log(errObj);
            return res.status(400).json(
                errObj
            );
        };
        // 處理初始的 NULL string 或 空值
        if (req.body.gender === "null" || req.body.gender === "") {
            req.body.gender = null;
        };
        if (req.body.birthday === "null" || req.body.birthday === "") {
            req.body.birthday = null;
        };
        if (req.body.mobile === "null" || req.body.mobile === "") {
            req.body.mobile = null;
        };
        if (req.body.address === "null" || req.body.address === "") {
            req.body.address = null;
        };

        // 處理圖片
        console.log("req.file:", req.file);
        let sql = "UPDATE users SET name=?, gender=?, mobile=?, birthday=?, living_address=?";
        let saveData = [req.body.name, req.body.gender, req.body.mobile, req.body.birthday, req.body.address];
        // 判斷是否有上傳圖檔 (更新大頭貼)
        if (req.file) {
            // 有上傳圖檔再寫入資料庫
            let filename = req.file ? "/static/uploads/" + req.file.filename : "";
            // console.log("filename:", filename);
            sql += ", image=? ";
            saveData.push(filename);
            // 將圖檔名同步存到 session 裡
            // 不然在未重新登入狀態下, 頁面重整時會抓到舊圖檔
            req.session.member.image = filename;
        } 
        sql += " WHERE id=?";
        saveData.push(req.body.id);
        let [result] = await connection.execute(sql, saveData);
        console.log("編輯會員result", result);
        if (result) {
            res.json({ message: "ok" })
        } else {
            res.status(400).json({ message: "錯誤" });
        }
    });




module.exports = router;