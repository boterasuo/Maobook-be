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
router.get("/recomProduct", async (req, res, next) => { //從資料庫抓
  if (req.query.petID) {
    petID = req.query.petID
    //先抓出寵物的疾病ID
    let [illnessID] = await connection.execute("SELECT illness_category_id FROM pet_illness WHERE pet_id=?", [petID]);
    console.log("illnessID", illnessID)
    if (illnessID.length > 0) {
      //轉成字串
      let newillnessID = illnessID.map((d) => {
        return (d.illness_category_id).toString()
      })
      //再從疾病產品中，找出包含這些疾病ID的產品
      let [Rrecomproduct] = await connection.execute(`SELECT * FROM product_illness WHERE illness_category_id IN (${newillnessID})`);
      // console.log("Rrecomproduct", Rrecomproduct)

      //再從商品中計算重複的次數，藉此找出在最符合的前三名
      //1.先計算每個商品出現的次數
      var result = [];
      Rrecomproduct.reduce(function (res, value) {
        if (!res[value.product_id]) {
          res[value.product_id] = { product_id: value.product_id, count: 0 };
          result.push(res[value.product_id])
        }
        res[value.product_id].count += 1;
        return res;
      }, {});
      console.log("count", result)

      //2. 按照次數由大到小排序，藉此找出前三個最符合的商品
      let newresult =
        (result.sort(function (a, b) {
          return a.count < b.count ? 1 : -1;
        })).map((d) => { return (d.product_id).toString() })
      console.log("max3", newresult)


      //3.進資料庫搜尋
      let [finalresult] = await connection.execute(`${SQLimage}  WHERE id IN (${newresult[0]},${newresult[1]},${newresult[2]}) group by products.id`)
      console.log("finalresult", finalresult)

      res.json(finalresult);
    }
    return;
  } else {
    return;
  }
});




// "/api/store/productlist?page=${page}&search=${value1}&animal=${filter}&checkedPet=${checkedPet}&checkedProduct=${checkedProduct}&checkedBrand=${checkedBrand}" 產品列表區
router.get("/productlist", async (req, res, next) => {
  let searchValue = req.query.search;//搜尋bar value
  let page = req.query.page || 1;// 取得目前在req.query.page <- 第幾頁，如果沒有設定 req.quyer.page，那就設成 1

  //篩選bar
  let filter = req.query.animal;//篩選bar 狗跟貓判斷值
  let checkedPet = req.query.checkedPet;
  let checkedProduct = req.query.checkedProduct;
  let checkedBrand = req.query.checkedBrand;


  //串接篩選bar的SQL語法
  const where = []

  if (checkedPet) {
    where.push(`pet_category_id IN (${checkedPet})`)
  }
  if (checkedProduct) {
    where.push(`product_category_id IN (${checkedProduct})`)
  }
  if (checkedBrand) {
    where.push(`brand_category_id IN (${checkedBrand})`)
  }
  let filterSQL = ""
  filterSQL += where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
  // console.log(filterSQL)


  //篩選Bar的checkbox值
  let [filterPet] = await connection.execute(`SELECT id,name From pet_category WHERE name LIKE '%${filter}%'`);
  let [filterProduct] = await connection.execute(`SELECT id,name From product_category WHERE name LIKE '%${filter}%'`);
  let [filterBrand] = await connection.execute(`SELECT id,name From brand_category`);


  //收尋bar
  if (searchValue != '') {
    let [total] = await connection.execute(`SELECT COUNT(*) AS total FROM products WHERE name LIKE '%${searchValue}%'`);
    total = total[0].total;// 取得目前的總筆數
    const perPage = 6; // 計算總共應該要有幾頁
    const lastPage = Math.ceil(total / perPage);// lastPage: 總共有幾頁
    let offset = (page - 1) * perPage;// 計算 SQL 要用的 offset
    // 取得資料 
    let [data] = await connection.execute(`${SQLimage} WHERE name LIKE '%${searchValue}%' group by products.id LIMIT ? OFFSET ?`,
      [perPage, offset]
    );

    // 準備要 response
    res.json({
      pagination: { total, perPage, page, lastPage },
      data,
      filterPet,
      filterProduct,
      filterBrand
    });
  }


  //篩選bar
  else if (filterSQL !== '') {

    //計算分頁
    let [total] = await connection.execute(`SELECT COUNT(*) AS total FROM products ` + filterSQL);
    total = total[0].total;// 取得目前的總筆數
    const perPage = 6; // 計算總共應該要有幾頁
    const lastPage = Math.ceil(total / perPage);// lastPage: 總共有幾頁
    let offset = (page - 1) * perPage;// 計算 SQL 要用的 offset

    // 取得商品資料
    let [data] = await connection.execute(SQLimage + filterSQL + 'group by products.id LIMIT ? OFFSET ?', [perPage, offset]
    );

    // 準備要 response
    res.json({
      pagination: { total, perPage, page, lastPage },
      data,
      filterPet,
      filterProduct,
      filterBrand
    });
  }


  //如果沒有，顯示全部產品
  else {
    //分頁用
    let [total] = await connection.execute(`SELECT COUNT(*) AS total FROM products`);
    total = total[0].total;// 取得目前的總筆數
    const perPage = 6; // 計算總共應該要有幾頁
    const lastPage = Math.ceil(total / perPage);// lastPage: 總共有幾頁
    let offset = (page - 1) * perPage;// 計算 SQL 要用的 offset

    //取得商品資料 
    let [data] = await connection.execute(`${SQLimage} group by products.id LIMIT ? OFFSET ?`,
      [perPage, offset]
    );

    // 準備要 response
    res.json({
      pagination: { total, perPage, page, lastPage },
      data,
      filterPet,
      filterProduct,
      filterBrand
    });
  }

});//router:/productlist  end




//吃飯飯分類
router.get("/productlist/food", async (req, res, next) => {
  //分頁
  let page = req.query.page || 1;
  let [total] = await connection.execute("SELECT COUNT(*) AS total FROM products WHERE product_category_id IN ('1','2','5','6')");
  total = total[0].total;
  const perPage = 6;
  const lastPage = Math.ceil(total / perPage);
  let offset = (page - 1) * perPage;

  //抓商品資料
  let [data] = await connection.execute(`${SQLimage} WHERE product_category_id IN ('1','2','5','6') group by products.id LIMIT ? OFFSET ?`,
    [perPage, offset]
  );

  //抓取篩選Bar的checkbox值
  let filter = req.query.animal;//篩選bar 狗跟貓判斷值
  let [filterPet] = await connection.execute(`SELECT id,name From pet_category WHERE name LIKE '%${filter}%'`);
  let [filterProduct] = await connection.execute(`SELECT id,name From product_category WHERE name LIKE '%${filter}%'`);
  let [filterBrand] = await connection.execute(`SELECT id,name From brand_category`);

  //回傳前端
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
  //分頁
  let page = req.query.page || 1;
  let [total] = await connection.execute("SELECT COUNT(*) AS total FROM products WHERE product_category_id IN ('3','7')");
  total = total[0].total;
  const perPage = 6;
  const lastPage = Math.ceil(total / perPage);
  let offset = (page - 1) * perPage;

  //抓商品資料
  let [data] = await connection.execute(`${SQLimage} WHERE product_category_id IN ('3','7') group by products.id LIMIT ? OFFSET ?`,
    [perPage, offset]
  );

  //抓取篩選Bar的checkbox值
  let filter = req.query.animal;//篩選bar 狗跟貓判斷值
  let [filterPet] = await connection.execute(`SELECT id,name From pet_category WHERE name LIKE '%${filter}%'`);
  let [filterProduct] = await connection.execute(`SELECT id,name From product_category WHERE name LIKE '%${filter}%'`);
  let [filterBrand] = await connection.execute(`SELECT id,name From brand_category`);

  //回傳前端
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

  //分頁
  let page = req.query.page || 1;
  let [total] = await connection.execute("SELECT COUNT(*) AS total FROM products WHERE product_category_id IN ('4','8')");
  total = total[0].total;
  const perPage = 6;
  const lastPage = Math.ceil(total / perPage);
  let offset = (page - 1) * perPage;

  //抓商品資料
  let [data] = await connection.execute(`${SQLimage} WHERE product_category_id IN ('4','8') group by products.id LIMIT ? OFFSET ?`,
    [perPage, offset]
  );

  //抓取篩選Bar的checkbox值
  let filter = req.query.animal;//篩選bar 狗跟貓判斷值
  let [filterPet] = await connection.execute(`SELECT id,name From pet_category WHERE name LIKE '%${filter}%'`);
  let [filterProduct] = await connection.execute(`SELECT id,name From product_category WHERE name LIKE '%${filter}%'`);
  let [filterBrand] = await connection.execute(`SELECT id,name From brand_category`);

  //回傳前端
  res.json({
    pagination: { total, perPage, page, lastPage },
    data,
    filterPet,
    filterProduct,
    filterBrand
  });
});


//商品細節頁圖片
router.get("/productdetails", async (req, res, next) => {
  if (req.query.id) {
    //抓商品資料
    let [AllImg] = await connection.execute(`SELECT image From product_images WHERE product_id=?`, [req.query.id]
    );
    console.log("allimg", AllImg)
    res.json(AllImg);
  }
});



module.exports = router;


