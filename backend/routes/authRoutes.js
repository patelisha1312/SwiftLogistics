const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');


router.post('/signup', authController.signup);
router.post('/login', authController.login);

// NAYE ROUTES: Driver Auth Routes
router.post('/driver/signup', authController.driverSignup);
router.post('/driver/login', authController.driverLogin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));


router.get(
    '/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', session: false }), 
    authController.googleCallback
);


router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));


router.get(
    '/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: 'http://localhost:5173/login', session: false }),
    authController.facebookCallback
    
);
router.get('/login', (req, res) => {
    res.redirect('http://localhost:5173/login');
});
router.delete("/users/:id", async (req, res) => {
  try {
    const User = require("../models/User");
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/users", async (req, res) => {
  try {
    const User = require("../models/User");
    const users = await User.find().select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;