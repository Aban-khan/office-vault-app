const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// --- IMPORTS ---
const { 
    registerUser, 
    loginUser, 
    getUsers,
    getPendingUsers,
    approveUser,
    rejectUser,
    forgotPasswordOTP, // <--- CHANGED: Import OTP function
    resetPasswordOTP   // <--- CHANGED: Import OTP function
} = require('../controllers/authController');

// --- PUBLIC ROUTES (No Login Required) ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- PASSWORD RECOVERY (OTP) ---
// Step 1: User enters email -> System sends OTP to phone
router.post('/forgot-otp', forgotPasswordOTP); 

// Step 2: User enters OTP + New Password -> System updates password
router.post('/reset-otp', resetPasswordOTP);

// --- ADMIN / PROTECTED ROUTES ---

// 1. Get List of Approved Users 
router.get('/', protect, getUsers); 

// 2. Get Pending List
router.get('/pending', protect, getPendingUsers); 

// 3. Approve User
router.put('/approve/:id', protect, approveUser); 

// 4. Reject User
router.delete('/reject/:id', protect, rejectUser); 

module.exports = router;