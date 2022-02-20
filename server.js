// 引入 express
const express = require("express");
require("dotenv").config();
// path 是 nodejs 內建的套件
const path = require("path");
const cors = require("cors");

// 利用 express 這個 library 來建立一個 web app (express instance)
let app = express();

// 使用第三方開發的 cors 中間件
app.use(
    cors({
        // 為了要讓 browser 在 CORS 的情況下還是幫我們送 cookie
        origin: ["http://localhost:3000"],
        credentials: true,
    })
);

// 內建的中間件: urlencoded 要讓 express 認得 body 裡的資料
app.use(express.urlencoded({extended: true}));
// 要讓 express 認得 json (放最前面後面的才會認得)
app.use(express.json());

// 啟用 express-session
const expressSession = require("express-session");
// session-file-store 將 session 存在硬碟
let FileStore = require("session-file-store")(expressSession);
app.use(expressSession({
    store: new FileStore({
        path: path.join(__dirname, "sessions")
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

// 靜態檔案
app.use("/static", express.static(path.join(__dirname, "public")));

// 初始時間
app.use((req, res, next) => {
    let current = new Date();
    console.log(`有人來拜訪嚕 at ${current.toISOString()}`);
    next(); // 若沒寫 next 網頁會 pending (擱置)
});

// 測試用首頁
app.get("/", (req, res, next) => {
    console.info("拜訪首頁")
    res.send("Hello Express");
});

app.use((req, res, next) => {
    console.log("這是一個沒有用的中間件");
    next()
});

// 會員登入的 router
let memberRouter = require("./routers/member");
app.use("/api/member", memberRouter);
// 註冊+登入+登出的 router
let authRouter = require("./routers/auth");
app.use("/api/auth", authRouter);

// 既然前面都比對不到, 那表示這裡是 404 (最後面)
app.use((req, res, next) => {
    console.log("在所有路由中間件的後面 -> 404");
    res.status(404).send("Not Found");
});

const port = process.env.SERVER_PORT || 3000;
app.listen(port, () => {
    console.log(`Server running at port ${port}`)
});