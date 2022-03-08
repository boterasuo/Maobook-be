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
    let sql = "SELECT id, user_id, name, image FROM pets WHERE user_id=? AND valid!=?";
    let saveData = [req.session.member.id, 9];
    let pagination = {};
    if (req.query.page) {
        let page = req.query.page;
        console.log("page", page)
        let [total] = await connection.execute("SELECT COUNT(*) AS total FROM pets WHERE user_id=? AND valid!=?", [req.session.member.id, 9]);
        total = total[0].total;
        const perPage = 9;
        const lastPage = Math.ceil(total / perPage);
        let pageOffset = (page - 1) * perPage;
        sql += " ORDER BY id LIMIT ? OFFSET ?";
        saveData.push(perPage, pageOffset);
        pagination = {total, perPage, page, lastPage};
    }

    let [petList] = await connection.execute(sql, saveData);
    console.log("petList", petList);
    if (Object.keys(pagination).length) {
        res.json({
            pagination,
            data:petList,
        })
    } else {
        res.json({data:petList});
    }
});

// api/pet/info/:petId
router.get("/info/:petId", async (req, res, next) => {
    const petId = req.params.petId;
    console.log("petInfo_id", petId)
    // 抓取毛孩基資
    let [petInfo] = await connection.execute("SELECT * FROM pets WHERE id=?", [petId]);
    // 抓取最新一筆身高
    let [petHeight] = await connection.execute("SELECT * FROM pet_height WHERE pet_id=? AND created_at=(SELECT MAX(created_at) FROM pet_height WHERE pet_id=?)", [petId, petId]);
    if(petHeight.length) {
        petHeight = petHeight[0].height;
    }else petHeight="";
    console.log("petInfo_height", petHeight);
    // 抓取最新一筆體重
    let [petWeight] = await connection.execute("SELECT * FROM pet_weight WHERE pet_id=? AND created_at=(SELECT MAX(created_at) FROM pet_weight WHERE pet_id=?)", [petId, petId]);
    if(petWeight.length) {
        petWeight = petWeight[0].weight;
    } else petWeight="";
    console.log("petInfo_weight", petWeight);
    // 抓取疫苗資訊
    let [petVaccine] = await connection.execute("SELECT * FROM vaccination WHERE pet_id=?", [petId]);
    const vaccineArr = petVaccine.map(v => `${v.vaccine_category_id}`);
    // 抓取健康狀態資訊
    let [petHealth] = await connection.execute("SELECT * FROM pet_illness WHERE pet_id=?", [petId]);
    const healthArr = petHealth.map(v => `${v.illness_category_id}`);
    res.json({
        petInfo: petInfo[0],
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
    // 陣列次序反轉 (改為舊到新 for chart)
    petHeightLabel = petHeightLabel.reverse();
    petHeightData = petHeightData.reverse();
    console.log("pet height x y: ", petHeightLabel, petHeightData);
    // 再取得毛孩體重 (表: pet_weight)
    let [petWeight] = await connection.execute("SELECT * FROM pet_weight WHERE pet_id=? ORDER BY created_at DESC LIMIT 10", [req.params.selectedPet]);
    let petWeightLabel = petWeight.map(date => date.created_at);
    let petWeightData = petWeight.map(date => parseFloat(date.weight));
    // 陣列次序反轉 (改為舊到新 for chart)
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

// /api/pet/deleteData/:type
router.post("/deleteData/:type", async (req, res, next) => {
    const type = req.params.type;
    const deleteId = req.body.btnId;
    console.log(type, deleteId)
    let sql = "DELETE FROM ";
    if(type === "height") {
        sql += "pet_height "
    } else {
        sql += "pet_weight "
    }
    sql += "WHERE id=?"
    // 刪除該筆資料
    let [deleteResult] = await connection.execute(sql, [deleteId]);
    console.log("deleteResult", deleteResult)
    if (deleteResult) {
        res.json({message: "ok"})
    } else {
        res.status(400).json({message: "錯誤"});
    }; 
})

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
    body("gender").not().isEmpty().withMessage("此欄位不可為空"),
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
        let ageCate = req.body.ageCate; 
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
        } else {
            ageCate = 0;
        }
        // 判斷是否有上傳圖檔 (新增毛孩照片)
        let filename;
        if(req.file) {
            // 有上傳圖檔再寫入資料庫
            filename = req.file ? "/static/uploads/" + req.file.filename : "";            
        } else {
            filename = req.body.image;
        }
        // console.log("filename", filename);
        let [editResult] = await connection.execute(
            "UPDATE pets SET name=?, image=?, adoptime=?, birthday=?, age_category=?, gender=?, category=?, valid=? WHERE id=?", [req.body.name, filename, req.body.arrDay, req.body.birthday, ageCate, req.body.gender, req.body.cate, req.body.valid, req.body.id]);
        // console.log("editResult", editResult);
        // 比對 vaccination --> 若內容不同則先全刪再全存
        let [vaccineData] = await connection.execute(
            "SELECT vaccine_category_id FROM vaccination WHERE pet_id=?", [req.body.id]);
            vaccineData = vaccineData.map(v => v.vaccine_category_id).toString();
        // 內容不同代表有修改 --> 更新到資料庫中
        let petVaccResult = [];
        if (req.body.vaccine !== vaccineData) {
            // console.log("something changed!");
            let [vaccineDelete] = await connection.execute(
                "DELETE FROM vaccination WHERE pet_id=?",[req.body.id]);
            let vaccineArr = req.body.vaccine.split(",");
            if (vaccineArr[0] !== "") {
                let sql = "INSERT INTO vaccination (pet_id, vaccine_category_id) VALUES ";
                let saveData = [];
                for (let i=0; i<vaccineArr.length; i++) {
                    if (i === 0) {
                        sql += "(?, ?)";
                        saveData.push(req.body.id, vaccineArr[i]);
                    } else {
                        sql += ", (?, ?)";
                        saveData.push(req.body.id, vaccineArr[i]);
                    }
                };
                petVaccResult = await connection.execute(sql, saveData);
            }
        } else { petVaccResult = "疫苗資料無修改"};
        // console.log("petVaccResult", petVaccResult);

        // 比對 illness --> 若內容不同則先全刪再全存
        let [healthData] = await connection.execute(
            "SELECT illness_category_id FROM pet_illness WHERE pet_id=?", [req.body.id]);
            healthData = healthData.map(v => v.illness_category_id).toString();
        // 內容不同代表有修改 --> 更新到資料庫中
        let petHealthResult = [];
        if (req.body.health !== healthData) {
            let [healthDelete] = await connection.execute(
                "DELETE FROM pet_illness WHERE pet_id=?",[req.body.id]);
            let healthArr = req.body.health.split(",");
            if (healthArr[0] !== "") {
                let sql = "INSERT INTO pet_illness (pet_id, illness_category_id) VALUES ";
                let saveData = [];
                for (let i=0; i<healthArr.length; i++) {
                    if (i === 0) {
                        sql += "(?, ?)";
                        saveData.push(req.body.id, healthArr[i]);
                    } else {
                        sql += ", (?, ?)";
                        saveData.push(req.body.id, healthArr[i]);
                    }
                };
                petHealthResult = await connection.execute(sql, saveData);
            }
        } else {petHealthResult = "健康資料無修改"};
        // console.log("petHealthResult", petHealthResult);
        if (editResult && 
            petVaccResult.length && 
            petHealthResult.length) {
            res.json({message: "ok"});
        } else {
            res.status(400).json({message: "錯誤"});
        };
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
        const addPetTime = moment().format("YYYY-MM-DD kk:mm:ss");
        // 判斷年齡類別
        let ageCate = 0; // 根據生日判斷 age category
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
        // console.log("addPetResult:", addPetResult);
        const newPetId = addPetResult.insertId;
        // 改用 addPetResult 內提供的 InsertId 即可!!
        // 將身高 體重 疫苗 健康資訊 存入對應的 TABLE
        // pet_height, pet_weight, vaccination, pet_illness
        // pet_height
        let petHeightResult = [];
        if (req.body.height.length) {
            petHeightResult = await connection.execute("INSERT INTO pet_height (pet_id, height, created_at) VALUES (?, ?, ?)", [newPetId, req.body.height, addPetTime]);
        } else {petHeightResult = "無新增身高資料"};
        // pet_weight
        let petWeightResult = [];
        if (req.body.weight.length) {
            petWeightResult = await connection.execute("INSERT INTO pet_weight (pet_id, weight, created_at) VALUES (?, ?, ?)", [newPetId, req.body.weight, addPetTime]);
        } else {petWeightResult = "無新增體重資料"};
        // 處理 vaccine req
        let petVaccResult=[];
        if (req.body.vaccine.length > 0) {
            let vaccineArr = req.body.vaccine.split(",");
            let sql = "INSERT INTO vaccination (pet_id, vaccine_category_id) VALUES ";
            let saveData = [];
            for (let i = 0; i < vaccineArr.length; i++) {
                if (i === 0) {
                    sql += "(?, ?)";
                    saveData.push(newPetId, vaccineArr[i]);
                } else {
                    sql += ", (?, ?)";
                    saveData.push(newPetId, vaccineArr[i]);
                }
            };
            petVaccResult = await connection.execute(sql, saveData);
        } else {petVaccResult = "無新增疫苗資料"};
        // 處理 illness req
        let petHealthResult=[];
        if (req.body.health.length > 0) {
            let healthArr = req.body.health.split(",");
            let sql = "INSERT INTO pet_illness (pet_id, illness_category_id) VALUES ";
            let saveData = [];
            for (let i=0; i<healthArr.length; i++) {
                if (i === 0) {
                    sql += "(?, ?)";
                    saveData.push(newPetId, healthArr[i]);
                } else {
                    sql += ", (?, ?)";
                    saveData.push(newPetId, healthArr[i]);
                }
            };
            petHealthResult = await connection.execute(sql, saveData);
        } else {petHealthResult="無新增健康資料"};
        // console.log(addPetResult);
        if (addPetResult && 
            petVaccResult.length && 
            petHealthResult.length && 
            petHeightResult.length && 
            petWeightResult.length) {
            res.json({message: "ok"});
        } else {
            res.status(400).json({message: "錯誤"});
        };
    });

module.exports = router;