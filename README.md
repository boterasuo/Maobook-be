# Maobook 爪爪日記 (back-end)

### 專案說明

詳見 [Maobook-fe](https://github.com/boterasuo/Maobook_fe) 內文說明

後端主要使用 Node.js 的 Express.js 框架實作

-   /routers：各項功能之 RESTful API
-   /sessions：儲存已登入使用者的 session 資料
-   /public：儲存使用者上傳之靜態圖片檔案 (/uploads) 或網頁中使用的商品圖 (products)

### 協作者 & 負責功能之 routers

[boterasuo](https://github.com/boterasuo) (本帳)：會員、數據管理相關功能

-   會員註冊 / 登入：/auth.js
-   會員資料 CRUD：/member.js
-   寵物資料 CRUD：/pet.js

[Eutene](https://github.com/Eutene)：行事曆、串接 email 相關功能

-   行事曆日曆：/calendarE.js
-   行事曆筆記：/calendarNote.js
-   行事曆撈事件資料：/calendarPost.js
-   行事曆建立事件：/calendarForm.js

[Anun](https://github.com/Ben-Buli)：社群文章相關功能

-   社群心得文：/daily.js
-   社群討論文：/discuss.js

[syuan](https://github.com/dummiss)：電商、購物車相關功能

-   商品相關：/store.js
-   訂單相關：/order.js

[Chris Tang](https://github.com/Tangent0610)：互助接案相關功能

-   互助功能相關：/help.js
