require('dotenv').config()

const { createClient } = require('@clickhouse/client');

/**
 * Create a ClickHouse client with the provided configuration
 * @param {Object} config - ClickHouse connection configuration
 * @returns {Object} ClickHouse client
 */
const createClickHouseClient = (config) => {
  try {
    // Format the host URL correctly
    let url = config.host || process.env.CLICKHOUSE_HOST || 'localhost';
    const port = config.port || process.env.CLICKHOUSE_PORT || '8123';
    
    // If host doesn't include protocol, add it based on port
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const protocol = port === '8443' ? 'https://' : 'http://';
      url = `${protocol}${url}`;
    }
    
    // If port is not in the URL, add it
    if (!url.includes(':' + port) && !url.match(/:(\d+)$/)) {
      url = `${url}:${port}`;
    }
    
    console.log('Connecting to ClickHouse with URL:', url);
    
    const client = createClient({
      host: url,
      database: config.database || process.env.CLICKHOUSE_DB || 'default',
      username: config.username || process.env.CLICKHOUSE_USER || 'default',
      password: config.password || process.env.CLICKHOUSE_PASSWORD || '',
      
      // If using JWT token for authentication
      ...(config.jwtToken ? {
        request_timeout: 60000,
        headers: {
          'Authorization': `Bearer ${config.jwtToken}`
        }
      } : {})
    });
    
    return client;
  } catch (error) {
    console.error('Error creating ClickHouse client:', error);
    throw error;
  }
};

module.exports = {
  clickhouse: {
    host: process.env.CLICKHOUSE_HOST || 'localhost',
    port: process.env.CLICKHOUSE_PORT || '8123',
    database: process.env.CLICKHOUSE_DB || 'default',
    user: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    protocol: process.env.CLICKHOUSE_PORT === '8443' ? 'https:' : 'http:'
  },
  createClickHouseClient
}; 