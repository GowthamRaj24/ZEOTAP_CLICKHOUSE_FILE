const { ClickHouse } = require('clickhouse');
const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Define uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.ensureDirSync(uploadsDir);

// Connect to ClickHouse
async function connectToClickHouse(config) {
  try {
    const { host, port, database, username, password, jwtToken, protocol = 'https' } = config;
    
    console.log(`Attempting to connect to ClickHouse at ${protocol}://${host}:${port}`);
    
    // Use password or JWT token based on what's provided
    const authPassword = jwtToken || password;
    
    // Azure ClickHouse configuration
    const clickhouse = new ClickHouse({
      url: `${protocol}://${host}:${port}`,
      debug: false,
      // Use basic auth for simplicity
      basicAuth: {
        username,
        password: authPassword,
      },
      isUseGzip: false, // Disable gzip to troubleshoot JSON parsing issues
      format: 'json',
      raw: false,
      config: {
        database,
        session_timeout: 60,
        output_format_json_quote_64bit_integers: 0,
        enable_http_compression: 0 // Disable HTTP compression
      }
    });
    
    // Test connection
    console.log('Testing connection...');
    await clickhouse.query(`SELECT 1`).toPromise();
    console.log('ClickHouse connection successful');
    return clickhouse;
  } catch (error) {
    console.error('ClickHouse connection error:', error);
    if (error.response) {
      console.error('Error response:', error.response.body || error.response);
    }
    throw new Error(`Failed to connect to ClickHouse: ${error.message}`);
  }
}

// Test ClickHouse connection
exports.testConnection = async (req, res) => {
  try {
    const { host, port, database, username, password, jwtToken } = req.body;
    console.log('Request body:', req.body);
    
    if (!host || !port || !database || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required connection parameters'
      });
    }
    
    await connectToClickHouse({ host, port, database, username, password, jwtToken });
    
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to ClickHouse'
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// List ClickHouse tables
exports.listTables = async (req, res) => {
  try {
    const { host, port, database, username, password, jwtToken, protocol } = req.body;
    
    console.log(`Connecting to ClickHouse with URL: ${protocol || 'https'}://${host}:${port}`);
    
    if (!host || !port || !database || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required connection parameters'
      });
    }
    
    const clickhouse = await connectToClickHouse({ 
      host, port, database, username, password, jwtToken, protocol 
    });
    
    const tables = await clickhouse.query(`SHOW TABLES FROM ${database}`).toPromise();
    
    return res.status(200).json({
      success: true,
      tables: tables.map(row => row.name)
    });
  } catch (error) {
    console.error('List tables error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get ClickHouse table columns
exports.getColumns = async (req, res) => {
  try {
    const { host, port, database, username, password, jwtToken, protocol, table } = req.body;
    
    console.log('getColumns request body:', JSON.stringify(req.body));
    
    
    if (!host || !port || !database || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required connection parameters'
      });
    }
    
    if (!table) {
      // If no table provided, fetch all tables and return an empty columns array
      console.log(`No table specified. Please select a table to view its columns.`);
      return res.status(400).json({
        success: false,
        error: 'Table name is required',
        message: 'Please select a table first to view its columns'
      });
    }
    
    console.log(`Getting columns for table ${table} from ${database}`);
    
    const clickhouse = await connectToClickHouse({ 
      host, port, database, username, password, jwtToken, protocol 
    });
    
    const columns = await clickhouse.query(`DESCRIBE TABLE ${database}.${table} FORMAT JSON`).toPromise();
    
    // Convert ClickHouse column types to our internal types
    const mappedColumns = columns.map(col => ({
      name: col.name,
      type: mapClickHouseType(col.type),
      original_type: col.type
    }));
    console.log('mappedColumns', mappedColumns);
    
    return res.status(200).json({
      success: true,
      columns: mappedColumns
    });
  } catch (error) {
    console.error('Get columns error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Preview ClickHouse data
exports.previewData = async (req, res) => {
  try {
    const { 
      host, port, database, username, password, jwtToken, protocol,
      tables, table, joinCondition, columns, page = 1, pageSize = 100 
    } = req.body;
    
    // Handle both tables array and single table parameter for backward compatibility
    const tablesToQuery = tables && tables.length ? tables : (table ? [table] : []);
    
    if (!tablesToQuery.length) {
      return res.status(400).json({
        success: false,
        error: 'At least one table is required'
      });
    }
    
    if (!host || !port || !database || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required connection parameters'
      });
    }
    
    const clickhouse = await connectToClickHouse({ 
      host, port, database, username, password, jwtToken, protocol 
    });
    
    let query;
    const selectedColumns = columns && columns.length > 0 ? columns.join(', ') : '*';
    const offset = (page - 1) * pageSize;
    
    // Handle multiple tables with JOIN
    if (tablesToQuery.length > 1 && joinCondition) {
      // Build JOIN query
      const mainTable = tablesToQuery[0];
      const joinClauses = tablesToQuery.slice(1).map(table => {
        return `JOIN ${database}.${table} ON ${joinCondition}`;
      }).join(' ');
      
      query = `SELECT ${selectedColumns} FROM ${database}.${mainTable} ${joinClauses} LIMIT ${pageSize} OFFSET ${offset}`;
    } else {
      // Single table query
      query = `SELECT ${selectedColumns} FROM ${database}.${tablesToQuery[0]} LIMIT ${pageSize} OFFSET ${offset}`;
    }
    
    // Get preview data
    const data = await clickhouse.query(query).toPromise();
    
    // Get total count
    let countQuery;
    if (tablesToQuery.length > 1 && joinCondition) {
      const mainTable = tablesToQuery[0];
      const joinClauses = tablesToQuery.slice(1).map(table => {
        return `JOIN ${database}.${table} ON ${joinCondition}`;
      }).join(' ');
      
      countQuery = `SELECT count() as total FROM ${database}.${mainTable} ${joinClauses}`;
    } else {
      countQuery = `SELECT count() as total FROM ${database}.${tablesToQuery[0]}`;
    }
    
    const countData = await clickhouse.query(countQuery).toPromise();
    const totalRows = countData[0]?.total || 0;
    
    return res.status(200).json({
      success: true,
      data,
      page,
      pageSize,
      totalRows,
      hasMore: totalRows > (offset + data.length)
    });
  } catch (error) {
    console.error('Preview data error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while previewing data'
    });
  }
};

// ClickHouse to flat file
exports.exportToFile = async (req, res) => {
  try {
    const { 
      host, port, database, username, password, jwtToken, protocol,
      tables, joinCondition, columns,
      outputFileName, delimiter = ',' 
    } = req.body;
    
    if (!tables || !tables.length) {
      return res.status(400).json({
        success: false,
        error: 'At least one table is required'
      });
    }
    
    if (!outputFileName) {
      return res.status(400).json({
        success: false,
        error: 'Output file name is required'
      });
    }
    
    if (!host || !port || !database || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required connection parameters'
      });
    }
    
    const clickhouse = await connectToClickHouse({ 
      host, port, database, username, password, jwtToken, protocol 
    });
    
    let query;
    const selectedColumns = columns && columns.length > 0 ? columns.join(', ') : '*';
    
    // Handle multiple tables with JOIN
    if (tables.length > 1 && joinCondition) {
      // Build JOIN query
      const mainTable = tables[0];
      const joinClauses = tables.slice(1).map(table => {
        return `JOIN ${database}.${table} ON ${joinCondition}`;
      }).join(' ');
      
      query = `SELECT ${selectedColumns} FROM ${database}.${mainTable} ${joinClauses}`;
    } else {
      // Single table query
      query = `SELECT ${selectedColumns} FROM ${database}.${tables[0]}`;
    }
    
    console.log('Executing export query without row limits:', query);
    
    // Set max_query_size and max_rows_to_read to high values to avoid limits
    await clickhouse.query('SET max_query_size = 1000000000').toPromise();
    await clickhouse.query('SET max_rows_to_read = 1000000000').toPromise();
    
    // Execute query and get data
    const rows = await clickhouse.query(query).toPromise();
    
    // Setup file output
    const outputPath = path.join(uploadsDir, outputFileName);
    const extension = path.extname(outputFileName).toLowerCase();
    const fileDelimiter = extension === '.tsv' ? '\t' : delimiter;
    
    // Create CSV writer with correct header
    let header = [];
    if (columns && columns.length > 0) {
      header = columns.map(column => ({ id: column, title: column }));
    } else if (rows.length > 0) {
      header = Object.keys(rows[0]).map(column => ({ id: column, title: column }));
    }
    
    if (header.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to determine column headers'
      });
    }
    
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: header,
      fieldDelimiter: fileDelimiter
    });
    
    // Write to CSV
    await csvWriter.writeRecords(rows);
    
    // Get file stats
    const stats = fs.statSync(outputPath);
    
    return res.status(200).json({
      success: true,
      filename: outputFileName,
      recordCount: rows.length,
      fileSize: stats.size,
      path: outputPath
    });
  } catch (error) {
    console.error('Export to file error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Flat file to ClickHouse
exports.importFromFile = async (req, res) => {
  try {
    const { 
      host, port, database, username, password, jwtToken, protocol,
      filename, columns, tableName, delimiter = ',',
      createTable = true, tableEngine = 'MergeTree()',
      orderBy = '', primaryKey = ''
    } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        error: 'Target table name is required'
      });
    }
    
    if (!host || !port || !database || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required connection parameters'
      });
    }
    
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({
        success: false,
        error: 'File not found'
      });
    }
    
    const clickhouse = await connectToClickHouse({ 
      host, port, database, username, password, jwtToken, protocol 
    });
    
    // Read sample rows to determine column types
    const fileExt = path.extname(filename).toLowerCase();
    const fileDelimiter = fileExt === '.tsv' ? '\t' : delimiter;
    
    const results = [];
    const sampleStream = fs.createReadStream(filePath)
      .pipe(csv({ separator: fileDelimiter }));
    
    for await (const data of sampleStream) {
      results.push(data);
      if (results.length >= 100) break;
    }
    
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'File contains no data'
      });
    }
    
    // Get column info from the file
    const fileColumns = Object.keys(results[0]).map(name => {
      const values = results.map(row => row[name]);
      const type = determineColumnType(values);
      return { name, type };
    });
    
    // Filter columns if specified
    const columnsToUse = columns && columns.length > 0 
      ? fileColumns.filter(col => columns.includes(col.name))
      : fileColumns;
    
    if (columnsToUse.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid columns selected'
      });
    }
    
    // Create table if needed
    if (createTable) {
      const columnDefinitions = columnsToUse.map(col => {
        const clickhouseType = mapTypeToClickHouse(col.type);
        return `\`${col.name}\` ${clickhouseType}`;
      }).join(', ');
      
      let createTableQuery = `
        CREATE TABLE ${database}.${tableName} (
          ${columnDefinitions}
        ) ENGINE = ${tableEngine}`;
      
      if (orderBy) {
        createTableQuery += ` ORDER BY (${orderBy})`;
      } else if (columnsToUse.length > 0) {
        // Default order by first column if not specified
        createTableQuery += ` ORDER BY (\`${columnsToUse[0].name}\`)`;
      }
      
      if (primaryKey && primaryKey !== orderBy) {
        createTableQuery += ` PRIMARY KEY (${primaryKey})`;
      }
      
      console.log('Creating table with query:', createTableQuery);
      await clickhouse.query(createTableQuery).toPromise();
    }
    
    // Read all file data
    const allData = [];
    const dataStream = fs.createReadStream(filePath)
      .pipe(csv({ separator: fileDelimiter }));
    
    for await (const row of dataStream) {
      // Only include selected columns
      const filteredRow = {};
      columnsToUse.forEach(col => {
        if (row[col.name] !== undefined) {
          filteredRow[col.name] = row[col.name];
        }
      });
      
      allData.push(filteredRow);
    }
    
    // Insert data in batches
    const batchSize = 10000;
    let recordCount = 0;
    
    for (let i = 0; i < allData.length; i += batchSize) {
      const batch = allData.slice(i, i + batchSize);
      
      // Insert batch
      const insertQuery = `INSERT INTO ${database}.${tableName} FORMAT JSONEachRow`;
      await clickhouse.insert(insertQuery, batch).toPromise();
      
      recordCount += batch.length;
    }
    
    return res.status(200).json({
      success: true,
      recordCount,
      table: tableName,
      message: `Successfully imported ${recordCount} records to ClickHouse table ${tableName}`
    });
  } catch (error) {
    console.error('Import from file error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper function to determine column type from values
function determineColumnType(values) {
  // Skip null/undefined/empty values
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonEmptyValues.length === 0) return 'String';
  
  // Check if all values are numbers
  const allNumbers = nonEmptyValues.every(v => !isNaN(Number(v)));
  if (allNumbers) {
    // Check if all values are integers
    const allIntegers = nonEmptyValues.every(v => Number.isInteger(Number(v)));
    return allIntegers ? 'Int32' : 'Float64';
  }
  
  // Check if all values are valid dates
  const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  const allDates = nonEmptyValues.every(v => datePattern.test(v));
  if (allDates) return 'DateTime';
  
  // Check if all values are booleans
  const boolValues = ['true', 'false', '1', '0', 'yes', 'no'];
  const allBooleans = nonEmptyValues.every(v => 
    boolValues.includes(String(v).toLowerCase()));
  if (allBooleans) return 'Boolean';
  
  // Default to string
  return 'String';
}

// Helper function to map internal types to ClickHouse types
function mapTypeToClickHouse(type) {
  switch (type) {
    case 'Int32':
      return 'Int32';
    case 'Float64':
      return 'Float64';
    case 'DateTime':
      return 'DateTime';
    case 'Boolean':
      return 'UInt8';
    case 'String':
    default:
      return 'String';
  }
}

// Helper function to map ClickHouse types to internal types
function mapClickHouseType(chType) {
  if (chType.includes('Int') || chType.includes('UInt')) {
    return 'Int32';
  } else if (chType.includes('Float') || chType.includes('Decimal')) {
    return 'Float64';
  } else if (chType.includes('DateTime') || chType.includes('Date')) {
    return 'DateTime';
  } else if (chType.includes('Bool')) {
    return 'Boolean';
  } else {
    return 'String';
  }
} 