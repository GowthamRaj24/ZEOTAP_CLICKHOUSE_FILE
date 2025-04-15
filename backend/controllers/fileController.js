const path = require('path')
const fs = require('fs-extra')
const csv = require('csv-parser')
const { createObjectCsvWriter } = require('csv-writer')
const { ClickHouseClient } = require('@clickhouse/client')

// Define the uploads directory path consistently across the application
const uploadsDir = path.join(__dirname, '..', 'uploads')

// Ensure the uploads directory exists
fs.ensureDirSync(uploadsDir)

exports.uploadFile = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      })
    }

    console.log('File uploaded:', req.file)

    return res.status(200).json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    })
  } catch (error) {
    console.error('File upload error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    })
  }
}

exports.getFileColumns = (req, res) => {
  try {
    const { filename } = req.params
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: { message: 'Filename is required' }
      })
    }

    const filePath = path.join(uploadsDir, filename)
    console.log('Looking for file at:', filePath)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath)
      return res.status(400).json({
        success: false,
        error: { message: 'File not found' }
      })
    }

    // Determine delimiter based on file extension
    
    const fileExt = path.extname(filename).toLowerCase()
    const delimiter = fileExt === '.tsv' ? '\t' : ','

    // Only read the first few rows to determine columns - faster approach
    const results = []
    let headers = []
    
    const stream = fs.createReadStream(filePath)
      .pipe(csv({ separator: delimiter }))
      .on('headers', (detectedHeaders) => {
        headers = detectedHeaders
        // If we only want headers, we can destroy the stream after getting headers
        if (req.query.headersOnly === 'true') {
          stream.destroy()
        }
      })
      .on('data', (data) => {
        results.push(data)
        // We only need 5 rows at most to determine types
        if (results.length >= 5) {
          stream.destroy()
        }
      })
      .on('end', () => {
        // If headersOnly option is used, return just the headers
        if (req.query.headersOnly === 'true') {
          return res.status(200).json({
            success: true,
            columns: headers.map(name => ({ name, type: 'String' }))
          })
        }
        
        // If no data, return just headers with string type
        if (results.length === 0) {
          return res.status(200).json({
            success: true,
            columns: headers.map(name => ({ name, type: 'String' }))
          })
        }

        // Get column names from first row
        const columns = Object.keys(results[0]).map(name => {
          // Determine column type based on values
          const values = results.map(row => row[name])
          const type = determineColumnType(values)
          
          return {
            name,
            type,
            sample: values[0]
          }
        })

        return res.status(200).json({
          success: true,
          columns
        })
      })
      .on('error', (err) => {
        console.error('Error reading CSV:', err)
        return res.status(500).json({
          success: false,
          error: { message: 'Failed to parse file: ' + err.message }
        })
      })
  } catch (error) {
    console.error('Get columns error:', error)
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get columns' }
    })
  }
}

// Helper function to determine column type
function determineColumnType(values) {
  // Skip null/undefined/empty values
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '')
  
  if (nonEmptyValues.length === 0) return 'String'
  
  // Check if all values are numbers
  const allNumbers = nonEmptyValues.every(v => !isNaN(Number(v)))
  if (allNumbers) {
    // Check if all values are integers
    const allIntegers = nonEmptyValues.every(v => Number.isInteger(Number(v)))
    return allIntegers ? 'Int32' : 'Float64'
  }
  
  // Check if all values are valid dates
  const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/
  const allDates = nonEmptyValues.every(v => datePattern.test(v))
  if (allDates) return 'DateTime'
  
  // Check if all values are booleans
  const boolValues = ['true', 'false', '1', '0', 'yes', 'no']
  const allBooleans = nonEmptyValues.every(v => 
    boolValues.includes(String(v).toLowerCase()))
  if (allBooleans) return 'Boolean'
  
  // Default to string
  return 'String'
}

exports.getColumns = (req, res) => {
  try {
    const { filePath, delimiter = ',' } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: { message: 'File path is required' }
      });
    }

    const fullPath = path.join(uploadsDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(400).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    // Process is similar to getFileColumns, but takes parameters from request body
    const results = [];
    const stream = fs.createReadStream(fullPath)
      .pipe(csv({ separator: delimiter }))
      .on('data', (data) => {
        results.push(data);
        if (results.length >= 5) {
          stream.destroy();
        }
      })
      .on('end', () => {
        if (results.length === 0) {
          return res.status(200).json({
            success: true,
            columns: []
          });
        }

        const columns = Object.keys(results[0]).map(name => {
          const values = results.map(row => row[name]);
          const type = determineColumnType(values);
          
          return {
            name,
            type,
            sample: values[0]
          };
        });

        return res.status(200).json({
          success: true,
          columns
        });
      })
      .on('error', (err) => {
        return res.status(500).json({
          success: false,
          error: { message: 'Failed to parse file: ' + err.message }
        });
      });
  } catch (error) {
    console.error('Get columns error:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get columns' }
    });
  }
};

exports.previewData = (req, res) => {
  try {
    const { filePath, delimiter = ',', columns, page = 1, pageSize = 100, skipRows = 0 } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: { message: 'File path is required' }
      });
    }

    const fullPath = path.join(uploadsDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(400).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    // Calculate offset based on pagination
    const offset = (page - 1) * pageSize + skipRows;
    let rowCount = 0;
    const results = [];
    let totalCount = 0;

    const stream = fs.createReadStream(fullPath)
      .pipe(csv({ separator: delimiter }))
      .on('data', (data) => {
        totalCount++;
        
        // Skip rows before the offset
        if (rowCount < offset) {
          rowCount++;
          return;
        }
        
        // Only collect rows within the requested page
        if (results.length < pageSize) {
          // If columns are specified, filter the data
          if (columns && columns.length > 0) {
            const filteredData = {};
            columns.forEach(col => {
              if (data[col] !== undefined) {
                filteredData[col] = data[col];
              }
            });
            results.push(filteredData);
          } else {
            results.push(data);
          }
        }
        
        rowCount++;
        
        // Stop processing after we've collected enough rows
        if (results.length >= pageSize) {
          stream.destroy();
        }
      })
      .on('end', () => {
        return res.status(200).json({
          success: true,
          data: results,
          page,
          pageSize,
          totalRows: totalCount,
          hasMore: totalCount > (offset + results.length)
        });
      })
      .on('error', (err) => {
        return res.status(500).json({
          success: false,
          error: { message: 'Failed to parse file: ' + err.message }
        });
      });
  } catch (error) {
    console.error('Preview data error:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to preview data' }
    });
  }
};

exports.listFiles = (req, res) => {
  try {
    // Read the uploads directory and get all files
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { message: 'Failed to read uploads directory: ' + err.message }
        });
      }

      // Get file details
      const fileDetails = files.map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      });

      return res.status(200).json({
        success: true,
        files: fileDetails
      });
    });
  } catch (error) {
    console.error('List files error:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to list files' }
    });
  }
};

// Add a new endpoint for handling larger files with better performance
exports.streamData = (req, res) => {
  try {
    const { filePath, delimiter = ',', columns, batchSize = 1000 } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: { message: 'File path is required' }
      });
    }

    const fullPath = path.join(uploadsDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(400).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    // Write the opening bracket for the JSON array
    res.write('{"success":true,"data":[');
    
    let isFirstRow = true;
    let rowCount = 0;
    let batch = [];

    const stream = fs.createReadStream(fullPath)
      .pipe(csv({ separator: delimiter }))
      .on('data', (data) => {
        rowCount++;
        
        // Filter columns if specified
        let rowData = data;
        if (columns && columns.length > 0) {
          rowData = {};
          columns.forEach(col => {
            if (data[col] !== undefined) {
              rowData[col] = data[col];
            }
          });
        }
        
        batch.push(rowData);
        
        // Send batch when it reaches the specified size
        if (batch.length >= batchSize) {
          const batchJson = JSON.stringify(batch).slice(1, -1); // Remove the [] brackets
          res.write((isFirstRow ? '' : ',') + batchJson);
          isFirstRow = false;
          batch = [];
        }
      })
      .on('end', () => {
        // Write any remaining data
        if (batch.length > 0) {
          const batchJson = JSON.stringify(batch).slice(1, -1);
          res.write((isFirstRow ? '' : ',') + batchJson);
        }
        
        // Close the JSON array and send the response
        res.write(`],"totalRows":${rowCount}}`);
        res.end();
      })
      .on('error', (err) => {
        // If there's an error, try to send error response if headers haven't been sent
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: { message: 'Failed to parse file: ' + err.message }
          });
        } else {
          // Otherwise, just end the response
          res.end(`],"error":"${err.message}"}`);
        }
      });
  } catch (error) {
    console.error('Stream data error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to stream data' }
      });
    }
  }
};

// Connect to ClickHouse with JWT authentication
async function connectToClickHouse(config) {
  try {
    const { host, port, database, username, token, protocol = 'https' } = config;
    
    console.log(`Attempting to connect to ClickHouse at ${protocol}://${host}:${port}`);
    
    const client = new ClickHouseClient({
      host: `${protocol}://${host}:${port}`,
      database: database,
      username: username,
      password: token, // Using token as password for JWT auth
      clickhouse_settings: {
        allow_experimental_object_type: 1
      }
    });
    
    // Test connection
    console.log('Testing connection with ping...');
    await client.ping();
    console.log('ClickHouse connection successful');
    return client;
  } catch (error) {
    console.error('ClickHouse connection error:', error);
    throw new Error(`Failed to connect to ClickHouse: ${error.message}`);
  }
}

// List ClickHouse tables
exports.listClickHouseTables = async (req, res) => {
  try {
    const { host, port, database, username, token, protocol } = req.body;
    
    if (!host || !port || !database || !username || !token) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required ClickHouse connection parameters' }
      });
    }
    
    const client = await connectToClickHouse({ host, port, database, username, token, protocol });
    const result = await client.query({
      query: `SHOW TABLES FROM ${database}`,
      format: 'JSONEachRow'
    });
    
    const data = await result.json();
    
    return res.status(200).json({
      success: true,
      tables: data.map(row => row.name || row.table)
    });
  } catch (error) {
    console.error('List ClickHouse tables error:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to list ClickHouse tables' }
    });
  }
};

// Get ClickHouse table columns
exports.getClickHouseColumns = async (req, res) => {
  try {
    const { host, port, database, username, token, protocol, table } = req.body;
    
    // Validate required parameters with specific error messages
    if (!host) {
      return res.status(400).json({
        success: false,
        error: { message: 'ClickHouse host is required' }
      });
    }
    
    if (!port) {
      return res.status(400).json({
        success: false,
        error: { message: 'ClickHouse port is required' }
      });
    }
    
    if (!database) {
      return res.status(400).json({
        success: false,
        error: { message: 'ClickHouse database is required' }
      });
    }
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: { message: 'ClickHouse username is required' }
      });
    }
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: { message: 'ClickHouse JWT token is required' }
      });
    }
    
    if (!table) {
      return res.status(400).json({
        success: false,
        error: { message: 'ClickHouse table name is required' }
      });
    }
    
    console.log('Connecting to ClickHouse with:', { 
      host, 
      port, 
      database, 
      username, 
      protocol: protocol || 'https',
      tableRequested: table 
    });
    
    const client = await connectToClickHouse({ host, port, database, username, token, protocol });
    
    console.log(`Successfully connected to ClickHouse, querying table ${table}`);
    
    const result = await client.query({
      query: `DESCRIBE TABLE ${database}.${table}`,
      format: 'JSONEachRow'
    });
    
    const data = await result.json();
    console.log(`Received column data: ${data.length} columns`);
    
    // Convert ClickHouse column types to our internal types
    const columns = data.map(col => ({
      name: col.name,
      type: mapClickHouseType(col.type),
      original_type: col.type
    }));
    
    return res.status(200).json({
      success: true,
      columns
    });
  } catch (error) {
    console.error('Get ClickHouse columns error:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get ClickHouse columns' }
    });
  }
};

// Preview ClickHouse data
exports.previewClickHouseData = async (req, res) => {
  try {
    const { 
      host, port, database, username, token, protocol,
      tables, joinCondition, columns, page = 1, pageSize = 100 
    } = req.body;
    
    if (!host || !port || !database || !username || !token || !tables || !tables.length) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required parameters' }
      });
    }
    
    const client = await connectToClickHouse({ host, port, database, username, token, protocol });
    
    let query;
    const selectedColumns = columns && columns.length > 0 ? columns.join(', ') : '*';
    const offset = (page - 1) * pageSize;
    
    // Handle multiple tables with JOIN
    if (tables.length > 1 && joinCondition) {
      // Build JOIN query
      const mainTable = tables[0];
      const joinClauses = tables.slice(1).map(table => {
        return `JOIN ${database}.${table} ON ${joinCondition}`;
      }).join(' ');
      
      query = `SELECT ${selectedColumns} FROM ${database}.${mainTable} ${joinClauses} LIMIT ${pageSize} OFFSET ${offset}`;
    } else {
      // Single table query
      query = `SELECT ${selectedColumns} FROM ${database}.${tables[0]} LIMIT ${pageSize} OFFSET ${offset}`;
    }
    
    // Get preview data
    const dataResult = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const data = await dataResult.json();
    
    // Get total count
    let countQuery;
    if (tables.length > 1 && joinCondition) {
      const mainTable = tables[0];
      const joinClauses = tables.slice(1).map(table => {
        return `JOIN ${database}.${table} ON ${joinCondition}`;
      }).join(' ');
      
      countQuery = `SELECT count() as total FROM ${database}.${mainTable} ${joinClauses}`;
    } else {
      countQuery = `SELECT count() as total FROM ${database}.${tables[0]}`;
    }
    
    const countResult = await client.query({
      query: countQuery,
      format: 'JSONEachRow'
    });
    
    const countData = await countResult.json();
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
    console.error('Preview ClickHouse data error:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to preview ClickHouse data' }
    });
  }
};

// ClickHouse to Flat File
exports.clickHouseToFlatFile = async (req, res) => {
  try {
    const { 
      host, port, database, username, token, protocol,
      tables, joinCondition, columns,
      outputFileName, delimiter = ',' 
    } = req.body;
    
    if (!host || !port || !database || !username || !token || !tables || !tables.length || !outputFileName) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required parameters' }
      });
    }
    
    const client = await connectToClickHouse({ host, port, database, username, token, protocol });
    
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
    
    // Execute query and stream to file
    const outputPath = path.join(uploadsDir, outputFileName);
    const extension = path.extname(outputFileName).toLowerCase();
    const fileDelimiter = extension === '.tsv' ? '\t' : delimiter;
    
    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: columns.map(column => ({ id: column, title: column })),
      fieldDelimiter: fileDelimiter
    });
    
    // Stream data in batches
    const result = await client.query({
      query,
      format: 'JSONEachRow',
      clickhouse_settings: {
        // For large datasets, use custom settings
        max_block_size: 10000,
        max_execution_time: 300
      }
    });
    
    const rows = await result.json();
    
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
    console.error('ClickHouse to flat file error:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to export data from ClickHouse' }
    });
  }
};

// Flat File to ClickHouse
exports.flatFileToClickHouse = async (req, res) => {
  try {
    const { 
      host, port, database, username, token, protocol,
      filename, columns, tableName, delimiter = ',',
      createTable = true, tableEngine = 'MergeTree()',
      orderBy = '', primaryKey = ''
    } = req.body;
    
    if (!host || !port || !database || !username || !token || !filename || !tableName) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required parameters' }
      });
    }
    
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({
        success: false,
        error: { message: 'File not found' }
      });
    }
    
    const client = await connectToClickHouse({ host, port, database, username, token, protocol });
    
    // First read column information to determine types
    const fileExt = path.extname(filename).toLowerCase();
    const fileDelimiter = fileExt === '.tsv' ? '\t' : delimiter;
    
    // Read sample rows to determine column types
    const results = [];
    const sampleStream = fs.createReadStream(filePath)
      .pipe(csv({ separator: fileDelimiter }));
    
    for await (const data of sampleStream) {
      results.push(data);
      if (results.length >= 100) break; // Sample 100 rows max
    }
    
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'File contains no data' }
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
        error: { message: 'No valid columns selected' }
      });
    }
    
    // Create table if needed
    if (createTable) {
      const columnDefinitions = columnsToUse.map(col => {
        const clickhouseType = mapTypeToClickHouse(col.type);
        return `${col.name} ${clickhouseType}`;
      }).join(', ');
      
      let createTableQuery = `
        CREATE TABLE ${database}.${tableName} (
          ${columnDefinitions}
        ) ENGINE = ${tableEngine}
      `;
      
      if (orderBy) {
        createTableQuery += ` ORDER BY (${orderBy})`;
      } else if (columnsToUse.length > 0) {
        // Default order by first column if not specified
        createTableQuery += ` ORDER BY (${columnsToUse[0].name})`;
      }
      
      if (primaryKey && primaryKey !== orderBy) {
        createTableQuery += ` PRIMARY KEY (${primaryKey})`;
      }
      
      await client.exec({
        query: createTableQuery
      });
    }
    
    // Now read the file and insert data in batches
    const columnNames = columnsToUse.map(col => col.name);
    let recordCount = 0;
    const batchSize = 10000;
    let batch = [];
    
    const dataStream = fs.createReadStream(filePath)
      .pipe(csv({ separator: fileDelimiter }));
    
    for await (const row of dataStream) {
      // Only include selected columns
      const filteredRow = {};
      columnNames.forEach(col => {
        if (row[col] !== undefined) {
          filteredRow[col] = row[col];
        }
      });
      
      batch.push(filteredRow);
      
      // Insert when batch is full
      if (batch.length >= batchSize) {
        await client.insert({
          table: tableName,
          values: batch,
          format: 'JSONEachRow'
        });
        
        recordCount += batch.length;
        batch = [];
      }
    }
    
    // Insert remaining records
    if (batch.length > 0) {
      await client.insert({
        table: tableName,
        values: batch,
        format: 'JSONEachRow'
      });
      recordCount += batch.length;
    }
    
    return res.status(200).json({
      success: true,
      recordCount,
      table: tableName,
      message: `Successfully imported ${recordCount} records to ClickHouse table ${tableName}`
    });
  } catch (error) {
    console.error('Flat file to ClickHouse error:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to import data to ClickHouse' }
    });
  }
};

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