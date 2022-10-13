const express = require("express");
const router = express.Router();
const {
  mysql,
  checkJwt,
  checkAdminScopes,
  checkProtectedScopes,
} = require("./config");

router.get("/users", checkJwt, checkAdminScopes, async (req, res, next) => {
  try {
    const results = await mysql.query("SELECT * FROM arrivo.User");
    await mysql.end();

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/users", checkJwt, checkAdminScopes, async (req, res, next) => {
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

router.put("/users/:id", checkJwt, checkAdminScopes, async (req, res, next) => {
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

router.patch("/users/:id/membership", async (req, res, next) => {
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

module.exports = router;
