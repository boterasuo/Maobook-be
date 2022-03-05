const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

function sendEmail(email) {
  const options = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "歡迎來到 Maobook 毛毛日記",
    html: "<h2>歡迎您加入 Maobook 毛毛日記的大家庭</h2><p>快登入<a href='http://localhost:3000/login'><butten>毛毛日記</butten></a>，記錄下您與毛孩的每一個時刻吧！</p>",
  };

  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("信件發送:", info.response);
  });
}

function sendCaseMail(email) {
  const options = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Maobook 毛毛日記：你應徵的委託收到回覆囉！",
    html: 
    "<h2>你應徵的委託收到回覆囉</h2><p>點擊登入<a href='http://localhost:3000/login'><p>毛毛日記</p></a>看看對方回應您什麼吧～！</p>",
  };

  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("信件發送:", info.response);
  });
}


module.exports = { sendEmail,sendCaseMail };
