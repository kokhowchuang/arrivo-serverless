const { expressjwt: jwt } = require("express-jwt");
const jwks = require("jwks-rsa");
const mysql = require("serverless-mysql")();

const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://dev-ba9k-wqm.us.auth0.com/.well-known/jwks.json",
  }),
  audience: "https://arrivotest.com",
  issuer: "https://dev-ba9k-wqm.us.auth0.com/",
  algorithms: ["RS256"],
});

mysql.config({
  host: process.env.ENDPOINT,
  database: process.env.DATABASE,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
});

module.exports = {
  checkJwt,
  mysql,
};
