const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate a secure secret if not provided in environment
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const TOKEN_EXPIRY = '7d'; // Token valid for 7 days

/**
 * Generate a JWT token for ClickHouse connection details
 * 
 * @param {Object} connectionConfig - The ClickHouse connection configuration
 * @returns {String} The JWT token
 */
exports.generateConnectionToken = (connectionConfig) => {
  // Create a token with the connection details
  return jwt.sign(
    connectionConfig,
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

/**
 * Verify and decode a JWT token to get connection details
 * 
 * @param {String} token - The JWT token to verify
 * @returns {Object} The decoded connection configuration
 * @throws {Error} If token is invalid
 */
exports.verifyConnectionToken = (token) => {
  try {
    // Verify and decode the token
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error(`Invalid or expired token: ${error.message}`);
  }
}; 