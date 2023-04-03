const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CrashSchema = new Schema(
    {
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
        crashedAt: {
            type: Number,
            required: true,
        },
    }, {
        toJSON: {
            // doc: full Model Document
            // ret: Plain Object representation of doc
            // RESTfull APIs have a convention of using id instead of _id.
            transform: (doc, { _id, roundId, nonce, startDate, crashedAt }) =>
            ({ id: _id, roundId, nonce, startDate, crashedAt })
        }
    }
);

module.exports = mongoose.model("Crash", CrashSchema);