const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const db = require("../models");
const cors = require('cors');
const { connect } = require('../controllers/wheel');
const WheelSchema = require('../models/wheel.model.js');

const app = express();


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

app.get('/api/wheels/latest', async (req, res) => {
    try {
      const lastWheel = await WheelSchema.findOne().sort({ nonce: -1 }).exec();
      console.log("SENDING");
      res.send(lastWheel);
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });


// Export app as a Netlify function
exports.handler = serverless(app);