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
    console.log("member API ", req.session.member);
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
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, "..","public", "uploads"));
    },
    filename: function(req, file, cb) {
        console.log("multer-filename", file);
        const ext = file.originalname.split(".").pop();
        // TODO: 有時間的話檔名改用 uuid
        cb(null, `member-${Date.now()}.${ext}`);
    },
});

const uploader = multer({
    storage: storage,
    // 過濾圖片
    fileFilter: function(req, file, cb) {
        console.log("file.mimetype", file.mimetype);
        if(
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
router.post("/edit", 
    uploader.single("image"),
    async (req, res, next) => {
        console.log("編輯會員資料", req.body)
        // 處理初始的 NULL string
        if(req.body.gender === "null") {
            req.body.gender = null;
        } 
        if(req.body.mobile === "null") {
            req.body.mobile = null;
        } 
        if(req.body.address === "null") {
            req.body.address = null;
        }

        // 處理圖片
        console.log("req.file:", req.file);
        let sql = "UPDATE users SET name=?, gender=?, mobile=?, birthday=?, living_address=?";
        let saveData = [req.body.name, req.body.gender, req.body.mobile, req.body.birthday, req.body.address];
        // 判斷是否有上傳圖檔 (更新大頭貼)
        if(req.file) {
            // 有上傳圖檔再寫入資料庫
            let filename = req.file ? "/static/uploads/" + req.file.filename : "";
            // console.log("filename:", filename);
            sql += ", image=? ";
            saveData.push(filename);
        } 
        sql += " WHERE id=?";
        saveData.push(req.body.id); 
        let [result] = await connection.execute(sql, saveData);
        console.log(result);
        if (result) {
            res.json({message: "ok"})
        } else {
            res.status(400).json({message: "錯誤"});
        }
});




module.exports = router;