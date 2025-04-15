const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const { pipeline } = require('stream/promises');
const { Transform } = require('stream');
const fileService = require('./fileService');
const clickhouseService = require('./clickhouseService');

/**
 * Export data from ClickHouse to a flat file
 * @param {Object} client - ClickHouse client
 * @param {Object} options - Export options
 * @returns {Promise<Number>} - Number of records exported
 */
exports.exportFromClickhouse = async (client, options) => {
  const {
    database,
    table,
    columns,
    outputPath,
    delimiter = ',',
    onProgress = () => {},
    limit = 200 // Default limit to 200 rows
  } = options;
  
  // Create the CSV/TSV writer
  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: columns.map(col => ({ id: col, title: col })),
    fieldDelimiter: delimiter
  });

  try {
    // Build the query with a hard limit of 200 rows
    const columnsStr = columns.join(', ');
    const query = `SELECT ${columnsStr} FROM ${database}.${table} LIMIT ${limit}`;
    
    console.log(`Executing query with limit ${limit}: ${query}`);
    
    // Execute the query to get the top 200 rows
    const result = await client.query(query).toPromise();
    
    console.log(`Retrieved ${result.length} rows from ClickHouse`);
    
    // Write results to file
    await csvWriter.writeRecords(result);
    
    // Report progress
    onProgress(result.length);
    
    console.log(`Completed export of ${result.length} rows to ${outputPath}`);
    
    return { success: true, recordCount: result.length };
  } catch (error) {
    console.error('Error exporting from ClickHouse:', error);
    throw error;
  }
};

/**
 * Import data from a flat file to ClickHouse
 * @param {Object} client - ClickHouse client
 * @param {Object} options - Import options
 * @returns {Promise<Number>} - Number of records imported
 */
exports.importToClickhouse = async (client, options) => {
  const {
    filePath,
    delimiter = ',',
    columns,
    targetTable,
    database,
    onProgress = () => {}
  } = options;
  
  try {
    // First, get column definitions to create table if needed
    const columnDefs = await fileService.detectColumns(filePath, delimiter);
    
    // Create table if it doesn't exist
    await clickhouseService.createTable(
      client,
      database,
      targetTable,
      columnDefs
    );
    
    // Read data from file in batches
    const batchSize = 10000;
    let batch = [];
    let totalImported = 0;
    let lastProgressUpdate = 0;
    
    // Process file in streaming mode to handle large files
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ separator: delimiter }))
        .on('data', async (row) => {
          // Filter columns if specified
          if (columns && columns.length > 0) {
            const filteredRow = {};
            columns.forEach(col => {
              filteredRow[col] = row[col];
            });
            batch.push(filteredRow);
          } else {
            batch.push(row);
          }
          
          // If batch is full, insert into ClickHouse
          if (batch.length >= batchSize) {
            try {
              // Pause the stream while inserting
              this.pause();
              
              await clickhouseService.insertData(client, database, targetTable, batch);
              
              totalImported += batch.length;
              batch = [];
              
              // Report progress periodically
              if (totalImported - lastProgressUpdate >= 10000) {
                onProgress(totalImported);
                lastProgressUpdate = totalImported;
              }
              
              // Resume reading
              this.resume();
            } catch (error) {
              reject(error);
            }
          }
        })
        .on('end', async () => {
          try {
            // Insert any remaining records
            if (batch.length > 0) {
              await clickhouseService.insertData(client, database, targetTable, batch);
              totalImported += batch.length;
            }
            
            // Final progress update
            onProgress(totalImported);
            
            resolve(totalImported);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error importing to ClickHouse:', error);
    throw error;
  }
};

/**
 * Format a value for CSV output
 * @param {any} value - The value to format
 * @param {string} delimiter - The delimiter used in the CSV
 * @returns {string} - Formatted value
 */
function formatCsvValue(value, delimiter) {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Convert to string
  value = String(value);
  
  // Check if value contains delimiter, quotes, or newlines
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
    // Escape quotes by doubling them
    value = value.replace(/"/g, '""');
    // Wrap in quotes
    return `"${value}"`;
  }
  
  return value;
} 