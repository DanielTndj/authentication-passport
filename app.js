const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

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
  const user = new UserModel({
    username: req.body.username,
    password: req.body.password,
  });

  user.save((err) => (err ? console.log(err) : res.render("secrets")));
});

app.post("/login", (req, res) => {
  UserModel.findOne({ username: req.body.username }, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      if (result) {
        if (result.password === req.body.password) {
          res.render("secrets");
        }
      }
    }
  });
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Sucessfully running server")
);
