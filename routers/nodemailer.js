const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service:"Gmail",
  secureConnection:true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
  tls:
  {
    rejectUnauthorized:false
  }

});

// let transporter = nodemailer.createTransport(smtpTransport({
//   host: "outmail.abc.co.th", // hostname
//   secure: false, // use SSL
//   port: 25, // port for secure SMTP
//   auth: {
//       user: "username@abc.co.th",
//       pass: "passwordmail"
//   },
//   tls: {
//       rejectUnauthorized: false
//   }
// }));



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

function sendCaseMail(email,mailType) {

  // 判斷事件種類
  let subjectstring='';
  let htmlstring='';
  
    switch (mailType) {
      case '1':
        subjectstring="Maobook 毛毛日記：關於您應徵的互助，毛主人婉拒了您幫忙。"
        htmlstring="<h2>感謝您熱心的參與毛孩互助</h2><p>目前對方毛主人因其他考量，已婉拒您的幫忙</p><p>但仍舊非常感謝您的參與，期待下次互助的機會</p>"
        break;
      case '2':
        subjectstring="Maobook 毛毛日記：關於您應徵的互助，毛主人想與您進一步聯繫。"
        htmlstring="<h2>感謝您熱心的參與毛孩互助</h2><p>對方毛主人想進一步與您媒合與溝通詳細資訊</p><p>請您留意最近的電子信箱與手機，以防錯過訊息喔！</p>"
        break;        
      case '3':
        subjectstring="Maobook 毛毛日記：關於您應徵的互助，您已成功接案此委託。"
        htmlstring="<h2>感謝您熱心的參與毛孩互助</h2><p>您已完成媒合，成功接受此互助案件</p><p>請記得於約定的時間地點，完成委託喔！</p>"
        break;
      case '4':
        subjectstring="Maobook 毛毛日記：關於您應徵的互助，此委託已結案，請確認後續金流。"
        htmlstring="<h2>感謝您熱心的參與毛孩互助</h2><p>您所應徵的委託案已經順利完成，請確認是否收款</p><p>感謝您的參與，期待下次互助的機會</p>"
        break;
      default:
        break;
    }

  const options = {
    from: process.env.MAIL_USER,
    to: email,
    subject: subjectstring,
    html: htmlstring,
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
