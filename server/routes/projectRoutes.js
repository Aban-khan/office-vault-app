const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

// IMPORT ALL 5 FUNCTIONS
const { 
  createProject, 
  getProjects, 
  deleteProject,
  addFilesToProject,
  removeFileFromProject 
} = require('../controllers/projectController'); 

// MULTER CONFIG (With Original Name Fix)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Keep original name with timestamp prefix
    cb(null, Date.now() + '-' + file.originalname); 
  }
});

const upload = multer({ storage: storage });

// ROUTES
router.route('/')
  .post(protect, upload.array('files', 10), createProject)
  .get(protect, getProjects);

router.route('/:id')
  .delete(protect, deleteProject);

router.route('/:id/add')
  .put(protect, upload.array('files', 5), addFilesToProject);

router.route('/:id/remove-file')
  .put(protect, removeFileFromProject);

module.exports = router;