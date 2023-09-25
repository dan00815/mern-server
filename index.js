const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const authRoute = require("./Routes").auth;
const courseRoute = require("./Routes").course;
const passport = require("passport");
require("./config/passport")(passport);
const cors = require("cors");

mongoose
  .connect(process.env.MONGODB_CONNECTION)
  .then(() => {
    console.log("成功連結至mongoDB");
  })
  .catch((e) => {
    console.log(e);
  });

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", authRoute);

//courseRoute應該被jwt保護，若request無jwt會被視為unauthorization
app.use(
  "/api/courses",
  passport.authenticate("jwt", { session: false }), //middleware
  courseRoute
);

app.listen(8080, () => {
  console.log("後端伺服器聆聽port 8080．．．");
});
