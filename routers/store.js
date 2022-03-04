const express = require("express");
const router = express.Router();
const connection = require("../utils/db"); //資料庫連線資訊
const { checkLogin } = require("../middlewares/auth");
const introConverter = require("../utils/introConverter");
const { query } = require("../utils/db");

router.use(checkLogin);//檢查會員登入狀態
//產品與圖片join語法
let SQLimage = `SELECT products.*, product_images.image  FROM products LEFT JOIN product_images ON products.id=product_images.product_id `;


// "/api/store/petlist" 產品推薦區
router.get("/petlist", async (req, res, next) => { //從資料庫抓出會員ID的寵物清單(包含詳細資料)
  let [petList] = await connection.execute("SELECT * FROM pets WHERE user_id=?", [req.session.member.id]);
  // console.log("memberID:", req.session.member.id);
  // console.log("剛抓出來時：", petList);

  // 開始處理介紹資料，utils工具
  let processIntroData = introConverter.convertIntro(petList);
  // console.log("轉換後:",processIntroData);
  let processIllness = await introConverter.convertIllness(processIntroData, connection);
  // console.log("疾病轉換後:", processIllness);


  res.json(processIllness);
// res.json(req.session.member.id)
});


// "/api/store/recomProduct"
// router.get("/recomProduct", async(req, res, next) => { //從資料庫抓

//   let [illness] = await connection.execute( "SELECT illness_category_id FROM pet_illness WHERE pet_id =? ");

//   res.json();
// });



// let illness = select illness_category_id from pet_illness where pet_id = 1;

// let product_ids = select * from product_illness where illness_category_id in illness

// select * from products where id IN product_ids and pet_category_id = 1


// "/api/store/productlist?page=${page}&search=${value1}&animal=${filter}&checkedPet=${checkedPet}&checkedProduct=${checkedProduct}&checkedBrand=${checkedBrand}" 產品列表區




router.get("/productlist", async (req, res, next) => {


  let filter = req.query.animal;//篩選bar 狗跟貓判斷值
  //篩選bar
  let checkState = req.query.checkState
  // let checkedPet = req.query.checkedPet;
  // let checkedProduct = req.query.checkedProduct;
  // let checkedBrand = req.query.checkedBrand;

  if (req.query.search != '') {

    let filter = req.query.animal;//篩選bar 狗跟貓判斷值
    let page = req.query.page || 1;// 取得目前在req.query.page <- 第幾頁，如果沒有設定 req.quyer.page，那就設成 1
    let searchValue = req.query.search;
    let [total] = await connection.execute(`SELECT COUNT(*) AS total FROM products WHERE name LIKE '%${searchValue}%'`);
    total = total[0].total;// 取得目前的總筆數
    const perPage = 6; // 計算總共應該要有幾頁
    const lastPage = Math.ceil(total / perPage);// lastPage: 總共有幾頁
    let offset = (page - 1) * perPage;// 計算 SQL 要用的 offset
    let [data] = await connection.execute(`${SQLimage} WHERE name LIKE '%${searchValue}%' group by products.id LIMIT ? OFFSET ?`,
      [perPage, offset]
    );// 取得資料 

    //篩選Bar的checkbox值
    let [filterPet] = await connection.execute(`SELECT id,name From pet_category WHERE name LIKE '%${filter}%'`);
    let [filterProduct] = await connection.execute(`SELECT id,name From product_category WHERE name LIKE '%${filter}%'`);
    let [filterBrand] = await connection.execute(`SELECT id,name From brand_category`);

    // 準備要 response
    res.json({
      pagination: { total, perPage, page, lastPage },
      data,
      filterPet,
      filterProduct,
      filterBrand
    });
  }

  //篩選bar個別判斷是否有點選

  else if (checkState) {

    let page = req.query.page || 1;
    let [total] = await connection.execute(`SELECT COUNT(*) AS total FROM products WHERE pet_category_id IN(${checkedPet}) AND product_category_id IN(${checkedProduct})  AND brand_category_id IN(${checkedBrand})`);
    total = total[0].total;// 取得目前的總筆數
    const perPage = 6; // 計算總共應該要有幾頁
    const lastPage = Math.ceil(total / perPage);// lastPage: 總共有幾頁
    let offset = (page - 1) * perPage;// 計算 SQL 要用的 offset
    // let [data] = await connection.execute(`${SQLimage} WHERE pet_category_id IN(${checkedPet}) AND product_category_id IN(${checkedProduct})  AND brand_category_id IN (${checkedBrand}) group by products.id LIMIT ? OFFSET ?`, [perPage, offset]
    // );// 取得資料 

    //待測試
    const group = [`group by products.id LIMIT ? OFFSET ?`]
    // SQLimage = SQLimage + ' ' + group
    console.log("YYYYYYYY",checkState)
    let [data] = await connection.execute(checkState + group, [perPage, offset]);



    //篩選Bar的checkbox值
    let [filterPet] = await connection.execute(`SELECT id,name From pet_category WHERE name LIKE '%${filter}%'`);
    let [filterProduct] = await connection.execute(`SELECT id,name From product_category WHERE name LIKE '%${filter}%'`);
    let [filterBrand] = await connection.execute(`SELECT id,name From brand_category`);

    // 準備要 response
    res.json({
      pagination: { total, perPage, page, lastPage },
      data,
      filterPet,
      filterProduct,
      filterBrand
    });
  }




  else {
    //全部產品
    //分頁用
    let page = req.query.page || 1;
    let [total] = await connection.execute(`SELECT COUNT(*) AS total FROM products`);
    total = total[0].total;// 取得目前的總筆數
    const perPage = 6; // 計算總共應該要有幾頁
    const lastPage = Math.ceil(total / perPage);// lastPage: 總共有幾頁
    let offset = (page - 1) * perPage;// 計算 SQL 要用的 offset
    let [data] = await connection.execute(`${SQLimage} group by products.id LIMIT ? OFFSET ?`,
      [perPage, offset]
    );
    //篩選Bar的checkbox值
    let [filterPet] = await connection.execute(`SELECT id,name From pet_category WHERE name LIKE '%${filter}%'`);
    let [filterProduct] = await connection.execute(`SELECT id,name From product_category WHERE name LIKE '%${filter}%'`);
    let [filterBrand] = await connection.execute(`SELECT id,name From brand_category`);

    // 準備要 response
    res.json({
      pagination: { total, perPage, page, lastPage },
      data,
      filterPet,
      filterProduct,
      filterBrand
    });
  }


});


//吃飯飯分類
router.get("/productlist/food", async (req, res, next) => {
  let filter = req.query.animal;//篩選bar 狗跟貓判斷值
  //篩選bar
  let checkedPet = req.query.checkedPet;
  let checkedProduct = req.query.checkedProduct;
  let checkedBrand = req.query.checkedBrand;


  let page = req.query.page || 1;
  let [total] = await connection.execute("SELECT COUNT(*) AS total FROM products WHERE product_category_id IN ('1','2','5','6')");
  total = total[0].total;

  const perPage = 6;
  const lastPage = Math.ceil(total / perPage);

  let offset = (page - 1) * perPage;
  let [data] = await connection.execute(`${SQLimage} WHERE product_category_id IN ('1','2','5','6') group by products.id LIMIT ? OFFSET ?`,
    [perPage, offset]
  );


  //篩選Bar的checkbox值
  let [filterPet] = await connection.execute(`SELECT id,name From pet_category WHERE name LIKE '%${filter}%'`);
  let [filterProduct] = await connection.execute(`SELECT id,name From product_category WHERE name LIKE '%${filter}%'`);
  let [filterBrand] = await connection.execute(`SELECT id,name From brand_category`);

  res.json({
    pagination: { total, perPage, page, lastPage },
    data,
    filterPet,
    filterProduct,
    filterBrand
  });
});


//吃點心分類
router.get("/productlist/snack", async (req, res, next) => {
  let filter = req.query.animal;//篩選bar 狗跟貓判斷值
  //篩選bar
  let checkedPet = req.query.checkedPet;
  let checkedProduct = req.query.checkedProduct;
  let checkedBrand = req.query.checkedBrand;

  let page = req.query.page || 1;

  let [total] = await connection.execute("SELECT COUNT(*) AS total FROM products WHERE product_category_id IN ('3','7')");
  total = total[0].total;

  const perPage = 6;
  const lastPage = Math.ceil(total / perPage);

  let offset = (page - 1) * perPage;
  let [data] = await connection.execute(`${SQLimage} WHERE product_category_id IN ('3','7') group by products.id LIMIT ? OFFSET ?`,
    [perPage, offset]
  );

  //篩選Bar的checkbox值
  let [filterPet] = await connection.execute(`SELECT id,name From pet_category WHERE name LIKE '%${filter}%'`);
  let [filterProduct] = await connection.execute(`SELECT id,name From product_category WHERE name LIKE '%${filter}%'`);
  let [filterBrand] = await connection.execute(`SELECT id,name From brand_category`);

  res.json({
    pagination: { total, perPage, page, lastPage },
    data,
    filterPet,
    filterProduct,
    filterBrand
  });
});

//玩玩具分類
router.get("/productlist/toy", async (req, res, next) => {
  let filter = req.query.animal;//篩選bar 狗跟貓判斷值
  //篩選bar
  let checkedPet = req.query.checkedPet;
  let checkedProduct = req.query.checkedProduct;
  let checkedBrand = req.query.checkedBrand;

  let page = req.query.page || 1;

  let [total] = await connection.execute("SELECT COUNT(*) AS total FROM products WHERE product_category_id IN ('4','8')");
  total = total[0].total;

  const perPage = 6;
  const lastPage = Math.ceil(total / perPage);

  let offset = (page - 1) * perPage;
  let [data] = await connection.execute(`${SQLimage} WHERE product_category_id IN ('4','8') group by products.id LIMIT ? OFFSET ?`,
    [perPage, offset]
  );

  //篩選Bar的checkbox值
  let [filterPet] = await connection.execute(`SELECT id,name From pet_category WHERE name LIKE '%${filter}%'`);
  let [filterProduct] = await connection.execute(`SELECT id,name From product_category WHERE name LIKE '%${filter}%'`);
  let [filterBrand] = await connection.execute(`SELECT id,name From brand_category`);

  res.json({
    pagination: { total, perPage, page, lastPage },
    data,
    filterPet,
    filterProduct,
    filterBrand
  });
});


module.exports = router;


