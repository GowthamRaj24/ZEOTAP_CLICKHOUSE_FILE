const express = require('express');
const router = express.Router();

const clickhouseRoutes = require('./clickhouseRoutes');
const fileRoutes = require('./fileRoutes');
const ingestionRoutes = require('./ingestionRoutes');

router.use('/clickhouse', clickhouseRoutes);
router.use('/file', fileRoutes);
router.use('/ingestion', ingestionRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

module.exports = router; 