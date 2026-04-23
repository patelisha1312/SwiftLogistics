const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },

  email: { 
    type: String, 
    required: true, 
    unique: true 
  },

  password: { 
    type: String, 
    required: true 
  },

  role: { 
    type: String, 
    default: 'driver' 
  },

  isAvailable: {
    type: Boolean,
    default: true,
  },

  profileStatus: {
    type: String,
    enum: ['Pending', 'Complete'],
    default: 'Pending',
  },
  

  
  phone: { 
    type: String,
    required: true
  },

  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },

  experience: {
    type: Number, // years
  },

  vehicleType: {
    type: String,
    enum: ['Bike', 'Small Truck', 'Large Truck'],
    required: true,
  },

  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
  },

  address: {
    type: String,
  },

  location: {
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },

  licenseNumber: {
    type: String,
  },
  profileImage: {
  type: String,
  default: ""
},
  
rating: {
  type: Number,
  default: 0
},


totalRatings: {
  type: Number,
  default: 0
},

 ratings: {
  type: [
    {
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String },
      date: { type: Date, default: Date.now }
    }
  ],
  default: []
}
}, { timestamps: true });

driverSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(8);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


driverSchema.pre('save', function (next) {
  if (this.isModified('location')) {
    this.location.updatedAt = new Date();
  }
  next();
});


driverSchema.pre('save', function (next) {
  if (this.isNew && this.isAvailable === undefined) {
    this.isAvailable = false; // default OFFLINE
  }
  next();
});


driverSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


driverSchema.index({ 
  isAvailable: 1, 
  vehicleType: 1, 
  profileStatus: 1 
});

module.exports = mongoose.model('Driver', driverSchema);