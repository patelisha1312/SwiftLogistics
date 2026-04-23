const axios = require("axios");

const sendSMS = async (phone, message) => {
  try {
    console.log("📱 Sending SMS to:", phone);
    console.log("🔑 API KEY:", process.env.FAST2SMS_API_KEY ? "Loaded" : "Missing");

    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q", 
        sender_id: "FSTSMS",
        message: message,
        language: "english",
        numbers: phone.toString().replace("+91", "").trim() 
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ SMS sent:", response.data);

  } catch (error) {
    console.log("❌ SMS error:", error.response?.data || error.message);
  }
};

module.exports = sendSMS;