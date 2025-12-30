const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs'); 
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
app.use(express.json());
app.use(cors());

// 🔥 FIX 1: Allow images to load (Security Fix)
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// 🔥 FIX 2: Safer Folder Path (using process.cwd)
const uploadDir = path.join(process.cwd(), 'uploads');

// 🔥 FIX 3: Re-create folder if Render deleted it
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('✅ Created uploads folder at:', uploadDir);
}

// 🔥 FIX 4: Debug Route (Check what files exist)
app.get('/api/test-uploads', (req, res) => {
    try {
        const files = fs.readdirSync(uploadDir);
        res.json({ 
            status: 'Folder exists', 
            path: uploadDir, 
            files_count: files.length,
            files: files 
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// 🔥 FIX 5: Serve the files
app.use('/api/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});