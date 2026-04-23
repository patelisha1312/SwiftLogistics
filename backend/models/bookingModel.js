const mongoose = require('mongoose');


const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },

  lat: { type: Number, required: true },   
  lng: { type: Number, required: true }    

}, { _id: false });


const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  weight: { type: String },
  size: { type: String },
  pickupLocationIndex: { type: Number, required: true },
  dropLocationIndex: { type: Number, required: true },
}, { _id: false });


const driverSchema = new mongoose.Schema({
  _id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Driver', 
    required: false 
  },
  name: { 
    type: String, 
    default: null 
  },
  phone: { 
    type: String, 
    default: null 
  },
  vehicleType: { 
    type: String, 
    default: "Pending" 
  },
  vehicleNumber: { 
    type: String, 
    default: "Pending" 
  }
}, { _id: false });

const bookingSchema = new mongoose.Schema({

  bookingId: { 
    type: String, 
    required: true, 
    unique: true 
  },

  trackingId: {
    type: String,
    unique: true,
    required: true
  },

  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },

  status: { 
    type: String, 
    enum: ['Pending', 'In Transit', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },

  paymentId: {
    type: String,
    default: null
  },

  razorpayOrderId: {
    type: String
  },

  paymentDetails: {
    method: {
      type: String,
      default: "UPI"
    },
    paymentTime: {
      type: Date
    }
  },

  deliveryDetails: {
    estimatedTime: String,
    distance: Number
  },

  date: { 
    type: Date, 
    default: Date.now 
  },

  amount: { 
    type: Number, 
    required: true 
  },
  pickupPhone: {
  type: String,
  default: null
},

receiverPhone: {
  type: String,
  default: null
},
  distance: {
  type: String,
  default: ""
},

eta: {
  type: String,
  default: ""
},

  driverEarning: { 
    type: Number, 
    default: 0 
  },

  pickupLocations: [locationSchema],
  dropLocations: [locationSchema],
  items: [itemSchema],

  driver: driverSchema, 
  completionDate: { 
    type: Date 
  },
isRated: {
  type: Boolean,
  default: false
},

rating: {
  type: Number,
  default: null
},
  servicePlan: { 
    type: String, 
    default: 'standard' 
  }

}, { timestamps: true });


bookingSchema.index({ user: 1 });
bookingSchema.index({ 'driver._id': 1 });
bookingSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);