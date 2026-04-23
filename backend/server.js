const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
const helmet = require('helmet');
const geocodeRoutes = require("./routes/geocodeRoutes");
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');

dotenv.config();

// Connect MongoDB
connectDB();

const app = express();

/*
---------------------------------------
CREATE HTTP SERVER
---------------------------------------
*/
const server = http.createServer(app);

/*
---------------------------------------
SOCKET.IO INITIALIZATION
---------------------------------------
*/

  const io = new Server(server, {
  cors: {
    origin: [
  "http://localhost:5173",
  "https://swiftlogistics-sxee.onrender.com"
],
    methods: ["GET", "POST"]
  }
});

// Make socket available in controllers
app.set("io", io);

/*
---------------------------------------
SOCKET CONNECTION EVENTS
---------------------------------------
*/
io.on("connection", (socket) => {

  console.log("🔌 Socket connected:", socket.id);

  // Driver sends live location
  socket.on("driver-location", (data) => {

    console.log("📍 Driver location update:", data);

    io.emit("driver-location-update", data);

  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });

});

/*
---------------------------------------
MIDDLEWARE
---------------------------------------
*/

// Security
app.use(helmet());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // increased limit
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);
// CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://swiftlogistics-sxee.onrender.com"
  ],
  credentials: true
}));
// JSON parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Passport
app.use(passport.initialize());
require('./config/passport')(passport);

/*
---------------------------------------
API ROUTES
---------------------------------------
*/

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/driver', require('./routes/driverRoutes'));
app.use("/api/geocode", require('./routes/geocodeRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/shipment', require('./routes/shipmentRoutes'));
app.use("/api/route", require("./routes/routeRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
/*
---------------------------------------
ROOT ROUTE
---------------------------------------
*/

app.get('/', (req, res) => {
  res.send('🚚 SwiftLogistics API Running');
});

/*
---------------------------------------
START SERVER
---------------------------------------
*/

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});