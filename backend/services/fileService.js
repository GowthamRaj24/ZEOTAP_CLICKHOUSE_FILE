const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const readline = require('readline');

/**
 * Detect columns from a flat file
 * @param {String} filePath - Path to the file
 * @param {String} delimiter - Delimiter character
 * @returns {Promise<Array>} - Column definitions
 */
exports.detectColumns = async (filePath, delimiter = ',') => {
  return new Promise((resolve, reject) => {
    const columns = [];
    let sampleRow = null;
    
    fs.createReadStream(filePath)
      .pipe(csv({ separator: delimiter }))
      .on('headers', (headers) => {
        headers.forEach(header => {
          columns.push({
            name: header,
            type: 'String', // Default type
            sample: null
          });
        });
      })
      .on('data', (row) => {
        if (!sampleRow) {
          sampleRow = row;
          
          // Update columns with sample data and inferred types
          columns.forEach(column => {
            const value = row[column.name];
            column.sample = value;
            column.type = inferType(value);
          });
          
          // End the stream after first row for efficiency
          this.destroy();
        }
      })
      .on('end', () => {
        resolve(columns);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Preview data from a flat file
 * @param {String} filePath - Path to the file
 * @param {String} delimiter - Delimiter character
 * @param {Array} columns - Columns to include (optional)
 * @param {Number} limit - Maximum number of rows to return
 * @returns {Promise<Object>} - Preview data and total line count
 */
exports.previewFileData = async (filePath, delimiter = ',', columns, limit = 100) => {
  return new Promise((resolve, reject) => {
    const data = [];
    
    fs.createReadStream(filePath)
      .pipe(csv({ separator: delimiter }))
      .on('data', (row) => {
        if (data.length < limit) {
          // If columns specified, only include those columns
          if (columns && columns.length > 0) {
            const filteredRow = {};
            columns.forEach(col => {
              filteredRow[col] = row[col];
            });
            data.push(filteredRow);
          } else {
            data.push(row);
          }
        }
      })
      .on('end', async () => {
        const totalLines = await exports.countFileLines(filePath);
        resolve({ data, totalLines });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Count total lines in a file
 * @param {String} filePath - Path to the file
 * @returns {Promise<Number>} - Total line count
 */
exports.countFileLines = async (filePath) => {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });
    
    rl.on('line', () => {
      lineCount++;
    });
    
    rl.on('close', () => {
      // Subtract 1 for header row
      resolve(lineCount > 0 ? lineCount - 1 : 0);
    });
    
    rl.on('error', (error) => {
      reject(error);
    });
  });
};

/**
 * Write data to a CSV file
 * @param {String} filePath - Output file path
 * @param {Array} headers - Column headers
 * @param {Array} data - Data to write
 * @param {String} delimiter - Delimiter character
 * @returns {Promise<void>}
 */
exports.writeCSV = async (filePath, headers, data, delimiter = ',') => {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers.map(header => ({ id: header, title: header })),
    fieldDelimiter: delimiter
  });
  
  return csvWriter.writeRecords(data);
};

/**
 * Read data from a CSV file
 * @param {String} filePath - Path to the file
 * @param {String} delimiter - Delimiter character
 * @param {Array} columns - Columns to include (optional)
 * @returns {Promise<Array>} - File data
 */
exports.readCSV = async (filePath, delimiter = ',', columns) => {
  return new Promise((resolve, reject) => {
    const data = [];
    
    fs.createReadStream(filePath)
      .pipe(csv({ separator: delimiter }))
      .on('data', (row) => {
        // If columns specified, only include those columns
        if (columns && columns.length > 0) {
          const filteredRow = {};
          columns.forEach(col => {
            filteredRow[col] = row[col];
          });
          data.push(filteredRow);
        } else {
          data.push(row);
        }
      })
      .on('end', () => {
        resolve(data);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Infer data type from a value
 * @param {any} value - The value to analyze
 * @returns {String} - Inferred data type
 */
function inferType(value) {
  if (value === null || value === undefined || value === '') {
    return 'String';
  }
  
  // Try to convert to number
  const num = Number(value);
  if (!isNaN(num)) {
    // Check if it's an integer
    if (Number.isInteger(num)) {
      return 'Integer';
    }
    return 'Float';
  }
  
  // Try to convert to date
  const date = new Date(value);
  if (date instanceof Date && !isNaN(date)) {
    return 'DateTime';
  }
  
  // Check if boolean
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    return 'Boolean';
  }
  
  // Default to string
  return 'String';
} 