const mongoose = require('mongoose');
const axios = require("axios");
const Booking = require('../models/bookingModel');
const Driver = require('../models/driverModel');
const sendSMS = require('../utils/sendSMS');
const { predictETA } = require("../utils/etaPredictor");
const Shipment = require("../models/Shipment");

const RazorpayLib = require("razorpay");

const razorpayInstance = new RazorpayLib({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


const getRequiredVehicleType = (items) => {
  const totalWeight = items.reduce((sum, item) => {
    const weight = parseFloat(item.weight) || 0;
    return sum + weight;
  }, 0);

  console.log(`⚖️ Total Weight: ${totalWeight} kg`);

  if (totalWeight > 10) return 'Large Truck';
  if (totalWeight > 5) return 'Small Truck';
  return 'Bike';
};



const getDistanceAndETA = (pickupCoords, dropCoords) => {
  const R = 6371;

  const dLat = (dropCoords.lat - pickupCoords.lat) * Math.PI / 180;
  const dLon = (dropCoords.lng - pickupCoords.lng) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(pickupCoords.lat * Math.PI / 180) *
    Math.cos(dropCoords.lat * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const speed = 40; // realistic avg speed
  const time = (distance / speed) * 60;

  return {
    distance: distance.toFixed(1) + " km",
    duration: Math.ceil(time) + " mins"
  };
};

exports.createBooking = async (req, res) => {
  try {
    const { items, pickupLocations, dropLocations, amount, servicePlan } = req.body;

    
    if (pickupLocations.some(loc => loc.lat == null || loc.lng == null)) {
      return res.status(400).json({ msg: "Invalid pickup coordinates" });
    }

    if (dropLocations.some(loc => loc.lat == null || loc.lng == null)) {
      return res.status(400).json({ msg: "Invalid drop coordinates" });
    }

    const updatedPickupLocations = pickupLocations.map(loc => ({
      address: loc.address,
      lat: Number(loc.lat),
      lng: Number(loc.lng),
      name: loc.name,
      phone: loc.phone
    }));

    const updatedDropLocations = dropLocations.map(loc => ({
      address: loc.address,
      lat: Number(loc.lat),
      lng: Number(loc.lng),
      name: loc.name,
      phone: loc.phone
    }));

    if (!items || items.length === 0) {
      return res.status(400).json({ msg: "Items required" });
    }

    
    const pickupCoords = updatedPickupLocations[0];
    const dropCoords = updatedDropLocations[0];

    let route;

    if (
      pickupCoords.lat == null ||
      pickupCoords.lng == null ||
      dropCoords.lat == null ||
      dropCoords.lng == null
    ) {
      console.log("❌ Invalid coordinates, using fallback");
      route = { distance: "50 km", duration: "60 mins" };
    } else {
      const routeData = getDistanceAndETA(pickupCoords, dropCoords);

      if (!routeData.distance || routeData.distance.includes("NaN")) {
        console.log("❌ Distance calculation failed, fallback used");
        route = { distance: "50 km", duration: "60 mins" };
      } else {
        route = routeData;
      }
    }

    console.log("🔥 FINAL ROUTE:", route);

    
    const vehicleType = getRequiredVehicleType(items);
    console.log("🚗 Required Vehicle:", vehicleType);

   let availableDrivers = await Driver.find({
  isAvailable: true
});

// 🚨 fallback if none available
if (availableDrivers.length === 0) {
  console.log("⚠️ No available drivers → using all drivers");

  availableDrivers = await Driver.find({});
}

const filteredDrivers = availableDrivers.filter(d => {
  const status = d.profileStatus?.toLowerCase().trim();

  return status === "complete" || status === "completed";
});

console.log("🚚 Available Drivers Count:", availableDrivers.length);

if (filteredDrivers.length === 0) {
  return res.status(400).json({
    msg: "No active drivers available"
  });
}

availableDrivers.forEach(d => {
  console.log("Driver:", d.name, "| Vehicle:", d.vehicleType);
});

const normalize = (str) =>
  str?.toLowerCase().replace(/\s+/g, '').trim();

let driver = filteredDrivers.find(d =>
  normalize(d.vehicleType) === normalize(vehicleType)
);

if (!driver && filteredDrivers.length > 0) {
  console.log("⚠️ fallback driver used");
  driver = filteredDrivers[0];
}
    let driverData = null;

    if (driver) {
      driverData = {
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber
      };

      driver.isAvailable = false;
      await driver.save();

      console.log("✅ DRIVER ASSIGNED:", driverData);
    } else {
      console.log("❌ NO DRIVER FOUND");
    }


    const bookingId = `SWIFT-${Date.now().toString().slice(-6)}`;
    const trackingId = `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: bookingId
    });

  
    const booking = new Booking({
      bookingId,
      trackingId,
      user: req.user._id || req.user.id,
      items,
      pickupLocations: updatedPickupLocations,
      dropLocations: updatedDropLocations,

      pickupPhone: updatedPickupLocations[0].phone,
      receiverPhone: updatedDropLocations[0].phone,

      distance: route.distance,
      eta: route.duration,

      amount,
      driverEarning: amount * 0.8,
      servicePlan: servicePlan || "standard",
      driver: driverData,
      paymentStatus: "pending",
      razorpayOrderId: order.id,
      status: "Pending"
    });

    const savedBooking = await booking.save();
    
    // 🔴 LIVE DASHBOARD UPDATE
const io = req.app.get("io");
io.emit("dashboard-update");
const Shipment = require("../models/Shipment");

try {
  console.log("💰 BOOKING AMOUNT:", amount, typeof amount);
  console.log("🔥 Creating shipment...");

  const newShipment = await Shipment.create({
    status: "Pending",
    pickupDate: new Date(),
    deliveryDate: null,
    route: `${updatedPickupLocations[0].address} → ${updatedDropLocations[0].address}`,
    revenue: Number(amount)
  });

  console.log("✅ Shipment created:", newShipment);

} catch (err) {
  console.error("❌ Shipment error:", err);
}
    if (driver) {
      try {
        await sendSMS(
          driver.phone,
          `🚚 New Delivery Assigned!
Booking ID: ${bookingId}
Pickup: ${updatedPickupLocations[0].address}
Drop: ${updatedDropLocations[0].address}`
        );
      } catch (err) {
        console.log("SMS failed");
      }
    }

    console.log("🚚 DRIVER IN RESPONSE:", savedBooking.driver);

    res.status(201).json({
      msg: driver
        ? "Driver assigned & booking created"
        : "Booking created (no driver available)",
      bookingId: savedBooking.bookingId,
      trackingId: savedBooking.trackingId,
      razorpayOrderId: order.id,
      amount: order.amount,
      booking: savedBooking.toObject()
    });

  } catch (error) {
    console.error("❌ BOOKING ERROR:", error);
    res.status(500).json({ msg: "Server error" });
  }
};
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const bookings = await Booking.find({ user: userId })
      .sort({ createdAt: -1 });

    res.json({ bookings });

  } catch (error) {
    console.error("GET MY BOOKINGS ERROR:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 });

    res.json({ bookings });

  } catch (error) {
    console.error("GET ALL BOOKINGS ERROR:", error);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.trackPackage = async (req, res) => {
  try {
    const rawId = req.params.bookingId;

    console.log("🔍 RAW PARAM:", rawId);

    const trackingId = rawId.trim();

    
    const allBookings = await Booking.find({}, "trackingId");
    console.log("📦 ALL TRACKING IDs:", allBookings);

    
    let booking =
      await Booking.findOne({ trackingId: trackingId }) ||
      await Booking.findOne({ trackingId: trackingId.toString() }) ||
      await Booking.findOne({ bookingId: trackingId });

  
    if (!booking) {
      booking = await Booking.findOne({
        trackingId: { $regex: trackingId, $options: "i" }
      });
    }

    console.log("📦 FOUND BOOKING:", booking);

    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    res.json(booking);

  } catch (error) {
    console.error("TRACK ERROR:", error);
    res.status(500).json({ msg: "Server error" });
  }
  
};
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    // 🔴 LIVE UPDATE (Socket.IO)
    const io = req.app.get("io");
    io.emit("dashboard-update");

    res.json(booking);

  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    res.status(500).json({ msg: "Server error" });
  }
};