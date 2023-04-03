const WheelSchema = require('../models/wheel.model.js');
const WebSocket = require("ws");

const WHEEL_MULTIPLIER_MAPPING = [2, 3, 5, 50];
const socketUrl = 'wss://socket.500.casino/socket.io/?EIO=3&transport=websocket';
const socketOptions = {
    headers: {
        Origin: "https://500.casino"
    }
};

let wheelSocket = null;
let wheelPingInterval = null;
let reconnectInterval = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

exports.connect = () => {
    wheelSocket = new WebSocket(socketUrl, ["websocket"], socketOptions);
    console.log("[WHEEL] Connecting to WebSocket...");

    wheelSocket.on('open', () => {
        console.log('[WHEEL] Connected. Waiting for messages from WebSocket...');
        clearInterval(reconnectInterval);
        reconnectAttempts = 0;

        wheelPingInterval = setInterval(() => {
            if (wheelSocket.readyState === WebSocket.OPEN) {
                wheelSocket.send("2");
            }
        }, 25000);
    });

    wheelSocket.on('close', () => {
        console.log('[WHEEL] Disconnected.');
        clearInterval(wheelPingInterval);

        setTimeout(connect, 1000);
    });

    wheelSocket.on('message', async (data) => {
        data = data.toString();
        if (data.includes('42["round-end",')) {
            const roundResult = JSON.parse(data.replace('42["round-end",', '').slice(0, -1));

            // Create a new Wheel object
            const wheelData = {
                roundId: roundResult.winner.roundId,
                nonce: roundResult.winner.nonce,
                startDate: roundResult.winner.startDate,
                endDate: roundResult.winner.endDate,
                random: roundResult.winner.random,
                result: WHEEL_MULTIPLIER_MAPPING[roundResult.winner.choice],
            };

            // Save the wheel object to the database
            await createWheel(wheelData);
        }
    });
}

/**
 * Checks if the nonce is not the same and then creates a new Wheel object.
 * @param {object} wheel - The wheel object containing the information of the wheel result.
 * @returns {object} The new created wheel.
 */
const createWheel = async function(wheel) {
    // Check if the new wheel data has the same nonce as the latest wheel object in the database
    const lastWheel = await getLastWheel();
    if (lastWheel && lastWheel.nonce === wheel.nonce) {
        console.log(`[WHEEL] Skipping duplicate nonce ${wheel.nonce}`);
        return null;
    }
    return WheelSchema.create(wheel).then(docWheel => {
        console.log(`[WHEEL] Saved result for nonce ${docWheel.nonce}: ${wheel.result}×`);
        return docWheel;
    });
};

/**
 * Retrieve the latest wheel document from the database
 * @returns {object} The latest wheel from the database.
 */
const getLastWheel = async () => {
    try {
        const lastWheel = await WheelSchema.findOne().sort({ nonce: -1 }).exec();
        return lastWheel;
    } catch (err) {
        console.error(err);
    }
};