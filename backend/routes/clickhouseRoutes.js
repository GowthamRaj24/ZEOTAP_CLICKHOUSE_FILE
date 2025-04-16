const express = require('express');
const router = express.Router();
const clickhouseController = require('../controllers/clickhouseController');
const { verifyConnectionAuth } = require('../middleware/authMiddleware');

// Legacy route for backward compatibility
router.post('/test-connection', clickhouseController.testConnection);

// Protected routes that require authentication
router.post('/tables', verifyConnectionAuth, clickhouseController.listTables);
router.post('/columns', verifyConnectionAuth, clickhouseController.getColumns);
router.post('/preview', verifyConnectionAuth, clickhouseController.previewData);
router.post('/export', verifyConnectionAuth, clickhouseController.exportToFile);
router.post('/import', verifyConnectionAuth, clickhouseController.importFromFile);
router.post('/preview-data', verifyConnectionAuth, clickhouseController.previewData);

module.exports = router; 