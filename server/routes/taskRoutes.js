const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// --- IMPORT THE FUNCTIONS FROM YOUR NEW CONTROLLER ---
const { 
  createTask, 
  getTasks, 
  updateTask, 
  deleteTask 
} = require('../controllers/taskController');

// Multer Config for Task Attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'task-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- DEFINE THE ROUTES ---

// 1. Assign Task (POST) & Get Tasks (GET)
router.route('/')
  .post(protect, upload.single('file'), createTask)
  .get(protect, getTasks);

// 2. Update Status/Reply (PUT) & Delete Task (DELETE)
router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;