const Booking = require("../models/bookingModel");
const Driver = require("../models/driverModel"); // make sure name EXACT match
const Feedback = require("../models/Feedback"); // ✅ ADD THIS


// 1. Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalShipments = await Booking.countDocuments();

    const totalRevenueData = await Booking.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$amount", 0] } }
        }
      }
    ]);

    const totalRevenue =
      totalRevenueData.length > 0 ? totalRevenueData[0].total : 0;

    const delayedShipments = await Booking.countDocuments({ status: "Delayed" });
    const activeDrivers = await Driver.countDocuments({ isAvailable: true });
    const pendingPickups = await Booking.countDocuments({ status: "Pending" });

    // ✅ FIXED RATING (from Booking, not Feedback)
    const ratingData = await Booking.aggregate([
      { $match: { isRated: true } },
      {
        $group: {
          _id: null,
          avg: { $avg: "$rating" }
        }
      }
    ]);

    const customerSatisfaction = ratingData[0]?.avg || 0;

    res.json({
      totalShipments,
      totalRevenue,
      delayedShipments,
      customerSatisfaction,
      activeDrivers,
      pendingPickups
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// 2. Monthly Revenue
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const data = await Booking.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" }, // ✅ FIXED
          revenue: { $sum: "$amount" },  // ✅ FIXED
          shipments: { $sum: 1 }
        }
      }
    ]);

    res.json(data.map(d => ({
      month: `Month ${d._id}`,
      revenue: d.revenue,
      shipments: d.shipments
    })));

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error in monthly revenue" });
  }
};
// 3. Shipment Status
exports.getShipmentStatus = async (req, res) => {
  try {
    const data = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          value: { $sum: 1 }
        }
      }
    ]);

    const colors = {
      "Delivered": "#10B981",
      "In Transit": "#3B82F6",
      "Pending": "#F59E0B",
      "Cancelled": "#6B7280"
    };

    res.json(data.map(d => ({
      name: d._id,
      value: d.value,
      color: colors[d._id] || "#000"
    })));

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching shipment status" });
  }
};
// 4. Daily Activity
exports.getDailyActivity = async (req, res) => {
  const data = await Booking.aggregate([
    {
      $group: {
        _id: { $dayOfWeek: "$createdAt" },
        pickups: { $sum: 1 },
        deliveries: { $sum: 1 },
        delays: {
          $sum: { $cond: [{ $eq: ["$status", "Delayed"] }, 1, 0] }
        }
      }
    }
  ]);

  res.json(data.map(d => ({
    day: `Day ${d._id}`,
    pickups: d.pickups,
    deliveries: d.deliveries,
    delays: d.delays
  })));
};

// 5. Top Routes
exports.getTopRoutes = async (req, res) => {
  try {
    const data = await Booking.aggregate([
      {
        $group: {
          _id: "$pickupLocations.0.address", // ✅ FIXED
          shipments: { $sum: 1 },
          revenue: { $sum: "$amount" } // ✅ FIXED
        }
      },
      { $sort: { shipments: -1 } },
      { $limit: 5 }
    ]);

    res.json(data.map(d => ({
      route: d._id || "Unknown",
      shipments: d.shipments,
      revenue: d.revenue
    })));

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching routes" });
  }
};