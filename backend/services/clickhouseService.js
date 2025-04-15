const { createClient } = require('@clickhouse/client');
const { createClickHouseClient } = require('../config/db');
const axios = require('axios');
const https = require('https');

/**
 * Test connection to ClickHouse
 * @param {Object} config - Connection configuration
 * @returns {Promise<boolean>} - True if connection successful
 */
exports.testConnection = async (config) => {
  try {
    const { host, port, database, username, password } = config;
    
    // Use axios for a simple connection test
    const response = await axios({
      method: 'get',
      url: `https://${host}:${port}/ping`,
      auth: {
        username,
        password
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Only for testing, not recommended for production
      })
    });
    
    if (response.status === 200) {
      return true;
    } else {
      throw new Error(`Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.error('Connection test error:', error);
    throw new Error(`Connection failed: ${error.message}`);
  }
};

/**
 * Execute a query on ClickHouse
 * @param {Object} client - ClickHouse client
 * @param {String} query - SQL query to execute
 * @param {String} format - Output format (default: JSONEachRow)
 * @returns {Promise<Array>} - Query results
 */
exports.executeQuery = async (client, query, format = 'JSONEachRow') => {
  try {
    const resultSet = await client.query({
      query,
      format
    });
    
    return await resultSet.json();
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

/**
 * Create a table in ClickHouse
 * @param {Object} client - ClickHouse client
 * @param {String} database - Database name
 * @param {String} tableName - Table name
 * @param {Array} columns - Array of column definitions
 * @returns {Promise<void>}
 */
exports.createTable = async (client, database, tableName, columns) => {
  try {
    // Generate column definitions
    const columnDefs = columns.map(col => {
      // Determine ClickHouse data type based on sample data
      const type = determineClickHouseType(col.type);
      return `${col.name} ${type}`;
    }).join(', ');
    
    // Create table query
    const query = `
      CREATE TABLE IF NOT EXISTS ${database}.${tableName} (
        ${columnDefs}
      ) ENGINE = MergeTree()
      ORDER BY tuple()
    `;
    
    await client.query({
      query
    });
    
    return true;
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
};

/**
 * Insert data into a ClickHouse table
 * @param {Object} client - ClickHouse client
 * @param {String} database - Database name
 * @param {String} tableName - Table name
 * @param {Array} data - Array of data objects
 * @returns {Promise<void>}
 */
exports.insertData = async (client, database, tableName, data) => {
  try {
    if (!data || data.length === 0) {
      return 0;
    }
    
    // Insert data in batches to avoid memory issues
    const batchSize = 1000;
    const totalRows = data.length;
    let insertedRows = 0;
    
    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      await client.insert({
        table: `${database}.${tableName}`,
        values: batch,
        format: 'JSONEachRow'
      });
      
      insertedRows += batch.length;
    }
    
    return insertedRows;
  } catch (error) {
    console.error('Error inserting data:', error);
    throw error;
  }
};

/**
 * Determine appropriate ClickHouse data type based on JavaScript type
 * @param {String} jsType - JavaScript data type
 * @returns {String} - ClickHouse data type
 */
function determineClickHouseType(jsType) {
  switch (jsType.toLowerCase()) {
    case 'number':
    case 'float':
    case 'decimal':
      return 'Float64';
    case 'integer':
    case 'int':
      return 'Int64';
    case 'date':
    case 'datetime':
      return 'DateTime';
    case 'boolean':
      return 'UInt8';
    case 'string':
    default:
      return 'String';
  }
}

// Create a service for ClickHouse operations
const clickhouseService = {
  testConnection: exports.testConnection,
  executeQuery: exports.executeQuery,
  createTable: exports.createTable,
  insertData: exports.insertData,
  determineClickHouseType: exports.determineClickHouseType
};

module.exports = clickhouseService; 