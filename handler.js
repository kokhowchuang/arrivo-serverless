const serverless = require("serverless-http");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");

const userRouter = require("./user");
const categoryRouter = require("./category");
const postRouter = require("./post");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

app.use(cors());

app.get("/", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from root!",
  });
});

app.use("/", userRouter);
app.use("/", categoryRouter);
app.use("/", postRouter);

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
