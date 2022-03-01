const express = require("express");
const router = express.Router();
const connection = require("../utils/db");
const { checkLogin } = require("../middlewares/auth");
const path = require("path");
const moment = require("moment");
// npm i express-validator
const { body, validationResult } = require("express-validator");

// 確認是否為登入狀態
router.use(checkLogin);

// /api/pet
router.get("/", async (req, res, next) => {
    let [petList] = await connection.execute("SELECT * FROM pets WHERE user_id=?", [req.session.member.id]);
    // console.log(petList);
    res.json({data:petList});
});

// api/pet/:petId
router.get("/info/:petId", async (req, res, next) => {
    // 抓取最新一筆身高
    let [petHeight] = await connection.execute("SELECT * FROM pet_height WHERE created_at=(SELECT MAX(created_at) FROM pet_height WHERE pet_id=?)", [req.params.petId]);
    if(petHeight.length) {
        petHeight = petHeight[0].height;
    }else petHeight="";
    // 抓取最新一筆體重
    let [petWeight] = await connection.execute("SELECT * FROM pet_weight WHERE created_at=(SELECT MAX(created_at) FROM pet_weight WHERE pet_id=?)", [req.params.petId]);
    if(petWeight.length) {
        petWeight = petWeight[0].weight;
    } else petWeight="";
    // 抓取疫苗資訊
    let [petVaccine] = await connection.execute("SELECT * FROM vaccination WHERE pet_id=?", [req.params.petId]);
    const vaccineArr = petVaccine.map(v => `${v.vaccine_category_id}`);
    // 抓取健康狀態資訊
    let [petHealth] = await connection.execute("SELECT * FROM pet_illness WHERE pet_id=?", [req.params.petId]);
    const healthArr = petHealth.map(v => `${v.illness_category_id}`);
    res.json({
        height: petHeight,
        weight: petWeight,
        vaccine: vaccineArr, 
        health: healthArr,
    });
});

// /api/pet/data/:selectedPet
router.get("/data/:selectedPet", async (req, res, next) => {
    // 先取得毛孩基資 (表: pets)
    let [petInfo] = await connection.execute("SELECT * FROM pets WHERE id=?", [req.params.selectedPet]);
    console.log("pet", petInfo);
    petInfo = petInfo[0];
    // 再取得毛孩健康狀態 (表: pet_illness)
    let [petHealth] = await connection.execute("SELECT * FROM pet_illness WHERE pet_id=?", [req.params.selectedPet]);
    const healthArr = petHealth.map(v => `${v.illness_category_id}`);
    // 再取得毛孩身高 (表: pet_height)
    let [petHeight] = await connection.execute("SELECT * FROM pet_height WHERE pet_id=? ORDER BY created_at DESC LIMIT 10", [req.params.selectedPet]);
    let petHeightLabel = petHeight.map(date => date.created_at);
    let petHeightData = petHeight.map(date => parseFloat(date.height));
    // 陣列次序反轉 (改為舊到新)
    petHeightLabel = petHeightLabel.reverse();
    petHeightData = petHeightData.reverse();
    console.log("pet height x y: ", petHeightLabel, petHeightData);
    // 再取得毛孩體重 (表: pet_weight)
    let [petWeight] = await connection.execute("SELECT * FROM pet_weight WHERE pet_id=? ORDER BY created_at DESC LIMIT 10", [req.params.selectedPet]);
    let petWeightLabel = petWeight.map(date => date.created_at);
    let petWeightData = petWeight.map(date => parseFloat(date.weight));
    // 陣列次序反轉 (改為舊到新)
    petWeightLabel = petWeightLabel.reverse();
    petWeightData = petWeightData.reverse();
    console.log("pet weight x y: ", petWeightLabel, petWeightData);
    
    res.json({
        data: petInfo,
        health: healthArr,
        heightLabel: petHeightLabel,
        heightData: petHeightData,
        weightLabel: petWeightLabel,
        weightData: petWeightData,
    });
});

// api/pet/height/:selectedPet
router.get("/height/:selectedPet", async (req, res, next) => {
    // 取得毛孩身高
    let [petHeight] = await connection.execute("SELECT * FROM pet_height WHERE pet_id=? ORDER BY created_at DESC", [req.params.selectedPet]);
    // console.log("getAllHeight", petHeight);
    petHeight = petHeight.map((data, i) => {
        let rObj={};
        rObj.id = data.id;
        rObj.value = data.height;
        rObj.time = data.created_at;
        return rObj;
    });
    res.json({data: petHeight});
});
// api/pet/weight/:selectedPet
router.get("/weight/:selectedPet", async (req, res, next) => {
    // 取得毛孩體重
    let [petWeight] = await connection.execute("SELECT * FROM pet_weight WHERE pet_id=? ORDER BY created_at DESC", [req.params.selectedPet]);
    // console.log("getAllWeight", petWeight);
    petWeight = petWeight.map((data, i) => {
        let rObj={};
        rObj.id = data.id;
        rObj.value = data.weight;
        rObj.time = data.created_at;
        return rObj;
    });
    res.json({data: petWeight});

});

// /api/pet/editData
const editDataRules = [
    // 檢查 資料欄位是否符合格式
    body("value").custom((value, {req}) => {
        if(value && req.body.type === "height") {
            return value <= 999.9 && value >= 1.0;
        } else if(value && req.body.type === "weight") {
            return value <= 99.9 && value >= 1.0;
        }else  return true;
    }).withMessage("身長需介於 1~999.9 cm/體重需介於 1~99.9 kg"),
    body("time").custom(value => {
        if(value) {
            const today = Date.parse(moment().format("YYYY-MM-DD"));
            const dataTime = Date.parse(value);
            return dataTime <= today; 
        }else return true;
    }).withMessage("資料日期不可晚於今天日期"),
];
router.post("/editData", editDataRules, async (req, res, next) => {
    console.log(req.body);
    const validateResult = validationResult(req);
    if (!validateResult.isEmpty()) {
        let error = validateResult.mapped();
        console.log("驗證錯誤訊息", error);
        let errKeys = Object.keys(error);
        console.log(errKeys);
        let errObj={};
        errKeys.forEach(key => errObj[key]=error[key].msg);
        console.log(errObj);
        return res.status(400).json(
            errObj
    )};
    const objLength = Object.keys(req.body).length;
    if(objLength > 2) {
        // 若資料OK再存入資料庫
        let sql = "UPDATE ";
        let saveData = [];
        if(req.body.type === "height") {
            sql += "pet_height SET ";
            if(req.body.value && req.body.time) {
                sql += "height=?, created_at=? ";
                saveData.push(req.body.value, req.body.time);
            } else if(req.body.value) {
                sql += "height=? ";
                saveData.push(req.body.value);
            } else {
                sql += "created_at=? ";
                saveData.push(req.body.time);
            }
            sql += "WHERE id=?";
            saveData.push(req.body.id);

        } else if(req.body.type === "weight") {
            sql += "pet_weight SET ";
            if(req.body.value && req.body.time) {
                sql += "weight=?, created_at=? ";
                saveData.push(req.body.value, req.body.time);
            } else if(req.body.value) {
                sql += "weight=? ";
                saveData.push(req.body.value);
            } else {
                sql += "created_at=? ";
                saveData.push(req.body.time);
            }
            sql += "WHERE id=?";
            saveData.push(req.body.id);
        };
        
        // 檢查資料日期是否已存在
        let dateSql = "SELECT created_at FROM ";
        if(req.body.type === "height") {
            dateSql += "pet_height ";
        } else if(req.body.type === "weight") {
            dateSql += "pet_weight ";
        };
        dateSql += "WHERE pet_id=? AND created_at=?";
        let [dateCheck] = await connection.execute(dateSql, 
            [req.body.petId, req.body.time]);
        // console.log(dateCheck);
        if(dateCheck.length > 0) {
            // 有查到該筆日期資料 = 日期重複
            return res.status(400).json({time: "該日期已有資料存在"});
        }
        // 儲存到資料庫
        let [result] = await connection.execute(sql, saveData);
        console.log("editResult", result);
        if (result) {
            res.json({message: "ok"})
        } else {
            res.status(400).json({message: "錯誤"});
        }
    } else {
        return res.json({message: "no data input"});
    };
    
});

// /api/pet/addData
const addDataRules = [
    // 檢查 資料欄位是否符合格式
    body("value").not().isEmpty().withMessage("此欄位不可為空"),
    body("value").custom((value, {req}) => {
        if(req.body.type === "height") {
            return value <= 999.9 && value >= 1.0;
        } else if(req.body.type === "weight") {
            return value <= 99.9 && value >= 1.0;
        }
    }).withMessage("身長需介於 1~999.9 cm/體重需介於 1~99.9 kg"),
    body("time").not().isEmpty().withMessage("此欄位不可為空"),
    body("time").custom(value => {
        const today = Date.parse(moment().format("YYYY-MM-DD"));
        const dataTime = Date.parse(value);
        return dataTime <= today;  
    }).withMessage("資料日期不可晚於今天日期"),
];

router.post("/addData", addDataRules, async (req, res, next) => {
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
        )};
    // 檢查資料日期是否已存在
    let dateSql = "SELECT created_at FROM ";
    if(req.body.type === "height") {
        dateSql += "pet_height ";
    } else if(req.body.type === "weight") {
        dateSql += "pet_weight ";
    };
    dateSql += "WHERE pet_id=? AND created_at=?";
    let [dateCheck] = await connection.execute(dateSql, 
        [req.body.petId, req.body.time]);
    // console.log(dateCheck);
    if(dateCheck.length > 0) {
        // 有查到該筆日期資料 = 日期重複
        return res.status(400).json({time: "該日期已有資料存在"});
    }

    // 存入資料庫
    let sql = "INSERT INTO ";
    let saveData = [];
    if(req.body.type === "height") {
        sql += "pet_height (height, ";
        saveData.push(req.body.value);
    } else if(req.body.type === "weight") {
        sql += "pet_weight (weight, ";
        saveData.push(req.body.value);
    }
    sql += "pet_id, created_at) VALUES (?, ?, ?)";
    saveData.push(req.body.petId, req.body.time);
    let [addDataResult] = await connection.execute(sql, saveData);
    if (addDataResult) {
        res.json({message: "ok"})
    } else {
        res.status(400).json({message: "錯誤"});
    };    
});

// 處理圖片和資料驗證們
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

const addPetRules = [
    // 檢查寵物姓名欄位 到家日 生日
    body("name").not().isEmpty().withMessage("此欄位不可為空"),
    body("arrDay").custom(value => {
        if(value.length > 0) {
            const today = Date.parse(moment().format("YYYY-MM-DD"));
            const arrDay = Date.parse(value);
            return arrDay <= today; 
        } else {
            return true;
        }
    }).withMessage("請選擇早於今天的日期"),
    body("birthday").custom((value, {req}) => {
        if(value.length && req.body.arrDay.length > 0) {
            const birthday = Date.parse(value);
            const arrDay = Date.parse(req.body.arrDay);
            return birthday <= arrDay;
        } else if (value.length) {
            const today = Date.parse(moment().format("YYYY-MM-DD"));
            const birthday = Date.parse(value);
            return birthday <= today;
        } else {
            return true;
        }
    }).withMessage("毛孩生日不可晚於到家日或今天日期"),
    body("cate").not().isEmpty().withMessage("此欄位不可為空"),
];

// /api/pet/editInfo
router.post("/editInfo",
    uploader.single("image"),
    addPetRules,
    async (req, res, next) => {
        console.log("editInfo", req.body);
        const validateResult = validationResult(req);
        if(!validateResult.isEmpty()) {
            let error = validateResult.mapped();
            console.log("編輯毛孩資料錯誤", error);
            console.log(error);
            let errKeys = Object.keys(error);
            let errObj={};
            errKeys.forEach(key => errObj[key]=error[key].msg);
            console.log(errObj);
            return res.status(400).json(
                errObj
            );
        };
        // 根據生日判斷 age category
        let ageCate = ""; 
        if(req.body.birthday.length > 0) {
            const today = moment(moment().format("YYYY-MM-DD"));
            const birthday = moment(req.body.birthday);
            let age = today.diff(birthday, "years", true);
            if (age < 1) {
                ageCate = 1;
            }else if (age < 8) {
                ageCate = 2;
            }else {
                ageCate = 3;
            };
            // console.log("ageCate", ageCate);
        };
        // 判斷是否有上傳圖檔 (新增毛孩照片)
        let filename;
        if(req.file) {
            // 有上傳圖檔再寫入資料庫
            filename = req.file ? "/static/uploads/" + req.file.filename : "";            
        } else {
            filename = "";
        }
        // console.log("filename", filename);
        let [editResult] = await connection.execute(
            "UPDATE pets name=?, image=?, adoptime=?, birthday=?, gender=?, category=? WHERE id=?", [req.body.name, filename, req.body.arrDay, req.body.birthday, req.body.gender, req.body.cate, req.body.id]);
    }
);

// /api/pet/add
router.post("/add",
    uploader.single("image"),
    addPetRules,
    async (req, res, next) => {
        console.log(req.body);
        const validateResult = validationResult(req);
        if(!validateResult.isEmpty()) {
            let error = validateResult.mapped();
            console.log("新增毛孩資料錯誤", error);
            console.log(error);
            let errKeys = Object.keys(error);
            let errObj={};
            errKeys.forEach(key => errObj[key]=error[key].msg);
            console.log(errObj);
            return res.status(400).json(
                errObj
            );
        };
        // 存入資料庫
        const addPetTime = moment().format("YYYY-MM-DD kk:mm:ss");
        let ageCate = ""; // 根據生日判斷 age category
        if(req.body.birthday.length > 0) {
            const today = moment(moment().format("YYYY-MM-DD"));
            const birthday = moment(req.body.birthday);
            let age = today.diff(birthday, "years", true);
            if (age < 1) {
                ageCate = 1;
            }else if (age < 8) {
                ageCate = 2;
            }else {
                ageCate = 3;
            };
            console.log(ageCate);
        };
        // 判斷是否有上傳圖檔 (新增毛孩照片)
        let filename;
        if(req.file) {
            // 有上傳圖檔再寫入資料庫
            filename = req.file ? "/static/uploads/" + req.file.filename : "";            
        } else {
            filename = "";
        }
        console.log("filename", filename);

        let sql = "INSERT INTO pets (user_id, category, name, gender, image, birthday, age_category, adoptime, valid, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        let saveData = [req.body.id, req.body.cate, req.body.name, req.body.gender, filename, req.body.birthday, ageCate, req.body.arrDay, 1, addPetTime];
        // 先存入 pets
        let [addPetResult] = await connection.execute(sql, saveData);
        console.log("addPetResult", addPetResult);
        // 利用 user_id 和 created_at 取得剛建立的寵物 id
        // TODO: 改用 addPetResult 內提供的 InsertId 即可!!
        let [getPetId] = await connection.execute("SELECT id FROM pets WHERE user_id=? AND created_at=?", [req.body.id, addPetTime]);
        const petId = getPetId[0].id;
        // 將身高 體重 疫苗 健康資訊 存入對應的 TABLE
        // pet_height, pet_weight, vaccination, pet_illness
        // pet_height
        let petHeightResult = [];
        if (req.body.height.length) {
            petHeightResult = await connection.execute("INSERT INTO pet_height (pet_id, height, created_at) VALUES (?, ?, ?)", [petId, req.body.height, addPetTime]);
        };
        // pet_weight
        let petWeightResult = [];
        if (req.body.weight.length) {
            petWeightResult = await connection.execute("INSERT INTO pet_weight (pet_id, weight, created_at) VALUES (?, ?, ?)", [petId, req.body.weight, addPetTime]);
        };
        // 處理 vaccine req
        let vaccineArr, petVaccResult=[];
        if (req.body.vaccine.length > 0) {
            vaccineArr = req.body.vaccine.split(",");
            for (let i=0; i<vaccineArr.length; i++) {
                petVaccResult = await connection.execute("INSERT INTO vaccination (pet_id, vaccine_category_id) VALUES (?, ?)", [petId, vaccineArr[i]]);
            };
        };
        // 處理 illness req
        let healthArr, petHealthResult=[];
        if (req.body.health.length > 0) {
            healthArr = req.body.health.split(",");
            for (let i=0; i<healthArr.length; i++) {
                petHealthResult = await connection.execute("INSERT INTO pet_illness (pet_id, illness_category_id) VALUES (?, ?)", [petId, healthArr[i]]);
            };
        };
        // console.log("petId", petId);
        // console.log(addPetResult);
        if (addPetResult && petVaccResult && petHealthResult && petHeightResult && petWeightResult) {
            res.json({message: "ok"});
        } else {
            res.status(400).json({message: "錯誤"});
        };
    });

module.exports = router;