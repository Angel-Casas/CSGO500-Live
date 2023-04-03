const dbConfig = require("../config/db.config.js");

const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;
db.url = dbConfig.url;
db.crash = require("./crash.model.js")(mongoose);
db.wheel = require("./wheel.model.js")(mongoose);

module.exports = db;