const express = require("express");
const router = express.Router();
const {
  mysql,
  checkJwt,
  checkAdminScopes,
  checkProtectedScopes,
} = require("./config");

router.get("/posts", checkJwt, async function (req, res, next) {
  try {
    const limit = req.query.limit || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = limit * page - limit;

    let whereClause = "";

    whereClause +=
      typeof req.query.status !== "undefined"
        ? `WHERE Status = '${req.query.status}'`
        : "";

    const query = `SELECT * FROM arrivo.Post ${whereClause} LIMIT ${limit} OFFSET ${offset}`;

    const results = await mysql.query(query);
    await mysql.end();

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/posts", checkJwt, checkAdminScopes, async (req, res, next) => {
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

router.put("/posts/:id", checkJwt, checkAdminScopes, async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body cannot be empty." });
    }

    const body = [];

    for (const [key, value] of Object.entries(req.body)) {
      body.push(key + " = ?");
    }

    const results = await mysql.query(
      "UPDATE arrivo.Post SET " +
        body.join(", ") +
        " WHERE PostID = " +
        req.params.id,
      Object.values(req.body)
    );
    await mysql.end();

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found." });
    }

    return res.status(200).json({ message: "Post record updated." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
