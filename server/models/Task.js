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
  file: { type: String }, // Path to attached file
  
  // --- NEW FIELD FOR THE MESSAGE BOX ---
  employeeReply: { 
    type: String, 
    default: '' 
  } 

}, {
  timestamps: true,
});

module.exports = mongoose.model('Task', taskSchema);