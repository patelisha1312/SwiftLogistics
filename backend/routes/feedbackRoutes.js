const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");

// CREATE FEEDBACK
router.post("/add", async (req, res) => {
  try {
    const { rating, driverId } = req.body;

    const feedback = await Feedback.create({
      rating,
      driverId,
      userId: req.user?._id
    });

    res.json({ msg: "Feedback saved", feedback });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error saving feedback" });
  }
});

module.exports = router;