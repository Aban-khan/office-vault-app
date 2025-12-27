const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');

// --- IMPORTS ---
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes'); // Import this properly

// 1. Load config
dotenv.config();

// 2. Connect to Database
connectDB();

const app = express();

// 3. Middlewares
app.use(express.json()); // Allow JSON data in requests
app.use(cors()); // Allow frontend to talk to backend
app.use(helmet()); // Security headers

// 4. Routes
app.use('/api/auth', authRoutes);       // Handles Login, Register, Approve, Pending
app.use('/api/users', authRoutes);      // FIX: Use authRoutes here too (Get Users List)
app.use('/api/tasks', taskRoutes);      // Handles Tasks
app.use('/api/projects', projectRoutes); // Handles Projects

// Make the uploads folder accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('API is running securely...');
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});