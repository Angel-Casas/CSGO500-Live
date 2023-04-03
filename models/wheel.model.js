const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const WheelSchema = new Schema(
    {
        result: {
            type: String,
            required: true,
        },
        roundId: {
            type: String,
            required: true,
        },
        nonce: {
            type: Number,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        random: {
            type: Number,
            required: true,
        },
    }, {
        toJSON: {
            // doc: full Model Document
            // ret: Plain Object representation of doc
            // RESTfull APIs have a convention of using id instead of _id.
            transform: (doc, { _id,  result, roundId, nonce, startDate, endDate, random }) =>
            ({ id: _id, result, roundId, nonce, startDate, endDate, random })
        }
    }
);

module.exports = mongoose.model("Wheel", WheelSchema);