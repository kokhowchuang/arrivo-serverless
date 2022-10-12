const jwksRsa = require("jwks-rsa");
const mysql = require("serverless-mysql")();
const jwtAuthz = require("express-jwt-authz");
const jwt = require("express-jwt");

const { AUTH0_DOMAIN, AUDIENCE } = process.env;

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: AUDIENCE,
  issuer: `https://${AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
});

mysql.config({
  host: process.env.ENDPOINT,
  database: process.env.DATABASE,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
});

const checkAdminScopes = jwtAuthz(["create:user", "update:user"]);
const checkProtectedScopes = jwtAuthz(["create:user"], {
  customScopeKey: "permissions",
});

module.exports = {
  checkAdminScopes,
  checkProtectedScopes,
  mysql,
};
