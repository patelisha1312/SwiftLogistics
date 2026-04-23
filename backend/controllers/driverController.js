const Booking = require('../models/bookingModel');
const Driver = require('../models/driverModel');
const mongoose = require('mongoose');
const { getRequiredVehicleType } = require('../utils/vehicleUtils');
const sendSMS = require('../utils/sendSMS');

exports.findAvailableDriver = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        msg: "Items required to find driver"
      });
    }

    const vehicleType = getRequiredVehicleType(items);

    const driver = await Driver.findOne({
      isAvailable: true,
      profileStatus: "Complete",
      vehicleType: vehicleType
    }).sort({ updatedAt: 1 });

    if (!driver) {
      return res.status(200).json({
        driver: null,
        msg: `No available ${vehicleType} drivers right now`
      });
    }

    res.json({
      driver: {
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber
      }
    });

  } catch (error) {
    console.error("FIND DRIVER ERROR:", error);
    res.status(500).json({ msg: "Server error while finding driver" });
  }
};


exports.updateDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id || req.user.id);

    if (!driver) {
      return res.status(404).json({ msg: 'Driver not found' });
    }

    if (req.body.vehicleNumber) {
      const existing = await Driver.findOne({
        vehicleNumber: req.body.vehicleNumber,
        _id: { $ne: driver._id }
      });

      if (existing) {
        return res.status(400).json({
          msg: "Vehicle number already used by another driver"
        });
      }
    }

    Object.assign(driver, req.body, {
      profileStatus: "Complete"
    });

    const updatedDriver = await driver.save();

    await sendEmail(
      updatedDriver.email,
      "Profile Activated",
      "Your driver profile is now active."
    );

    res.json(updatedDriver);

  } catch (error) {
    console.error("UPDATE DRIVER PROFILE ERROR:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getAssignedTasks = async (req, res) => {
  try {
    const driverId = new mongoose.Types.ObjectId(req.user.id);

    const tasks = await Booking.find({
      'driver._id': driverId,
      status: { $in: ["Pending", "In Transit"] }
    }).sort({ createdAt: -1 });

    console.log("TASKS SENT:", tasks);
res.json({ tasks });

  } catch (error) {
    console.error("TASK ERROR:", error);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['In Transit', 'Delivered'].includes(status)) {
      return res.status(400).json({
        msg: "Invalid status update"
      });
    }

    const driverId = new mongoose.Types.ObjectId(req.user.id);

    const booking = await Booking.findOne({
      bookingId: req.params.bookingId,
      'driver._id': driverId
    });

    if (!booking) {
      return res.status(404).json({
        msg: "Booking not assigned to this driver"
      });
    }

    booking.status = status;

    if (status === "Delivered") {
      booking.completionDate = new Date();
    


  const driver = await Driver.findById(booking.driver._id);
  if (driver) {
    driver.isAvailable = true;
    await driver.save();
  }
}
    await booking.save();

    const io = req.app.get("io");
    io.emit("booking-status-update", {
      bookingId: booking.bookingId,
      trackingId: booking.trackingId,
      status: booking.status
    });

    res.json({
      msg: "Booking status updated",
      booking
    });

  } catch (error) {
    console.error("STATUS ERROR:", error);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.updateAvailability = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id || req.user.id);

    if (!driver) {
      return res.status(404).json({ msg: "Driver not found" });
    }

    driver.isAvailable = req.body.isAvailable;

    await driver.save();

    res.json({
      isAvailable: driver.isAvailable
    });

  } catch (error) {
    console.error("AVAILABILITY ERROR:", error);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.getDriverStats = async (req, res) => {
  try {
    const driverId = new mongoose.Types.ObjectId(req.user.id);

    const activeTasks = await Booking.find({
      'driver._id': driverId
    });

    const earnings = await Booking.aggregate([
      {
        $match: {
          'driver._id': driverId,
          status: "Delivered"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$driverEarning" }
        }
      }
    ]);

    const driver = await Driver.findById(driverId);

    const completedRidesCount = await Booking.countDocuments({
      status: "Delivered",
      "driver._id": driverId
    });

    const ratedBookings = await Booking.find({
      rating: { $ne: null },
      "driver._id": driverId
    });

    let avgRating = 0;
    if (ratedBookings.length > 0) {
      const total = ratedBookings.reduce((sum, b) => sum + b.rating, 0);
      avgRating = total / ratedBookings.length;
    }

    const score = (completedRidesCount * 10) + (avgRating * 20);

    res.json({
      stats: {
        pending: activeTasks.filter(t => t.status === "Pending").length,
        inTransit: activeTasks.filter(t => t.status === "In Transit").length,
        earningsToday: earnings.length ? earnings[0].total : 0,
        score: Math.round(score),
        isAvailable: driver?.isAvailable || false
      }
    });

  } catch (error) {
    console.error("STATS ERROR:", error);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.getDriverHistory = async (req, res) => {
  try {
    const driverId = new mongoose.Types.ObjectId(req.user.id);

    const rides = await Booking.find({
      status: "Delivered",
      "driver._id": driverId
    }).sort({ completionDate: -1 });

    console.log("Driver ID:", driverId);
    console.log("Rides found:", rides);

    res.json({ history: rides });

  } catch (error) {
    console.error("❌ History Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.updateLiveLocation = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id || req.user.id);

    if (!driver) {
      return res.status(404).json({ msg: "Driver not found" });
    }

    driver.location = {
      lat: req.body.lat,
      lng: req.body.lng,
      updatedAt: new Date()
    };

    await driver.save();

    const io = req.app.get("io");

    io.emit("driver-location-update", {
      driverId: driver._id.toString(),
      lat: req.body.lat,
      lng: req.body.lng,
      updatedAt: new Date()
    });

    res.json({ msg: "Location updated" });

  } catch (error) {
    console.error("LOCATION ERROR:", error);
    res.status(500).json({ msg: "Server error" });
  }
};