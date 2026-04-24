const bcrypt = require("bcryptjs");
const User = require('../models/User');
const Driver = require('../models/driverModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require("nodemailer");



// Signup (User)
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

const cleanEmail = email.trim().toLowerCase();

const existingUser = await User.findOne({ email: cleanEmail });
const existingDriver = await Driver.findOne({ email });

if (existingUser || existingDriver) {
  return res.status(400).json({
    msg: "Email already registered"
  });
}
    

const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
  name,
  email: cleanEmail,
  password: hashedPassword,
      role: role || "user"
    });

    await user.save();

    res.status(201).json({ msg: "User registered successfully" });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Login (User)
exports.login = async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
const password = req.body.password;

   const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    console.log("ENTERED PASSWORD:", password);
    console.log("DB HASH:", user.password);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("MATCH:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};


// Driver Signup
exports.driverSignup = async (req, res) => {
const { name, email, password, phone, vehicleType, vehicleNumber } = req.body;
  try {
    if (!name || !email || !password || !vehicleType || !vehicleNumber) {
      return res.status(400).json({
        msg: 'All fields are required for driver signup'
      });
    }

    let driver = await Driver.findOne({ email });
    if (driver) {
      return res.status(400).json({ msg: 'Email is already registered' });
    }

const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

driver = new Driver({
  name,
  email,
  password: hashedPassword,
  phone,
  vehicleType,
  vehicleNumber
})
    await driver.save();


    const token = jwt.sign(
      { id: driver._id, role: 'driver' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

   res.json({ 
    token,
    user: {
  id: driver._id,
  name: driver.name,
  email: driver.email,
  role: 'driver',
  profileStatus: driver.profileStatus
}

});


  } catch (error) {
    console.error('Driver signup error:', error);

    if (error.code === 11000) {
      if (error.keyPattern?.vehicleNumber) {
        return res.status(400).json({
          msg: 'Vehicle number is already registered'
        });
      }
      if (error.keyPattern?.email) {
        return res.status(400).json({
          msg: 'Email is already registered'
        });
      }
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        msg: Object.values(error.errors)[0].message
      });
    }

    return res.status(500).json({
      msg: 'Server error'
    });
  }
};

// Driver Login
exports.driverLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const driver = await Driver.findOne({ email });
        if (!driver) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await driver.matchPassword(password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign({ id: driver._id, role: 'driver' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ 
  token,
  user: { 
    id: driver._id,
    name: driver.name, 
    email: driver.email, 
    role: 'driver',

    
    phone: driver.phone,
    address: driver.address,
    gender: driver.gender,
    experience: driver.experience,
    vehicleType: driver.vehicleType,
    vehicleNumber: driver.vehicleNumber,
    licenseNumber: driver.licenseNumber,
    profileImage: driver.profileImage,
    profileStatus: driver.profileStatus,
    isVerified: driver.isVerified,
    isAvailable: driver.isAvailable
  }
});

    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};


// Google callback
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;

    const token = jwt.sign(
      { id: user._id, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const name = encodeURIComponent(user.name);
    const email = encodeURIComponent(user.email);

    res.redirect(
      `${process.env.FRONTEND_URL}/login?token=${token}&name=${name}&email=${email}`
    );

  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};
// Facebook callback
exports.facebookCallback = async (req, res) => {
  try {
    const user = req.user;

    const token = jwt.sign(
      { id: user._id, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);

  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    
    const resetToken = crypto.randomBytes(32).toString("hex");

    
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    
    user.resetPasswordToken = hashedToken;

    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); 

    await user.save();

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    console.log("RESET LINK:", resetURL); // DEBUG

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset",
      text: `Reset your password: ${resetURL}`
    });

    res.json({ msg: "Reset link sent to email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() }
    });

    console.log("USER FOUND:", user); 

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    const newPassword = req.body.password.trim();

    console.log("NEW PASSWORD:", newPassword);


const cleanPassword = req.body.password.trim();

const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(cleanPassword, salt);

user.password = hashedPassword;



    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    console.log("PASSWORD UPDATED SUCCESS"); 

    res.json({ msg: "Password reset successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};