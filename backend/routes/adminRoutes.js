const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminController");

// ✅ IMPORT MODEL + PDF
const Booking = require("../models/bookingModel");
const PDFDocument = require("pdfkit");

/*
---------------------------------------
ANALYTICS ROUTES (ALREADY EXISTING)
---------------------------------------
*/
router.get("/dashboard-stats", controller.getDashboardStats);
router.get("/monthly-revenue", controller.getMonthlyRevenue);
router.get("/shipment-status", controller.getShipmentStatus);
router.get("/daily-activity", controller.getDailyActivity);
router.get("/top-routes", controller.getTopRoutes);

/*
---------------------------------------
EXPORT CSV
---------------------------------------
*/
router.get("/export/csv", async (req, res) => {
  try {
    const bookings = await Booking.find();

    let csv = "BookingID,Status,Amount\n";

    bookings.forEach((b) => {
      csv += `${b.bookingId},${b.status},${b.amount}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("bookings.csv");
    res.send(csv);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
---------------------------------------
EXPORT PDF
---------------------------------------
*/
router.get("/export/pdf", async (req, res) => {
  try {
    const bookings = await Booking.find();

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bookings.pdf"
    );

    doc.pipe(res);

    doc.fontSize(18).text("📦 SwiftLogistics Report", {
      align: "center",
    });

    doc.moveDown();

    bookings.forEach((b, index) => {
      doc
        .fontSize(12)
        .text(
          `${index + 1}. ID: ${b.bookingId} | Status: ${b.status} | Amount: ₹${b.amount}`
        );
    });

    doc.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;