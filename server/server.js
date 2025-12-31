const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// --- IMPORTS ---
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');

// 1. Load config
dotenv.config();
connectDB();

const app = express();

// 2. Middlewares

// 🔥 FIX: Increase upload limit to 50MB for iPhone/High-Res photos
// Standard limit is 1MB, which causes iPhone uploads to fail.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());

// Security headers (Allow cross-origin images from Cloudinary)
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// ❌ REMOVED: All the "fs" and "uploadDir" code.
// We do not need to create local folders anymore because 
// Cloudinary handles everything in the cloud.

// 3. Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// 4. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});