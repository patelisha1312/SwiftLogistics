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
    



    const user = new User({
  name,
  email: cleanEmail,
  password: password,
      role: role || "user"
    });

    await user.save();

   const token = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

res.status(201).json({
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  }
});

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Login (User)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check fields
    if (!email || !password) {
      return res.status(400).json({ message: "Please enter email and password" });
    }

    // 2. Find user
   const cleanEmail = email.trim().toLowerCase();

const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    console.log("ENTERED:", password);
    console.log("HASH:", user.password);
    console.log("MATCH:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // 4. Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Send response
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
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Driver Signup
exports.driverSignup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      vehicleType,
      vehicleNumber
    } = req.body;

    // 🔴 validation
    if (!name || !email || !password || !phone || !vehicleType || !vehicleNumber) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // 🔴 check existing email
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // 🔴 check vehicle duplicate
    const existingVehicle = await Driver.findOne({ vehicleNumber });
    if (existingVehicle) {
      return res.status(400).json({ msg: "Vehicle already registered" });
    }

    // ✅ IMPORTANT: DO NOT HASH HERE
    const driver = new Driver({
      name,
      email,
      password,   // model will hash
      phone,
      vehicleType,
      vehicleNumber
    });

    await driver.save();

    const token = require("jsonwebtoken").sign(
      { id: driver._id, role: "driver" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        role: "driver"
      }
    });

  } catch (error) {
    console.error("🔥 DRIVER SIGNUP ERROR:", error);
    res.status(500).json({ msg: error.message });
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

   res.redirect(`${process.env.FRONTEND_URL}/?token=${token}&name=${name}&email=${email}`)

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