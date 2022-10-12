const serverless = require("serverless-http");
const express = require("express");
const bodyParser = require("body-parser");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const app = express();
const { expressjwt: jwt } = require("express-jwt");
const jwks = require("jwks-rsa");
const expressSession = require("express-session");
const jwtAuthz = require("express-jwt-authz");
const passport = require("passport");
const Auth0Strategy = require("passport-auth0");

const categoryRouter = require("./category");
const postRouter = require("./post");

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

const session = {
  secret: process.env.SESSION_SECRET,
  cookie: {},
  resave: false,
  saveUninitialized: false,
};

if (app.get("env") === "production") {
  // Serve secure cookies, requires HTTPS
  session.cookie.secure = true;
}

const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL,
  },
  function (accessToken, refreshToken, extraParams, profile, done) {
    /**
     * Access tokens are used to authorize users to an API
     * (resource server)
     * accessToken is the token to call the Auth0 API
     * or a secured third-party API
     * extraParams.id_token has the JSON Web Token
     * profile has all the information from the user
     */
    return done(null, profile);
  }
);

app.use(expressSession(session));

passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get("/", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from root!",
  });
});

const checkAdminScopes = jwtAuthz(["create:user", "update:user"]);

app.get("/users", async (req, res, next) => {
  try {
    const results = await mysql.query("SELECT * FROM arrivo.User");
    await mysql.end();

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/users", [checkJwt, checkAdminScopes], async (req, res, next) => {
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

app.put("/users/:id", [checkJwt, checkAdminScopes], async (req, res, next) => {
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

app.use("/", categoryRouter);
app.use("/", postRouter);

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
