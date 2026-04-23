const Shipment = require("../models/Shipment");
const Driver = require("../models/driverModel"); // make sure name EXACT match
const Feedback = require("../models/Feedback"); // ✅ ADD THIS


// 1. Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalShipments = await Shipment.countDocuments();

    const totalRevenueData = await Shipment.aggregate([
  {
    $group: {
      _id: null,
      total: { $sum: { $ifNull: ["$revenue", 0] } }
    }
  }
]);

const totalRevenue = totalRevenueData.length > 0
  ? totalRevenueData[0].total
  : 0;
    const delayedShipments = await Shipment.countDocuments({ status: "Delayed" });
   const activeDrivers = await Driver.countDocuments({ isAvailable: true });
    const pendingPickups = await Shipment.countDocuments({ status: "Pending" });

    const rating = await Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]);

    res.json({
  totalShipments,
  totalRevenue: totalRevenue, // ✅ FIXED
  delayedShipments,
  customerSatisfaction: rating[0]?.avg || 0,
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
  const data = await Shipment.aggregate([
    {
      $group: {
        _id: { $month: "$pickupDate" },
        revenue: { $sum: "$revenue" },
        shipments: { $sum: 1 }
      }
    }
  ]);

  res.json(data.map(d => ({
    month: `Month ${d._id}`,
    revenue: d.revenue,
    shipments: d.shipments
  })));
};

// 3. Shipment Status
exports.getShipmentStatus = async (req, res) => {
  const data = await Shipment.aggregate([
    {
      $group: {
        _id: "$status",
        value: { $sum: 1 }
      }
    }
  ]);

  const colors = {
    Delivered: "#10B981",
    "In Transit": "#3B82F6",
    Pending: "#F59E0B",
    Delayed: "#EF4444",
    Cancelled: "#6B7280"
  };

  res.json(data.map(d => ({
    name: d._id,
    value: d.value,
    color: colors[d._id] || "#000"
  })));
};

// 4. Daily Activity
exports.getDailyActivity = async (req, res) => {
  const data = await Shipment.aggregate([
    {
      $group: {
        _id: { $dayOfWeek: "$pickupDate" },
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
  const data = await Shipment.aggregate([
    {
      $group: {
        _id: "$route",
        shipments: { $sum: 1 },
        revenue: { $sum: "$revenue" }
      }
    },
    { $sort: { shipments: -1 } },
    { $limit: 5 }
  ]);

  res.json(data.map(d => ({
    route: d._id,
    shipments: d.shipments,
    revenue: d.revenue
  })));
};