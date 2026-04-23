const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver"
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Feedback", feedbackSchema);