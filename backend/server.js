const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
import { rootRouter } from "./routes/index.js";

app.use(cors());
app.use(express.json());

app.use("/api/v1", rootRouter);

app.listen(port, () => {
  console.log(` Server is active on port : ${port}`);
});
