var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const expressSession = require("express-session");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(flash());
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "secret",
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  userModel.findById(id, function (err, user) {
    done(err, user);
  });
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

module.exports = app;
