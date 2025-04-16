const express = require('express');
const router = express.Router();
const ingestionController = require('../controllers/ingestionController');
const { verifyConnectionAuth } = require('../middleware/authMiddleware');

// Start ingestion from ClickHouse to flat file
router.post('/clickhouse-to-file', verifyConnectionAuth, ingestionController.clickhouseToFile);

// Start ingestion from flat file to ClickHouse
router.post('/file-to-clickhouse', ingestionController.fileToClickhouse);

// Get status of ongoing ingestion
router.get('/status/:jobId', ingestionController.getStatus);

module.exports = router; 