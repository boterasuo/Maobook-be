

// 處理描述標籤
function convertIntro(petList) {
  let processIntroData = petList.map((d) => {
    // 處理品種
    if (d.category == 1) {
      d.category = "狗狗"
    } else {
      d.category = "貓咪"
    }

    // 計算年紀
    let birthDayTime = new Date(d.birthday).getTime();
    //當前時間，毫秒
    let nowTime = new Date().getTime();
    //一年毫秒數(365 * 86400000 = 31536000000)
    d.birthday = Math.floor((nowTime - birthDayTime) / 31536000000);

    // 年紀分類
    if (d.age_category == 1) {
      d.age_category = "未成年";
    } else if (d.age_category == 2) {
      d.age_category = "成年";
    } else {
      d.age_category = "熟齡";
    }
    return d;
  });
  return processIntroData;
}


//處理疾病標籤
async function convertIllness(processIntroData, connection) {
  let illnessTagProcess = await Promise.all(processIntroData.map(async (c) => {

    let [illnessID] = await connection.execute("SELECT illness_category_id FROM pet_illness WHERE pet_id=?", [c.id]);
    // c.illnessTags = illnessID;

    c.illnessTags = await Promise.all( illnessID.map(async (a) => {
      let [illnessTag] = await connection.execute("SELECT name FROM illness_category WHERE id=?", [a.illness_category_id]);
      console.log("petID:", c.id, "中文疾病標籤：", illnessTag);
      return illnessTag[0].name;
    }));
    return c;
  }));

  return illnessTagProcess;
}



module.exports = { convertIntro, convertIllness };








