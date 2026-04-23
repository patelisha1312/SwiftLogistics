const express = require("express");
const crypto = require("crypto");
const Booking = require("../models/bookingModel");
const Driver = require("../models/driverModel");
const sendSMS = require("../utils/sendSMS");
const { selectBestDriver } = require("../utils/driverIntelligence");
const { getRequiredVehicleType } = require("../utils/vehicleUtils");

const router = express.Router();

router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        msg: "Invalid signature"
      });
    }

    const booking = await Booking.findOne({
      razorpayOrderId: razorpay_order_id
    });

    if (!booking) {
      return res.status(404).json({
        msg: "Booking not found"
      });
    }

    booking.paymentStatus = "paid";
    booking.paymentId = razorpay_payment_id;

    if (!booking.trackingId) {
      booking.trackingId = `TRK-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    }

    
    await booking.save();

    const pickupPhone = booking.pickupPhone || booking.pickupLocations?.[0]?.phone;
    const receiverPhone = booking.receiverPhone || booking.dropLocations?.[0]?.phone;

    const pickup = booking.pickupLocations?.[0]?.address || "N/A";
    const drop = booking.dropLocations?.[0]?.address || "N/A";

    const item = booking.items?.[0]?.name || "Item";
    const weight = booking.items?.[0]?.weight || "N/A";

    const userMessage = `✅ Payment Successful!
Booking ID: ${booking.bookingId}
Tracking ID: ${booking.trackingId}
Pickup: ${pickup}
Drop: ${drop}
Item: ${item}
Weight: ${weight} kg
Amount: ₹${booking.amount}`;

    if (pickupPhone) await sendSMS(pickupPhone, userMessage);
    if (receiverPhone) await sendSMS(receiverPhone, userMessage);
    if (booking.driver?.phone) await sendSMS(booking.driver.phone, userMessage);

    res.json({
      success: true,
      bookingId: booking.bookingId,
      trackingId: booking.trackingId,
      paymentStatus: booking.paymentStatus
    });

  } catch (error) {
    console.error("❌ VERIFY ERROR:", error);
    res.status(500).json({
      msg: "Payment verification error"
    });
  }
});

module.exports = router;