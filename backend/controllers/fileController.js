const path = require('path')
const fs = require('fs-extra')
const csv = require('csv-parser')
const { createObjectCsvWriter } = require('csv-writer')
const { ClickHouseClient } = require('@clickhouse/client')

// Define the uploads directory path consistently across the application
const uploadsDir = path.join(__dirname, '..', 'uploads')

// Ensure the uploads directory exists
fs.ensureDirSync(uploadsDir)

// Helper function to determine column type - Keep this for now, might simplify later
function determineColumnType(values) {
  // Skip null/undefined/empty values
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '')
  
  if (nonEmptyValues.length === 0) return 'String'
  
  // Check if all values are numbers
  const allNumbers = nonEmptyValues.every(v => !isNaN(Number(v)))
  if (allNumbers) {
    // Check if all values are integers
    const allIntegers = nonEmptyValues.every(v => Number.isInteger(Number(v)))
    return allIntegers ? 'Int64' : 'Float64' // Use larger types
  }
  
  // Check if all values are valid dates (simple ISO format check)
  const datePattern = /^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(.\\d+)?Z?)?$/
  const allDates = nonEmptyValues.every(v => datePattern.test(v))
  // Consider checking for common date formats if needed
  // if (allDates) return 'DateTime64' // Or DateTime

  // Default to string
  return 'String'
}

// REMOVED exports.getColumns function (using body params) - This logic is merged/simplified below

// REMOVED exports.previewData function (or needs significant refactor if kept)

// REMOVED exports.listFiles function

// REMOVED ClickHouse specific listing/preview functions (these belong in clickhouseController)
// exports.listClickHouseTables
// exports.getClickHouseColumns
// exports.previewClickHouseData
// exports.clickHouseToFlatFile

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