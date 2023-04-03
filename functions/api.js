const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
// const db = require("../models");
const mongoose = require("mongoose");
const cors = require('cors');
// const { connect } = require('../controllers/wheel');
const WheelSchema = require('../models/wheel.model.js');

const MongoClient = require("mongodb").MongoClient;

const MONGO_DB_URI = process.env.MONGO_DB_URI;
const DB_NAME = process.env.DB_NAME;
const socketUrl = 'wss://socket.500.casino/socket.io/?EIO=3&transport=websocket';
const socketOptions = {
    headers: {
        Origin: "https://500.casino"
    }
};
// const socketUrl = process.env.WS_URL;
// const socketOptions = { origin: process.env.ORIGIN };

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

// const queryDatabase = async (db) => {
//   const results = await db.collection("wheels").find({}).toArray();

//   console.log("Results:");
//   console.log(results);

//   return {
//     statusCode: 200,
//     headers: {
//       "Content-Type": "application/json",
//       "Access-Control-Allow-Origin": "*",
//       "Access-Control-Allow-Headers": "Content-Type",
//       "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
//     },
//     body: JSON.stringify(results),
//   };
// };

const createWheel = async (wheelData) => {
  const db = await connectToDatabase(MONGO_DB_URI);
  const result = await db.collection("wheels").insertOne(wheelData);

  console.log("Inserted wheel with ID: ", result.insertedId);

  return result;
};

const connect = () => {
  const wheelPingIntervalTime = 10000;
  let wheelPingInterval;

  const wheelSocket = new WebSocket(socketUrl, ["websocket"], socketOptions);

  console.log("[WHEEL] Connecting to WebSocket...");

  wheelSocket.on("open", () => {
    console.log("[WHEEL] Connected. Waiting for messages from WebSocket...");

    wheelPingInterval = setInterval(() => {
      if (wheelSocket.readyState === WebSocket.OPEN) {
        wheelSocket.send("2");
      }
    }, wheelPingIntervalTime);
  });

  wheelSocket.on("close", () => {
    console.log("[WHEEL] Disconnected.");

    clearInterval(wheelPingInterval);

    setTimeout(connect, 1000);
  });

  wheelSocket.on("message", async (data) => {
    data = data.toString();

    if (data.includes('42["round-end",')) {
      const roundResult = JSON.parse(
        data.replace('42["round-end",', "").slice(0, -1)
      );

      const wheelData = {
        roundId: roundResult.winner.roundId,
        nonce: roundResult.winner.nonce,
        startDate: roundResult.winner.startDate,
        endDate: roundResult.winner.endDate,
        random: roundResult.winner.random,
        result: WHEEL_MULTIPLIER_MAPPING[roundResult.winner.choice],
      };

      await createWheel(wheelData);
    }
  });
};

connect();

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

// module.exports.handler = async (event, context) => {
//   // connect to the database
//   const db = await connectToDatabase(MONGO_DB_URI);

//   // keep the socket connection alive
//   connect();

//   // execute the function every 10 seconds
//   setInterval(() => {
//     queryDatabase(db);
//   }, 10000);

//   // return the initial response
//   return {
//     statusCode: 200,
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ message: "Connected to database and started wheel updates." }),
//   };
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