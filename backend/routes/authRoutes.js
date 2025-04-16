const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route to authenticate and get a token
router.post('/connect', authController.connectToClickHouse);

module.exports = router; 