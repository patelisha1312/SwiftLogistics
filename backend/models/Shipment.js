const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema({
  status: String,
  pickupDate: Date,
  deliveryDate: Date,
  route: String,
  revenue: Number
});

module.exports = mongoose.model("Shipment", shipmentSchema);