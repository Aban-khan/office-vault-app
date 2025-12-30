const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs'); // <--- IMPORT FS
const connectDB = require('./config/db');

// --- IMPORTS ---
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');

// 1. Load config
dotenv.config();

// 2. Connect to Database
connectDB();

const app = express();

// 3. Middlewares
app.use(express.json()); // Allow JSON data
app.use(cors()); // Allow frontend to talk to backend

// 🔥 FIX: Allow images to be shown on Vercel (Cross-Origin)
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// --- 🛡️ SAFETY CHECK: Create 'uploads' folder if missing ---
// On Render, this folder gets deleted every deploy. We must recreate it.
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('Created uploads folder');
}

// 🔥 SERVE IMAGES
app.use('/api/uploads', express.static(uploadDir));

// 4. Routes
app.use('/api/auth', authRoutes);       // Login, Register
app.use('/api/users', authRoutes);      // User List
app.use('/api/tasks', taskRoutes);      // Tasks
app.use('/api/projects', projectRoutes); // Projects

app.get('/', (req, res) => {
  res.send('API is running securely...');
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});