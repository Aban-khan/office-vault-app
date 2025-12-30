const mongoose = require('mongoose');

const projectSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  
  // 🔥 NEW FIELD: Location (Site Name)
  location: { 
    type: String, 
    required: true 
  },

  // Store an ARRAY of file links (Cloudinary URLs)
  files: [{
    type: String
  }],
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Project', projectSchema);