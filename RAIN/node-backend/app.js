var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var mongoose = require("mongoose");
var mongoHost = "";
if (process.env.NODE_ENV === "development") {
  mongoHost = "server";
} else {
  mongoHost = "mongo-container";
}
var mongoDB = "mongodb://" + mongoHost + ":27017/backend";
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/userRoutes");
var landmarksRouter = require("./routes/landmarkRoutes");
var userActivitiesRouter = require("./routes/userActivityRoutes");
var sensorDataRouter = require("./routes/sensorDataRoutes");
var adminRouter = require("./routes/adminRoutes"); // 🚀 added admin routes

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

var session = require("express-session");
var MongoStore = require("connect-mongo");
app.use(
  session({
    secret: "work hard",
    resave: true,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoDB }),
  })
);

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

// Routes
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/landmarks", landmarksRouter);
app.use("/userActivities", userActivitiesRouter);
app.use("/sensorData", sensorDataRouter);
app.use("/admin", adminRouter); // 🚀 mounted admin router

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
