const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    default: 'employee' 
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  
  // --- NEW FIELDS FOR OTP RECOVERY ---
  phoneNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  otp: { 
    type: String 
  },
  otpExpire: { 
    type: Date 
  }

}, {
  timestamps: true,
});

// Method to verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);