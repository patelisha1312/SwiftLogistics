const Booking = require("../models/bookingModel");

exports.chatbotReply = async (req, res) => {
  try {
    
    const msg = (req.body.message || "").toLowerCase().trim();

    
    if (/^(hi|hello|hey|hii|helo)\b/.test(msg)) {
      return res.json({
        reply: "Hello 👋 Welcome to Smart Logistics!\nHow can I help you today?",
        suggestions: ["Track parcel", "Send parcel", "Cancel booking"]
      });
    }

    const idMatch = msg.match(/(trk|swift)-\d+(?:-\d+)?/i);

    if (idMatch) {
      try {
        const inputId = idMatch[0].toUpperCase().trim();

        
        const booking = await Booking.findOne({
          $or: [
            { bookingId: inputId },
            { trackingId: inputId }
          ]
        });

        
        if (!booking) {
          return res.json({
            reply: `❌ No parcel found for ${inputId}`
          });
        }

        
        return res.json({
      reply: `📦 Shipment Details

🔹 Booking ID: ${booking.bookingId}
🔹 Tracking ID: ${booking.trackingId}

📊 Status: ${booking.status}

📍 Pickup: ${booking.pickupLocations?.[0]?.address || "N/A"}
📍 Drop: ${booking.dropLocations?.[0]?.address || "N/A"}

⏱ ETA: ${booking.eta || "Not available"}
📏 Distance: ${booking.distance || "Not available"}

🚚 Driver Details:
• Name: ${booking.driver?.name || "Not assigned"}
• Phone: ${booking.driver?.phone || "N/A"}
• Vehicle: ${booking.driver?.vehicleNumber || "N/A"}

💰 Price: ₹${booking.amount}
💳 Payment: ${booking.paymentStatus === "paid" ? "Paid ✅" : "Pending ❌"}`,

          suggestions: ["Track another", "Help"]
        });

      } catch (err) {
        console.error("TRACK ERROR:", err);
        return res.json({
          reply: "⚠ Error while fetching booking details"
        });
      }
    }

  
    if (/send|parcel|courier|book|pickup/.test(msg)) {
      return res.json({
        reply: `📦 Steps to send parcel:
1. Login
2. Click Schedule Pickup
3. Enter details
4. Confirm booking`,
        suggestions: ["Track parcel", "Payment"]
      });
    }

    if (/payment|pay|cost|price/.test(msg)) {
      return res.json({
        reply: "💳 Payment is done online after booking confirmation.",
        suggestions: ["Refund", "Booking"]
      });
    }

    if (/cancel/.test(msg)) {
      return res.json({
        reply: "❌ You can cancel booking before pickup from 'My Orders' section.",
        suggestions: ["Track parcel"]
      });
    }

    if (/refund/.test(msg)) {
      return res.json({
        reply: "💰 Refund will be processed within 5-7 working days."
      });
    }

    if (/driver/.test(msg)) {
      return res.json({
        reply: "🚚 Driver is assigned automatically based on availability."
      });
    }

    if (/eta|time|delivery/.test(msg)) {
      return res.json({
        reply: "⏱ Delivery time depends on distance & traffic."
      });
    }
    if (/help|support/.test(msg)) {
      return res.json({
        reply: "📞 Contact support at support@swiftlogistics.com"
      });
    }

   
    return res.json({
      reply: `🤖 I can help with:
📦 Sending parcel
📍 Tracking
💳 Payment
❌ Cancellation

Try:
• "Send parcel"
• "Track TRK-12345"`,
      suggestions: ["Send parcel", "Track parcel"]
    });

  } catch (err) {
    console.error("GLOBAL ERROR:", err);
    res.json({ reply: "⚠️ Server error" });
  }
};