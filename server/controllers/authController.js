const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const twilio = require('twilio'); // <--- NEW: Import Twilio

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
const registerUser = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Optional: Check if phone is taken
    if (phoneNumber) {
        const phoneExists = await User.findOne({ phoneNumber });
        if (phoneExists) return res.status(400).json({ message: 'Phone number already used' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phoneNumber, 
      role: 'employee', 
      isApproved: false
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        message: "Signup successful! Please wait for Admin approval."
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (user.role !== 'admin' && user.isApproved === false) {
        return res.status(403).json({ message: 'Account pending approval. Contact Admin.' });
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- REAL TWILIO OTP LOGIC ---

// @desc    Send OTP to Registered Phone (Using Twilio)
const forgotPasswordOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    if (!user.phoneNumber) {
      return res.status(400).json({ message: 'This account has no phone number linked.' });
    }

    // 1. Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save to DB
    user.otp = otpCode;
    user.otpExpire = Date.now() + 5 * 60 * 1000; 
    await user.save({ validateBeforeSave: false });

    // 3. SEND REAL SMS VIA TWILIO
    const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: `Your Office Vault Code is: ${otpCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phoneNumber 
    });

    // Success
    const hiddenPhone = user.phoneNumber.slice(-4);
    res.status(200).json({ message: `SMS sent to mobile ending in ****${hiddenPhone}` });

  } catch (error) {
    console.error("Twilio Error:", error); // Check terminal if it fails!
    res.status(500).json({ message: 'Failed to send SMS. Make sure phone number has country code (e.g. +91...)' });
  }
};

// @desc    Verify OTP and Set New Password
const resetPasswordOTP = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({
      email,
      otp,
      otpExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or Expired OTP' });
    }

    user.password = newPassword;
    user.otp = undefined;       
    user.otpExpire = undefined;
    
    await user.save();

    res.status(200).json({ message: 'Password Changed Successfully! Please Login.' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- ADMIN FUNCTIONS ---
const getUsers = async (req, res) => {
  try { const users = await User.find({ isApproved: true }).select('-password'); res.json(users); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

const getPendingUsers = async (req, res) => {
    try { const users = await User.find({ isApproved: false, role: { $ne: 'admin' } }); res.json(users); } 
    catch (error) { res.status(500).json({ message: error.message }); }
};

const approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(user) { user.isApproved = true; await user.save(); res.json({ message: 'User Approved' }); } 
        else { res.status(404).json({ message: 'User not found' }); }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const rejectUser = async (req, res) => {
    try { await User.findByIdAndDelete(req.params.id); res.json({ message: 'User Rejected' }); } 
    catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { 
    registerUser, loginUser, 
    getUsers, getPendingUsers, approveUser, rejectUser,
    forgotPasswordOTP, resetPasswordOTP   
};