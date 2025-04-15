const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { ApiError } = require('../utils/errorHandler');
const fileService = require('../services/fileService');

/**
 * Upload flat file
 */
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError('No file uploaded', 400);
    }
    
    const fileInfo = {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadDate: new Date()
    };
    
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    next(new ApiError(`File upload failed: ${error.message}`, 400));
  }
};

/**
 * Get columns from flat file
 */
exports.getColumns = async (req, res, next) => {
  try {
    const { filePath, delimiter = ',' } = req.body;
    
    if (!filePath) {
      throw new ApiError('File path is required', 400);
    }
    
    const fullPath = path.join(__dirname, '../', filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new ApiError('File not found', 404);
    }
    
    // Get the first row to determine columns
    const columns = await fileService.detectColumns(fullPath, delimiter);
    
    res.status(200).json({
      success: true,
      columns
    });
  } catch (error) {
    next(new ApiError(`Failed to get columns: ${error.message}`, 400));
  }
};

/**
 * Preview data from flat file
 */
exports.previewData = async (req, res, next) => {
  try {
    const { filePath, delimiter = ',', columns, limit = 100 } = req.body;
    
    if (!filePath) {
      throw new ApiError('File path is required', 400);
    }
    
    const fullPath = path.join(__dirname, '../', filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new ApiError('File not found', 404);
    }
    
    // Get preview data
    const { data, totalLines } = await fileService.previewFileData(
      fullPath, 
      delimiter, 
      columns, 
      limit
    );
    
    res.status(200).json({
      success: true,
      data,
      totalCount: totalLines
    });
  } catch (error) {
    next(new ApiError(`Failed to preview data: ${error.message}`, 400));
  }
};

/**
 * List all uploaded files
 */
exports.listFiles = async (req, res, next) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({
        success: true,
        files: []
      });
    }
    
    const files = fs.readdirSync(uploadsDir)
      .filter(file => !file.startsWith('.')) // Exclude hidden files
      .map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          path: `uploads/${file}`,
          size: stats.size,
          uploadDate: stats.mtime
        };
      });
    
    res.status(200).json({
      success: true,
      files
    });
  } catch (error) {
    next(new ApiError(`Failed to list files: ${error.message}`, 400));
  }
}; 