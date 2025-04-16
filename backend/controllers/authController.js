const { generateConnectionToken } = require('../utils/jwtUtils');
const { ClickHouse } = require('clickhouse');

/**
 * Authenticate with ClickHouse and generate a token
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.connectToClickHouse = async (req, res) => {
  try {
    const { host, port, database, username, password, jwtToken, protocol = 'https' } = req.body;
    
    if (!host || !port || !database || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required connection parameters'
      });
    }

    // Use password or JWT token based on what's provided
    const authPassword = jwtToken || password;
    
    // Test connection to ClickHouse
    const clickhouse = new ClickHouse({
      url: `${protocol}://${host}:${port}`,
      debug: false,
      basicAuth: {
        username,
        password: authPassword,
      },
      isUseGzip: false,
      format: 'json',
      raw: false,
      config: {
        database,
        session_timeout: 60,
        output_format_json_quote_64bit_integers: 0,
        enable_http_compression: 0
      }
    });
    
    // Test connection
    await clickhouse.query(`SELECT 1`).toPromise();
    
    // Generate JWT token for this connection
    const connectionToken = generateConnectionToken({
      host,
      port,
      database,
      username,
      password,
      jwtToken,
      protocol
    });
    
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to ClickHouse',
      token: connectionToken
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to authenticate with ClickHouse'
    });
  }
}; 