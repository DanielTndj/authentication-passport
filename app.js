require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
// const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(
  "mongodb://localhost:27017/userDB",
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) =>
    err ? res.send(err) : console.log("Succesfully connected to mongoose")
);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const UserModel = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    const user = new UserModel({
      username: req.body.username,
      password: hash,
    });

    user.save((err) => (err ? console.log(err) : res.render("secrets")));
  });
});

app.post("/login", (req, res) => {
  UserModel.findOne({ username: req.body.username }, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      if (result) {
        bcrypt.compare(req.body.password, result.password, (err, result) => {
          if (!err) {
            !result ? console.log("Wrong password") : res.render('secrets')
          } else {
            console.log("Can't login");
          }
        });
      }
    }
  });
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Sucessfully running server")
);
