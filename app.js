require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const googleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
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
  googleId: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const UserModel = new mongoose.model("User", userSchema);

passport.use(UserModel.createStrategy());
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  UserModel.findById(id, (err, user) => done(err, user));
});

passport.use(
  new googleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "http://www.googleapis.com/oauth2/v3/userinfo",
    },
    (accessToken, refreshToken, profile, cb) => {
      console.log(profile);
      UserModel.findOrCreate({ googleId: profile.id }, (err, user) => {
        return cb(err, user);
      });
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/auth/google", (req, res) => {
  try {
    console.log("sip");
    passport.authenticate("google", { scope: ["profile"] });
  } catch (error) {
    console.log("a", error);
  }
});

app.get("/auth/google/secrets", (req, res) => {
  try {
    console.log("mantap");
    passport.authenticate("google", { failureRedirect: "/login" }),
      (req, res) => {
        res.redirect("/secrets");
      };
  } catch (error) {
    console.log("b", error);
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  UserModel.find({ "secret": { $ne: null } }, (err, foundSecrets) => {
    if (err) {
      console.log(err);
    } else {
      if (foundSecrets) {
        res.render("secrets", { secrets: foundSecrets });
      }
    }
  });
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

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", (req, res) => {
  const secret = req.body.secret;

  UserModel.findById(req.user.id, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = secret;
        foundUser.save(() => {
          res.redirect("/secrets");
        });
      }
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
