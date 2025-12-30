const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, default: 'Medium' },
  status: { type: String, default: 'Pending' },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // 🔥 NEW FIELD: Link this task to a specific Project
  project: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project' 
  },

  file: { type: String }, // Cloudinary URL path

  // Message box for Employee -> Admin
  employeeReply: { 
    type: String, 
    default: '' 
  } 

}, {
  timestamps: true,
});

module.exports = mongoose.model('Task', taskSchema);