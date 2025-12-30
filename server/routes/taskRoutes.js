const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// --- IMPORT THE FUNCTIONS FROM YOUR CONTROLLER ---
const { 
  createTask, 
  getTasks, 
  updateTask, 
  deleteTask 
} = require('../controllers/taskController');

// 🔥 UPDATED: Import the Cloudinary uploader we created
// This replaces the old "multer.diskStorage" configuration
const upload = require('../config/cloudinary'); 

// --- DEFINE THE ROUTES ---

// 1. Assign Task (POST) & Get Tasks (GET)
router.route('/')
  .post(protect, upload.single('file'), createTask) // Uses Cloudinary now
  .get(protect, getTasks);

// 2. Update Status/Reply (PUT) & Delete Task (DELETE)
router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;