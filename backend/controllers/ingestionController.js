const path = require('path');
const fs = require('fs');
const { ClickHouse } = require('clickhouse');
const { ApiError } = require('../utils/errorHandler');
const fileService = require('../services/fileService');
const clickhouseService = require('../services/clickhouseService');
const ingestionService = require('../services/ingestionService');

// In-memory store for tracking job status
// In a production app, you would use Redis or a database
const jobStatus = new Map();

// Add this function to match the client used in clickhouseController
function createClickHouseClient(config) {
  const { host, port, database, username, password, jwtToken, protocol = 'https' } = config;
  
  console.log(`Connecting to ClickHouse with URL: ${protocol}://${host}:${port}`);
  
  // Use password or JWT token based on what's provided
  const authPassword = jwtToken || password;
  
  // Create client with same config as in clickhouseController
  return new ClickHouse({
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
}

/**
 * Transfer data from ClickHouse to CSV file
 */
exports.clickhouseToFile = async (req, res, next) => {
  try {
    // Get connection config from middleware
    const clickhouse = req.connectionConfig;
    
    const { 
      table,
      columns,
      filename = `export-${Date.now()}.csv`
    } = req.body;
    
    // Always use CSV format with comma delimiter
    const outputFormat = 'csv';
    const delimiter = ',';
    
    if (!table || !columns || columns.length === 0) {
      throw new ApiError('Missing required parameters', 400);
    }
    
    // Generate a unique job ID
    const jobId = Date.now().toString();
    console.log('Created new job with ID:', jobId);
    
    // Initialize job status
    jobStatus.set(jobId, {
      status: 'started',
      progress: 0,
      message: 'Initializing CSV export',
      recordsProcessed: 0,
      totalRecords: 0,
      startTime: new Date(),
      endTime: null,
      outputFile: `uploads/${filename}` // Set this from the beginning
    });
    
    // Start the ingestion process asynchronously
    const outputPath = path.join(__dirname, '../uploads', filename);
    
    // Return job ID immediately
    res.status(202).json({
      success: true,
      message: 'Data transfer initiated',
      jobId,
      outputFile: `uploads/${filename}`
    });
    
    // Process in the background
    try {
      // Create ClickHouse client with our updated function
      const client = createClickHouseClient(clickhouse);
      
      // Get total count for progress tracking - updated to use toPromise()
      const countResult = await client.query(`SELECT count() as total FROM ${clickhouse.database || 'default'}.${table}`).toPromise();
      const totalRecords = countResult[0]?.total || 0;
      
      // Update job status
      jobStatus.set(jobId, {
        ...jobStatus.get(jobId),
        totalRecords,
        message: 'Exporting data'
      });
      
      // Start the data transfer with our updated function
      await ingestionService.exportFromClickhouse(
        client,
        {
          database: clickhouse.database || 'default',
          table,
          columns,
          outputPath,
          delimiter,
          onProgress: (processed) => {
            // Update progress
            const progress = Math.min(Math.round((processed / totalRecords) * 100), 99);
            jobStatus.set(jobId, {
              ...jobStatus.get(jobId),
              progress,
              recordsProcessed: processed,
              message: `Exported ${processed} of ${totalRecords} records`,
              outputFile: `uploads/${filename}`  // Add this so the file is available for download
            });
          }
        }
      );
      
      // Mark job as completed
      jobStatus.set(jobId, {
        ...jobStatus.get(jobId),
        status: 'completed',
        progress: 100,
        recordsProcessed: totalRecords,
        message: `Successfully exported ${totalRecords} records`,
        endTime: new Date(),
        outputFile: `uploads/${filename}` // Add this for the frontend to access
      });
    } catch (error) {
      // Mark job as failed
      jobStatus.set(jobId, {
        ...jobStatus.get(jobId),
        status: 'failed',
        message: `Export failed: ${error.message}`,
        endTime: new Date()
      });
      
      console.error(`Job ${jobId} failed:`, error);
    }
  } catch (error) {
    next(new ApiError(`Failed to start transfer: ${error.message}`, 400));
  }
};

/**
 * Transfer data from flat file to ClickHouse
 */
exports.fileToClickhouse = async (req, res, next) => {
  try {
    const { 
      clickhouse, // Connection details
      filePath,
      delimiter = ',',
      columns,
      targetTable
    } = req.body;
    
    if (!clickhouse || !filePath || !targetTable) {
      throw new ApiError('Missing required parameters', 400);
    }
    
    const fullPath = path.join(__dirname, '../', filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new ApiError('File not found', 404);
    }
    
    // Generate a unique job ID
    const jobId = Date.now().toString();
    
    // Initialize job status
    jobStatus.set(jobId, {
      status: 'started',
      progress: 0,
      message: 'Initializing transfer',
      recordsProcessed: 0,
      totalRecords: 0,
      startTime: new Date(),
      endTime: null
    });
    
    // Return job ID immediately
    res.status(202).json({
      success: true,
      message: 'Data transfer initiated',
      jobId
    });
    
    // Process in the background
    try {
      // Create ClickHouse client
      const client = createClickHouseClient(clickhouse);
      
      // Count total lines in file for progress tracking
      const totalLines = await fileService.countFileLines(fullPath);
      
      // Update job status
      jobStatus.set(jobId, {
        ...jobStatus.get(jobId),
        totalRecords: totalLines,
        message: 'Importing data'
      });
      
      // Start the data transfer
      await ingestionService.importToClickhouse(
        client,
        {
          filePath: fullPath,
          delimiter,
          columns,
          targetTable,
          database: clickhouse.database || 'default',
          onProgress: (processed) => {
            // Update progress
            const progress = Math.min(Math.round((processed / totalLines) * 100), 99);
            jobStatus.set(jobId, {
              ...jobStatus.get(jobId),
              progress,
              recordsProcessed: processed,
              message: `Imported ${processed} of ${totalLines} records`
            });
          }
        }
      );
      
      // Mark job as completed
      jobStatus.set(jobId, {
        ...jobStatus.get(jobId),
        status: 'completed',
        progress: 100,
        recordsProcessed: totalLines,
        message: `Successfully imported ${totalLines} records`,
        endTime: new Date()
      });
    } catch (error) {
      // Mark job as failed
      jobStatus.set(jobId, {
        ...jobStatus.get(jobId),
        status: 'failed',
        message: `Import failed: ${error.message}`,
        endTime: new Date()
      });
      
      console.error(`Job ${jobId} failed:`, error);
    }
  } catch (error) {
    next(new ApiError(`Failed to start transfer: ${error.message}`, 400));
  }
};

/**
 * Get status of an ingestion job
 */
exports.getStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    console.log('Looking for job with ID:', jobId);
    console.log('Available jobs:', Array.from(jobStatus.keys()));
    
    if (!jobId) {
      throw new ApiError('Job ID is required', 400);
    }
  
    if (!jobStatus.has(jobId)) {
      // Instead of throwing an error, return a more helpful response
      return res.status(404).json({
        success: false,
        message: 'Job not found or may have expired',
        job: {
          status: 'unknown',
          message: 'Job not found or may have expired. Please start a new export.'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      job: jobStatus.get(jobId)
    });
  } catch (error) {
    next(new ApiError(`Failed to get job status: ${error.message}`, 400));
  }
}; 