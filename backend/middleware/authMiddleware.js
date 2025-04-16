const { verifyConnectionToken } = require('../utils/jwtUtils');

/**
 * Middleware to verify the connection token and extract connection details
 */
exports.verifyConnectionAuth = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided. Please connect to the database first.'
      });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token format'
      });
    }
    
    // Verify and decode the token
    const connectionConfig = verifyConnectionToken(token);
    
    // Attach the connection details to the request object
    req.connectionConfig = connectionConfig;
    
    // Continue to the next middleware/controller
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: `Authentication failed: ${error.message}`
    });
  }
}; 