const express = require("express");
require("dotenv").config();
const app = express();
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

app.use(express.static(__dirname + 'public'));

const dbfile = require("./connection");

const routesC = require("./ruoutes/clothes");

//body parse

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/clothes", routesC);

app.get("/", (req, res) => {
  res.end("funciona!");
});

app.listen(process.env.PORT || 5000, function () {
  console.log("Encendido");
});
