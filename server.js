const express = require("express");
require("dotenv").config();
const app = express();
const path = require("path");
const checkRole = require("./middleware/check-role");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

app.use(express.static(path.join(__dirname, "public")));

const dbfile = require("./connection");

const routesC = require("./ruoutes/clothes");
const routesA = require("./ruoutes/auth");

//body parse
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/clothes", routesC);
app.use("/api/user",routesA);
app.use("/api/users", checkRole, require("./ruoutes/users"));

app.listen(process.env.PORT || 5000, function () {
  console.log("Encendido");
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
