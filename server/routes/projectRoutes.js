const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// IMPORT ALL 5 FUNCTIONS
const { 
  createProject, 
  getProjects, 
  deleteProject,
  addFilesToProject,
  removeFileFromProject 
} = require('../controllers/projectController'); 

// 🔥 UPDATED: Import the Cloudinary uploader we created
// This replaces the old "multer.diskStorage" code
const upload = require('../config/cloudinary'); 

// ROUTES
router.route('/')
  .post(protect, upload.array('files', 10), createProject) // Uses Cloudinary
  .get(protect, getProjects);

router.route('/:id')
  .delete(protect, deleteProject);

router.route('/:id/add')
  .put(protect, upload.array('files', 5), addFilesToProject); // Uses Cloudinary

router.route('/:id/remove-file')
  .put(protect, removeFileFromProject);

module.exports = router;