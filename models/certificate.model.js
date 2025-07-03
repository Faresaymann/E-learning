const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.ObjectId,
      ref: "Course",
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    url: {
      type: String,
    },
    score: {
      type: String,
    },
    serialNumber: {
      type: String,
      unique: true,
    },
    issuer: {
      type: String,
      default: "Techtonic",
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Certificate", certificateSchema);
