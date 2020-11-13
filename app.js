require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// Setting session
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Setting passport
app.use(passport.initialize());
// Setting passport untuk mengatur session
app.use(passport.session());

mongoose.connect(
  "mongodb://localhost:27017/userDB",
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) =>
    err ? res.send(err) : console.log("Succesfully connected to mongoose")
);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

// menggunakan plugin local mongoose yang digunakan untuk hash & salt password
userSchema.plugin(passportLocalMongoose);

const UserModel = new mongoose.model("User", userSchema);

// digunakan untuk authenticate user dari username dan password
passport.use(UserModel.createStrategy());
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/secrets");
  } else {
    res.render("login");
  }
});

app.post("/register", (req, res) => {
  UserModel.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () =>
          res.redirect("/secrets")
        );
      }
    }
  );
});

app.post("/login", (req, res) => {
  const user = new UserModel({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => res.redirect("/secrets"));
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Sucessfully running server")
);
