const Shipment = require('../models/Shipment');

exports.createShipment = async (req, res) => {
  try {
    const shipment = new Shipment({
      user: req.user.id,
      trackingNumber: req.body.trackingNumber,
      origin: req.body.origin,
      destination: req.body.destination
    });

    await shipment.save();

    res.json(shipment);

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getShipments = async (req, res) => {

  try {

    const shipments = await Shipment.find({
      user: req.user.id
    });

    res.json(shipments);

  } catch (err) {

    res.status(500).json({ msg: "Server error" });

  }

};