const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const WheelSchema = require('../models/wheel.model.js');

const MongoClient = require("mongodb").MongoClient;

const MONGO_DB_URI = process.env.MONGO_DB_URI;
const DB_NAME = process.env.DB_NAME;

let cachedDb = null;

const connectToDatabase = async (uri) => {
  if (cachedDb) return cachedDb;

  const client = await MongoClient.connect(uri, {
    useUnifiedTopology: true,
  });

  cachedDb = client.db(DB_NAME);

  return cachedDb;
};

const queryDatabase = async (db) => {
  const results = await db.collection("wheels").find({}).toArray();

  console.log("Results:");
  console.log(results);

  return results;
};

module.exports.handler = async (event, context) => {
  // otherwise the connection will never complete, since
  // we keep the DB connection alive
  context.callbackWaitsForEmptyEventLoop = false;
  context.timeout = 30000;

  const db = await connectToDatabase(MONGO_DB_URI);
  const results = await queryDatabase(db);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
    body: JSON.stringify(results)
  };
};

const app = express();


// CORS
const corsOptions = {
    origin: ["https://casinosimulator.netlify.app/", "http://localhost:3000"]
};

app.use(cors(corsOptions));

// MIDDLEWARE
// Parse requests of content-type - application/json
app.use(bodyParser.json({ limit: "50mb" }));
// Parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ limit: "50mb", extended: true }));


// ROUTES
app.get('/wheels/latest', async (req, res) => {
  try {
    const lastWheel = await WheelSchema.findOne().sort({ nonce: -1 }).exec();
    console.log("SENDING");
    res.send(lastWheel);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

app.get('/wheels', async (req, res) => {
  const results = await WheelSchema.find().sort({ nonce: -1 }).limit(100);
  res.json(results);
});