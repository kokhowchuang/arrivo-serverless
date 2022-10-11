const serverless = require("serverless-http");
const express = require("express");
var bodyParser = require("body-parser");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

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

app.get("/users", async (req, res, next) => {
  try {
    const results = await mysql.query("SELECT * FROM arrivo.User");
    await mysql.end();

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/users", async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body cannot be empty." });
    }

    const body = [];
    Object.entries(req.body).forEach((entry) => {
      body.push("?");
    });

    const results = await mysql.query(
      "INSERT INTO arrivo.User( " +
        Object.keys(req.body).join(",") +
        " ) VALUES ( " +
        body.join(",") +
        " )",
      Object.values(req.body)
    );
    await mysql.end();

    return res.status(200).json();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/users/:id", async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body cannot be empty." });
    }

    const body = [];

    for (const [key, value] of Object.entries(req.body)) {
      body.push(key + " = ?");
    }

    const results = await mysql.query(
      "UPDATE arrivo.User SET " +
        body.join(", ") +
        " WHERE UserID = " +
        req.params.id,
      Object.values(req.body)
    );
    await mysql.end();

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({ message: "User record updated." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.patch("/users/:id/membership", async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body cannot be empty." });
    }

    const allowedMembership = ["Normal", "Premium"];
    if (allowedMembership.indexOf(req.body.Membership) < 0) {
      return res
        .status(400)
        .json({ error: "Membership can only be normal or premium." });
    }

    const results = await mysql.query(
      "UPDATE arrivo.User SET Membership = ? WHERE UserID = " + req.params.id,
      Object.values(req.body)
    );
    await mysql.end();

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({
      message: `Membership changed`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/categories", async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body cannot be empty." });
    }

    const body = [];
    Object.entries(req.body).forEach((entry) => {
      body.push("?");
    });

    const results = await mysql.query(
      "INSERT INTO arrivo.categories( " +
        Object.keys(req.body).join(",") +
        " ) VALUES ( " +
        body.join(",") +
        " )",
      Object.values(req.body)
    );
    await mysql.end();

    return res.status(200).json();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/posts", async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body cannot be empty." });
    }

    const body = [];
    Object.entries(req.body).forEach((entry) => {
      body.push("?");
    });

    const results = await mysql.query(
      "INSERT INTO arrivo.Post( " +
        Object.keys(req.body).join(",") +
        " ) VALUES ( " +
        body.join(",") +
        " )",
      Object.values(req.body)
    );
    await mysql.end();

    return res.status(200).json();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
