const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/", async (req, res) => {
  try {

    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        error: "Address required"
      });
    }

    console.log("📍 Geocoding:", address);

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: address,
          format: "json",
          limit: 1
        },

        headers: {
          "User-Agent": "swift-logistics-app"
        },

        timeout: 10000
      }
    );

    console.log("✅ NOMINATIM RESPONSE:", response.data);

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({
        error: "Location not found"
      });
    }

    const place = response.data[0];

    return res.json({
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon)
    });

  } catch (error) {

    console.log("❌ GEOCODE ERROR:");

    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

    return res.status(500).json({
      error: "Geocode failed"
    });
  }
});

module.exports = router;