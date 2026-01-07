const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const http = require('http'); // Import HTTP
const { Server } = require('socket.io'); // Import Socket.io

// --- IMPORTS ---
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');

// 1. Load config
dotenv.config();
connectDB();

const app = express();

// 2. Setup Socket.io (Real-Time Server)
const server = http.createServer(app); // Wrap Express
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from anywhere (Frontend)
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// 3. Middlewares
app.use(express.json({ limit: '50mb' })); // iPhone Fix
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));

// 🔥 SOCKET MIDDLEWARE: Make 'io' accessible in Controllers
app.use((req, res, next) => {
  req.io = io; 
  next();
});

// 4. Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// 5. Start Server (Change 'app.listen' to 'server.listen')
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});