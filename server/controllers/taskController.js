const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Assign a new task
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, priority, assignedTo, projectId } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Title and Assigned Employee are required' });
    }

    let filePath = null;
    if (req.file) {
      filePath = req.file.path; 
    }

    // 🔥 FIX: Handle empty Project ID
    // If projectId is an empty string "" (from "No Specific Project"), set it to null.
    const validProject = (projectId && projectId.trim() !== "") ? projectId : null;

    // --- BULK ASSIGNMENT LOGIC (All Employees) ---
    if (assignedTo === 'all') {
      
      const allEmployees = await User.find({ role: { $ne: 'admin' } });

      if (allEmployees.length === 0) {
        return res.status(400).json({ message: 'No employees found to assign task to' });
      }

      const tasksToCreate = allEmployees.map(employee => ({
        title,
        description,
        priority,
        assignedTo: employee._id, 
        project: validProject, // <--- Use the safe variable
        file: filePath,
        status: 'Pending',
        employeeReply: ''
      }));

      await Task.insertMany(tasksToCreate);

      return res.status(201).json({ message: 'Task assigned to ALL employees successfully', isBulk: true });
    }

    // --- SINGLE ASSIGNMENT LOGIC ---
    const task = await Task.create({
      title,
      description,
      priority,
      assignedTo,
      project: validProject, // <--- Use the safe variable
      file: filePath,
    });

    await task.populate('assignedTo', 'name email');
    
    // Only populate project if it exists
    if (validProject) {
        await task.populate('project', 'title location'); 
    }

    res.status(201).json(task);

  } catch (error) {
    console.error("Create Task Error:", error); // Log error for debugging
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
const getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await Task.find({})
        .populate('assignedTo', 'name')
        .populate('project', 'title location')
        .sort({ createdAt: -1 }); // Sort by newest first
    } else {
      tasks = await Task.find({ assignedTo: req.user._id })
        .populate('assignedTo', 'name')
        .populate('project', 'title location')
        .sort({ createdAt: -1 });
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

    if (req.body.status) {
      task.status = req.body.status;
    }

    if (req.body.employeeReply !== undefined) {
      task.employeeReply = req.body.employeeReply;
    }

    const updatedTask = await task.save();
    await updatedTask.populate('assignedTo', 'name');
    
    if (updatedTask.project) {
        await updatedTask.populate('project', 'title location');
    }
    
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
    
    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };