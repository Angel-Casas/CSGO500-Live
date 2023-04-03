const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
// const db = require("../models");
const mongoose = require("mongoose");
const cors = require('cors');
const { connect } = require('../controllers/wheel');
const WheelSchema = require('../models/wheel.model.js');

const MongoClient = require("mongodb").MongoClient;

const MONGO_DB_URI = process.env.MONGO_DB_URI;
const DB_NAME = process.env.DB_NAME;

let cachedDb = null;

const connectToDatabase = async (uri) => {
  // we can cache the access to our database to speed things up a bit
  // (this is the only thing that is safe to cache here)
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

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(results),
  };
};

module.exports.handler = async (event, context) => {
  // otherwise the connection will never complete, since
  // we keep the DB connection alive
  context.callbackWaitsForEmptyEventLoop = false;

  const db = await connectToDatabase(MONGO_DB_URI);
  return queryDatabase(db);
};

// async function getData() {
//   const uri =
//     `${process.env.MONGO_DB_URI}/${process.env.DB_NAME}?retryWrites=true&w=majority`;
//   const client = new MongoClient(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   });

//   try {
//     await client.connect();
//     const test = await client
//       .db('CSGO500')
//       .collection('wheels')
//       .find({});
//     return test;
//   } catch (err) {
//     console.log(err); // output to netlify function log
//   } finally {
//     await client.close();
//   }
// }

// exports.handler = async function(event, context) {
//   try {
//     const data = await getData();
//     console.log("DATA:");
//     console.log(data);
//     return {
//       statusCode: 200,
//       body: JSON.stringify(data)
//     };
//   } catch (err) {
//     console.log(err); // output to netlify function log
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ msg: err.message }) 
//     };
//   }
// };

const app = express();


// CORS
const corsOptions = {
    origin: ["https://casinosimulator.netlify.app/", "http://localhost:3000"]
};

app.use(cors(corsOptions));

// const dbName = process.env.NODE_ENV === "test" ? process.env.DB_NAME_TEST : process.env.DB_NAME;
// const dbURI = process.env.NODE_ENV === "test" ? process.env.MONGO_DB_URI_TEST : process.env.MONGO_DB_URI;

// const connection = mongoose
//   .connect(`${dbURI}/${dbName}`, {
//     useNewUrlParser: true,
//     keepAlive: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("SUCCESS");
//     connect();
//   })
//   .catch((err) => {
//     console.error("Something went wrong", err)
//   });

// MONGOOSE CONNECTION
// db.mongoose
//     .connect(db.url, db.mongoOptions)
//     .then(() => {
//         // Success
//         console.log("Successfully connected to Mongo Database.");
//         connect();
//     })
//     .catch((err) => {
//         console.error("Something went wrong.", err);
//         process.exit();
//     });

// MIDDLEWARE
// Parse requests of content-type - application/json
app.use(bodyParser.json({ limit: "50mb" }));
// Parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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


// Export app as a Netlify function
// exports.handler = serverless(app);