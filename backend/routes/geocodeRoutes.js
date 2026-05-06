const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/", async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

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
        }
      }
    );

    if (!response.data || response.data.length === 0) {
      return res.json([]); // return empty safely
    }

    res.json(response.data);

  } catch (error) {
    console.log("Geocode ERROR:", error.message);
    res.status(500).json({ error: "Geocode failed" });
  }
});

module.exports = router;