const serverless = require("serverless-http");
const express = require("express");
const app = express();

const mysql = require("serverless-mysql")();

mysql.config({
  host: process.env.ENDPOINT,
  database: process.env.DATABASE,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
});

app.get("/", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from root!",
  });
});

app.get("/hello", async (req, res, next) => {
  let results = await mysql.query("SELECT * FROM arrivo.User");

  // Run clean up function
  await mysql.end();

  // Return the results
  return res.status(200).json(results);

  // return res.status(200).json({
  //   message: "Hello from path!",
  // });
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
