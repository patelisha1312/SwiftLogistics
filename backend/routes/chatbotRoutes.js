const express = require("express");
const router = express.Router();
const { chatbotReply } = require("../controllers/chatbotController");

router.post("/chat", chatbotReply);

module.exports = router;
