const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const fileController = require('../controllers/fileController');
const clickhouseController = require('../controllers/clickhouseController');
const { verifyConnectionAuth } = require('../middleware/authMiddleware');

// Define uploads directory consistently
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.ensureDirSync(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Parse flat file columns
// router.post('/columns', fileController.getColumns);

// Preview flat file data
// router.post('/preview', fileController.previewData);

// List previously uploaded files
// router.get('/list', fileController.listFiles);

// ClickHouse integration routes
// router.post('/clickhouse/tables', fileController.listClickHouseTables);
// router.post('/clickhouse/columns', fileController.getClickHouseColumns);
// router.post('/clickhouse/preview', fileController.previewClickHouseData);
// router.post('/clickhouse-to-file', fileController.clickHouseToFlatFile);

// Use clickhouseController for file import - protected by auth middleware
router.post('/file-to-clickhouse', verifyConnectionAuth, upload.single('file'), clickhouseController.flatFileToClickHouse);

module.exports = router; 