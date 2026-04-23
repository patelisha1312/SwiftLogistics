const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/", async (req, res) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ msg: "Origin & Destination required" });
    }

    const [oLat, oLng] = origin.split(",");
const [dLat, dLng] = destination.split(",");

const response = await axios.get(
  `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`
);

const route = response.data.routes[0];

res.json({
  geometry: route.geometry.coordinates,
  distance: (route.distance / 1000).toFixed(2) + " km",
  duration: Math.round(route.duration / 60) + " mins",
});

  } catch (error) {
    console.log("OSRM ERROR:", error.message);
    res.status(500).json({ msg: "Route failed" });
  }
});

module.exports = router;