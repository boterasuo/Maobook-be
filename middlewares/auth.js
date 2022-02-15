// auth middleware

let checkLogin = function (req, res, next) {
    // req.session.member
    if (req.session.member) {
        // 表示登入過
        next();
    } else {
        // 表示尚未登入過
        res.status(400).json({
            code: "9999",
            msg: "尚未登入",
        })
    }
};

module.exports = { checkLogin };