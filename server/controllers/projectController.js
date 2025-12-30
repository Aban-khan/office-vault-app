const Project = require('../models/Project');
// ❌ REMOVED: const fs = require('fs'); (Not needed for Cloudinary)

// @desc    Submit a new project (Multiple Files)
const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one project file' });
    }

    // Cloudinary automatically puts the secure URL in file.path
    const filePaths = req.files.map(file => file.path);

    const project = await Project.create({
      title,
      description,
      files: filePaths,
      createdBy: req.user._id, 
    });

    await project.populate('createdBy', 'name email');
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a project and ALL files
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // 🔥 AUTH FIX: Allow deletion if user is Admin OR if user is the Creator
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this project' });
    }

    // ❌ REMOVED: fs.unlink loop.
    // We just delete the database record. The files stay in Cloudinary (Safe Archive).

    await project.deleteOne();
    res.json({ message: 'Project removed', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add files to existing project
const addFilesToProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const newFilePaths = req.files.map(file => file.path);
    
    // Initialize array if it doesn't exist (for old projects)
    if (!project.files) project.files = [];
    
    project.files.push(...newFilePaths);

    await project.save();
    await project.populate('createdBy', 'name email');
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a specific file
const removeFileFromProject = async (req, res) => {
  try {
    const { filePath } = req.body; 
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // ❌ REMOVED: fs.unlink code.
    // Since filePath is now a URL (https://...), we cannot delete it with fs.unlink.
    // We simply remove it from the database list below.

    // 2. Remove from DB Array
    if (project.files) {
        project.files = project.files.filter(file => file !== filePath);
    }

    await project.save();
    await project.populate('createdBy', 'name email');
    res.status(200).json(project);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// EXPORT ALL 5 FUNCTIONS
module.exports = { 
  createProject, 
  getProjects, 
  deleteProject,
  addFilesToProject,
  removeFileFromProject 
};