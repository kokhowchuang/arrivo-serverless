const express = require("express");
const router = express.Router();
const {
  mysql,
  checkJwt,
  checkAdminScopes,
  checkProtectedScopes,
} = require("./config");
const jwtAuthz = require("express-jwt-authz");
const {
  auth,
  requiredScopes,
  claimEquals,
  claimIncludes,
  claimCheck,
} = require("express-oauth2-jwt-bearer");

router.get("/categories", [checkJwt], async function (req, res, next) {
  try {
    const limit = req.query.limit || 10;
    const page = parseInt(req.query.page) - 1 || 0;

    const results = await mysql.query(
      `SELECT * FROM arrivo.Category LIMIT ${limit} OFFSET ${page}`
    );
    await mysql.end();
    console.log(req);
    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
