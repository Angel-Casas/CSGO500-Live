const express = require("express");
const bodyParser = require("body-parser");
const db = require("./models");
const cors = require('cors');
const path = require("path");
const { connect } = require('./controllers/wheel');
const WheelSchema = require('./models/wheel.model.js');

const app = express();

require("dotenv").config({
    path: path.join(__dirname, "/env/", ".env")
});


// CORS
const corsOptions = {
    origin: 'https://casinosimulator.netlify.app/'
};

app.use(cors(corsOptions));

// MONGOOSE CONNECTION
db.mongoose
    .connect(db.url, db.mongoOptions)
    .then(() => {
        // Success
        console.log("Successfully connected to Mongo Database.");
        connect();
    })
    .catch((err) => {
        console.error("Something went wrong.", err);
        process.exit();
    });

// MIDDLEWARE
// Parse requests of content-type - application/json
app.use(bodyParser.json({ limit: "50mb" }));
// Parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const port = process.env.PORT || 8070;

if (process.env.NODE_ENV !== "test") {
    app.listen(port, () => {
        console.log(`Listening on port ${port}.`);
    });
}

module.exports = app;