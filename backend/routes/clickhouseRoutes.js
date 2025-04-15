const express = require('express');
const router = express.Router();
const clickhouseController = require('../controllers/clickhouseController');

// Test connection to ClickHouse
router.post('/test-connection', clickhouseController.testConnection);

// Get tables from ClickHouse
router.post('/tables', clickhouseController.listTables);

// Get columns for a specific table
router.post('/columns', clickhouseController.getColumns);

// Preview data from a table
router.post('/preview', clickhouseController.previewData);

// Export data from ClickHouse
router.post('/export', clickhouseController.exportToFile);

// Import data into ClickHouse
router.post('/import', clickhouseController.importFromFile);

// Make sure this route exists
router.post('/preview-data', clickhouseController.previewData);

module.exports = router; 