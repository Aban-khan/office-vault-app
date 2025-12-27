const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// This route is protected (you must be logged in to see the employee list)
router.get('/', protect, getUsers);

module.exports = router;