const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const logger = require("morgan");
const errors = require("./utils/response/errors");

const app = express();

// GLOBAL MIDDLEWARE
app.use(helmet());
app.use(cors(require("./config/cors")));
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

// LOGGER
if (process.env.NODE_ENV !== "production") app.use(logger("dev"));

// STATIC FOLDER
app.use(express.static(path.join(__dirname, "public")));

// ROUTES
app.use(require("./routes"));

// NOT FOUND HANDLER
app.all("*", function (req, res, next) {
  next(errors.routeNotFound());
});


// GLOBAL ERROR HANDLER
app.use(require("./middleware/globalErrorHandler"));

module.exports = app;
