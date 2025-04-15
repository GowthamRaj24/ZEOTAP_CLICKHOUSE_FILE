require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./utils/errorHandler');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const multer = require('multer');
const fileRoutes = require('./routes/fileRoutes');
const clickhouseRoutes = require('./routes/clickhouseRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add this before your routes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Create an uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Routes
app.use('/api', routes);
app.use('/api/files', fileRoutes);
app.use('/api/clickhouse', clickhouseRoutes);

// Error handling middleware
app.use(errorHandler);

// Add right before your app.listen call
app.get('/api/healthcheck', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.post("/testing" , (req , res) => {
  res.status(200).json({status : "ok" , message : "testing"});
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
