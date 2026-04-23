const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const driverController = require("../controllers/driverController");


router.post(
  "/find-available",
  driverController.findAvailableDriver
);


router.put(
  "/profile",
  authMiddleware,
  driverController.updateDriverProfile
);
router.get(
  "/profile",
  authMiddleware,
  async (req, res) => {
    try {
      const Driver = require("../models/driverModel");

      const driver = await Driver.findById(req.user.id).select("-password");

      if (!driver) {
        return res.status(404).json({ msg: "Driver not found" });
      }

      res.json(driver);

    } catch (error) {
      console.error("GET PROFILE ERROR:", error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

router.get(
  "/tasks",
  authMiddleware,
  driverController.getAssignedTasks
);


router.put(
  "/task/:bookingId",
  authMiddleware,
  (req, res, next) => {
    console.log("🚚 Status update:", req.params.bookingId, req.body);
    next();
  },
  driverController.updateTaskStatus
);


router.put(
  "/availability",
  authMiddleware,
  driverController.updateAvailability
);


router.get(
  "/stats",
  authMiddleware,
  driverController.getDriverStats
);

router.get(
  "/history",
  authMiddleware,
  driverController.getDriverHistory
);


router.post(
  "/location",
  authMiddleware,
  (req, res, next) => {
    console.log("📍 Location API hit:", req.body);
    next();
  },
  driverController.updateLiveLocation
);

router.get("/all", async (req, res) => {
  try {
    const drivers = await require("../models/driverModel").find();
    res.json({ drivers });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching drivers" });
  }
});

router.post("/rate-driver", authMiddleware, async (req, res) => {
  try {
    const { driverId, rating, comment, bookingId } = req.body;

    const Driver = require("../models/driverModel");
    const Booking = require("../models/bookingModel");

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ msg: "Driver not found" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    if (booking.isRated) {
      return res.status(400).json({ msg: "Already rated" });
    }

    booking.rating = rating;
    booking.isRated = true;

    driver.ratings.push({
      rating,
      comment
    });

    driver.totalRatings = driver.ratings.length;

    driver.rating =
      driver.ratings.reduce((sum, r) => sum + r.rating, 0) /
      driver.totalRatings;

    await driver.save();
    await booking.save();

    const io = req.app.get("io");
    io.emit("ratingUpdated", {
      driverId,
      rating: driver.rating
    });

    res.json({
      msg: "Rating submitted successfully",
      rating: driver.rating
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.put("/approve/:id", async (req, res) => {
  const Driver = require("../models/driverModel");

  const driver = await Driver.findByIdAndUpdate(
    req.params.id,
    { isAvailable: true },
    { new: true }
  );

  res.json(driver);
});

router.put("/reject/:id", async (req, res) => {
  const Driver = require("../models/driverModel");

  await Driver.findByIdAndDelete(req.params.id);

  res.json({ msg: "Driver rejected" });
});
module.exports = router;