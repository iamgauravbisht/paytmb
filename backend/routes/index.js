// backend/routes/index.js
const express = require("express");
const userRouter = require("./user");

const rootRouter = express.Router();

rootRouter.get("/", (req, res) => {
  res.send("Hello World!");
});

rootRouter.use("/user", userRouter);

module.exports = { rootRouter };
