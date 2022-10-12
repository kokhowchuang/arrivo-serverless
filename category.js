const express = require("express");
const router = express.Router();
const { checkJwt, mysql } = require("./config");

router.get("/categories", [checkJwt], async function (req, res, next) {
  try {
    const limit = req.query.limit || 10;
    const page = parseInt(req.query.page) - 1 || 0;

    const results = await mysql.query(
      `SELECT * FROM arrivo.Category LIMIT ${limit} OFFSET ${page}`
    );
    await mysql.end();

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/categories", [checkJwt], async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body cannot be empty." });
    }

    const body = [];
    Object.entries(req.body).forEach((entry) => {
      body.push("?");
    });

    const results = await mysql.query(
      "INSERT INTO arrivo.Category( " +
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

module.exports = router;