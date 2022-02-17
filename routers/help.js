const express = require ("express");
const helpRouter = express.Router();
const connection = require("../utilis/db");

helpRouter.get("/api/assistance", async (req, res) => {
    const [data] = await connection.execute(
        `SELECT * FROM Case_give WHERE status=0 AND time= ${req.query.date}`);
    console.log(data);
    res.json(data);
  });

module.exports = helpRouter;