const Task = require('../models/Task');
const User = require('../models/User'); // <--- 1. NEW IMPORT (Required to find employees)
const fs = require('fs');

// @desc    Assign a new task
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, priority, assignedTo } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Title and Assigned Employee are required' });
    }

    let filePath = null;
    if (req.file) {
      filePath = req.file.path;
    }

    // --- 2. NEW LOGIC: Handle "All Employees" ---
    if (assignedTo === 'all') {
      
      // Find all users who are NOT 'admin'
      const allEmployees = await User.find({ role: { $ne: 'admin' } });

      if (allEmployees.length === 0) {
        return res.status(400).json({ message: 'No employees found to assign task to' });
      }

      // Create a task object for every single employee
      const tasksToCreate = allEmployees.map(employee => ({
        title,
        description,
        priority,
        assignedTo: employee._id, // Assign to this specific employee
        file: filePath,
        status: 'Pending',
        employeeReply: ''
      }));

      // Insert all tasks into the database at once
      await Task.insertMany(tasksToCreate);

      // Return a special success message
      return res.status(201).json({ message: 'Task assigned to ALL employees successfully', isBulk: true });
    }
    // ---------------------------------------------

    // 3. OLD LOGIC: Handle Single Employee Assignment
    const task = await Task.create({
      title,
      description,
      priority,
      assignedTo,
      file: filePath,
    });

    // Populate user details immediately for the frontend
    await task.populate('assignedTo', 'name email');
    res.status(201).json(task);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
const getTasks = async (req, res) => {
  try {
    let tasks;
    // If Admin: See ALL tasks
    if (req.user.role === 'admin') {
      tasks = await Task.find({}).populate('assignedTo', 'name');
    } else {
      // If Employee: See ONLY their assigned tasks
      tasks = await Task.find({ assignedTo: req.user._id }).populate('assignedTo', 'name');
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task status OR Reply
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update Status if provided
    if (req.body.status) {
      task.status = req.body.status;
    }

    // Update Employee Reply if provided
    if (req.body.employeeReply !== undefined) {
      task.employeeReply = req.body.employeeReply;
    }

    const updatedTask = await task.save();
    
    // Populate for frontend
    await updatedTask.populate('assignedTo', 'name');
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Delete attached file if exists
    if (task.file && fs.existsSync(task.file)) {
      fs.unlink(task.file, (err) => {
        if (err) console.error("Failed to delete task file", err);
      });
    }

    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };