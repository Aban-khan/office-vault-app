const User = require('../models/User');

// @desc    Get all users (employees)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  // Fetch all users but DO NOT send back their passwords
  const users = await User.find({}).select('-password');
  res.json(users);
};

module.exports = { getUsers };