import React, { useState } from 'react'
import { clickhouseApi } from '../services/api'
import { FaFileAlt, FaDatabase, FaTable, FaEye, FaInfoCircle } from 'react-icons/fa'
import { notify } from '../config/toastConfig'

function FileToClickHouse() {
  const [file, setFile] = useState(null)
  const [delimiter, setDelimiter] = useState(',') // Default to comma
  const [tableName, setTableName] = useState('') // Target table name
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [importResult, setImportResult] = useState(null) // To show success message
  const [previewData, setPreviewData] = useState(null) // For file preview
  const [previewLoading, setPreviewLoading] = useState(false) // Loading state for preview

  // Handle file change
  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Automatically set delimiter based on file extension
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      if (fileExtension === 'tsv') {
        setDelimiter('\t'); // Tab delimiter for TSV
      } else {
        setDelimiter(','); // Default to comma for CSV
      }
      
      setError(null); // Reset error on new file selection
      setImportResult(null);
      setPreviewData(null);
    } else {
      setFile(null);
    }
  }

  // Preview CSV file (read top 5 rows)
  const handlePreview = () => {
    if (!file) {
      notify.error('Please select a file first')
      return
    }

    // Check file extension
    const fileExtension = file.name.split('.').pop().toLowerCase()
    if (fileExtension !== 'csv' && fileExtension !== 'tsv') {
      notify.error('Only CSV and TSV files can be previewed')
      return
    }

    setPreviewLoading(true)
    setPreviewData(null)

    // Use FileReader to read file contents
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const contents = e.target.result
        
        // Normalize line endings (handle CR, LF, CRLF)
        const normalizedContent = contents.replace(/\r\n?/g, '\n')
        
        // Split into lines and filter out empty lines
        const lines = normalizedContent.split('\n').filter(line => line.trim() !== '')
        
        if (lines.length === 0) {
          notify.error('File appears to be empty')
          setPreviewLoading(false)
          return
        }

        // Parse header (first line)
        const headers = parseCSVLine(lines[0])
        
        if (headers.length === 0) {
          notify.error(`Could not parse ${fileExtension.toUpperCase()} headers. Please check file format.`)
          setPreviewLoading(false)
          return
        }
        
        // Detect and handle duplicate headers
        const uniqueHeaders = [];
        const headerCounts = {};
        
        headers.forEach(header => {
          const cleanHeader = header.trim() || 'unnamed_column';
          
          if (!headerCounts[cleanHeader]) {
            headerCounts[cleanHeader] = 1;
            uniqueHeaders.push(cleanHeader);
          } else {
            headerCounts[cleanHeader]++;
            uniqueHeaders.push(`${cleanHeader}_${headerCounts[cleanHeader]}`);
          }
        });
        
        // Parse up to 5 data rows
        const rows = []
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
          if (lines[i].trim()) {
            const rowData = parseCSVLine(lines[i])
            const row = {}
            
            // Map data to headers, handling case where we have more or fewer columns than headers
            uniqueHeaders.forEach((header, index) => {
              row[header] = index < rowData.length ? rowData[index] : ''
            })
            
            rows.push(row)
          }
        }
        
        // If we successfully parsed the header but got no rows, show a warning
        if (rows.length === 0) {
          notify.warning(`${fileExtension.toUpperCase()} file has headers but no data rows were found.`)
        }

        setPreviewData({ 
          headers: uniqueHeaders, 
          rows 
        })
      } catch (error) {
        console.error('Error parsing file:', error)
        notify.error(`Failed to parse ${fileExtension.toUpperCase()} file: ${error.message}`)
      } finally {
        setPreviewLoading(false)
      }
    }

    reader.onerror = () => {
      notify.error('Failed to read file')
      setPreviewLoading(false)
    }

    reader.readAsText(file)
  }

  // Enhanced CSV/TSV line parser (handles quotes, delimiters, and escaped characters)
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    const separatorChar = delimiter; // Use the current delimiter state
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes) {
          // Check for escaped quote (two double quotes together inside quotes)
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';  // Add one quote to the field
            i++;  // Skip the next quote
          } else {
            // End of quoted section
            inQuotes = false;
          }
        } else {
          // Start of quoted section
          inQuotes = true;
        }
      } else if (char === separatorChar && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Don't forget the last field
    result.push(current);
    
    return result;
  }

  // Estimate total rows in file based on preview data and file size
  const estimateTotalRows = () => {
    if (!file || !previewData || !previewData.rows || previewData.rows.length === 0) {
      return 'Unknown';
    }
    
    // Calculate average row size from preview data (in bytes)
    const previewText = previewData.headers.join(',') + '\n' + 
      previewData.rows.map(row => Object.values(row).join(',')).join('\n');
    
    const avgRowSize = previewText.length / (previewData.rows.length + 1); // +1 for header
    
    // Estimate total rows based on file size and avg row size
    const estimatedRows = Math.round(file.size / avgRowSize);
    
    // Format the number with commas
    return estimatedRows.toLocaleString();
  };

  // Handle data import directly
  const handleImport = async () => {
    setError(null)
    setImportResult(null)

    if (!file) {
      notify.error('Please select a file')
      return
    }
    if (!tableName || !tableName.trim()) {
      notify.error('Please enter a target table name')
      return
    }
    // Basic table name validation (alphanumeric + underscore, starting with letter or underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName.trim())) {
        notify.error('Invalid table name. Use letters, numbers, and underscores, starting with a letter or underscore.')
        return
    }

    // Check file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'csv' && fileExtension !== 'tsv') {
      notify.error('Please select a CSV or TSV file')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      // Append other data as strings
      formData.append('tableName', tableName.trim())
      formData.append('delimiter', delimiter)
      formData.append('sanitizeHeaders', 'true') // Add flag to sanitize headers with spaces

      // Use the new direct import API call
      const response = await clickhouseApi.importFileToClickHouse(formData)

      if (response.data.success) {
        setImportResult(response.data) // Store result for display
        notify.success(response.data.message || 'Import successful!')
        setFile(null) // Clear file input after successful import
        setPreviewData(null) // Clear preview data
        // Optionally clear table name too, or keep it for next import
        // setTableName('')
      } else {
        throw new Error(response.data.error || 'Import failed')
      }
    } catch (err) {
      console.error('Import error:', err)
      
      // Extract error messages - both user-friendly and technical
      let errorMessage = 'Failed to import data';
      let technicalError = null;
      let solution = '';
      let recordsProcessed = 0;
      
      if (err.response?.data) {
        errorMessage = err.response.data.error || errorMessage;
        technicalError = err.response.data.details || null;
        solution = err.response.data.solution || '';
        recordsProcessed = err.response.data.recordCount || 0;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Include information about how many records were processed before the error
      const processedMessage = recordsProcessed > 0 
        ? `Processed ${recordsProcessed} rows before the error occurred.` 
        : '';
      
      setError({
        message: errorMessage,
        technical: technicalError,
        solution: solution,
        processed: processedMessage
      });
      
      notify.error(`Import failed: ${errorMessage}`);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">CSV/TSV to ClickHouse</h1>
        <p className="text-xl text-gray-600 mt-2">
          Import data from CSV or TSV files to your ClickHouse database
        </p>
      </div>
      
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaFileAlt className="mr-2" /> File & Import Settings
        </h2>
        
        {/* File Input */}
        <div className="mb-4">
          <label htmlFor="file-input" className="block text-gray-700 mb-1">
            Select File
          </label>
          <input
            id="file-input"
            type="file"
            accept=".csv,.tsv" 
            onChange={handleFileChange}
            className="block w-full text-sm text-secondary-700
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100 cursor-pointer
                      border border-secondary-300 rounded-lg p-2.5"
            disabled={loading}
          />
          {file && (
            <div className="mt-2">
              <p className="text-sm text-secondary-600 flex items-center">
                <FaFileAlt className="mr-1" />
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading}
                className="mt-2 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <FaEye className="mr-1" />
                {previewLoading ? 'Loading Preview...' : 'Preview Data (First 5 Rows)'}
              </button>
            </div>
          )}
          <p className="mt-1 text-xs text-secondary-500">
            CSV and TSV files are supported. Columns will be detected from the first row (header row).
          </p>
        </div>

        {/* Table Name Input */}
        <div className="mb-4">
            <label htmlFor="table-name-input" className="block text-gray-700 mb-1 flex items-center">
                <FaTable className="mr-2" /> Target Table Name
            </label>
            <input
                id="table-name-input"
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Enter target table name (e.g., my_imported_data)"
                className="mt-1 block w-full rounded-md border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5"
                disabled={loading}
            />
             <p className="mt-1 text-xs text-secondary-500">
                The table will be created if it doesn't exist. Columns will be inferred as String type.
             </p>
        </div>

        <div className="mt-3 flex items-start">
          <FaInfoCircle className="text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600">
            For best results, ensure your CSV file has a header row and consistent data formatting. Maximum recommended file size is 100MB.
          </p>
        </div>
        
        {previewData && previewData.headers.some(header => header.includes(' ')) && (
          <div className="mt-3 flex items-start bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <svg className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-medium text-yellow-800">
                Warning: Column names with spaces detected
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Your CSV has column names with spaces, which may cause import errors. Spaces will be automatically replaced with underscores during import.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Data Preview Section */}
      {previewData && (
        <div className="card mb-6 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FaEye className="mr-2" /> CSV Preview (First 5 Rows)
          </h2>
          
          {/* File Statistics */}
          <div className="mb-4 bg-primary-50 p-3 rounded-md border border-primary-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex items-center">
                <div className="p-1.5 rounded-md bg-primary-100 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-primary-700">Columns Detected</p>
                  <p className="font-semibold text-sm">{previewData.headers.length}</p>
                </div>
              </div>
              
           
              <div className="flex items-center">
                <div className="p-1.5 rounded-md bg-primary-100 mr-2">
                  <FaFileAlt className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-primary-700">File Size</p>
                  <p className="font-semibold text-sm">{file ? Math.round(file.size / 1024) + ' KB' : 'Unknown'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="p-1.5 rounded-md bg-primary-100 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582a1 1 0 00-.646.934v4.286a1 1 0 00.646.934L9 13.641V15a1 1 0 001 1h.006a1 1 0 00.994-1v-1.359l3.954-1.582a1 1 0 00.646-.934V6.857a1 1 0 00-.646-.934L11 4.323V3a1 1 0 00-1-1zm-2.5 5.5a.5.5 0 11-1 0 .5.5 0 011 0zm1.5 1.5a.5.5 0 100-1 .5.5 0 000 1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-primary-700">Total Rows</p>
                  <p className="font-semibold text-sm">{estimateTotalRows()}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  {previewData.headers.map((header, index) => (
                    <th 
                      key={index}
                      className="px-3 py-2 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {previewData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-secondary-50'}>
                    {previewData.headers.map((header, cellIndex) => (
                      <td 
                        key={`${rowIndex}-${cellIndex}`}
                        className="px-3 py-2 text-sm text-secondary-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                      >
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-secondary-600 italic">
            This is a preview of the first 5 rows of your CSV file. All columns will be imported as string types initially.
          </p>
        </div>
      )}

      {/* Import Action Card */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
            <FaDatabase className="mr-2" /> Import to ClickHouse
        </h2>
        
        <button
          onClick={handleImport}
          className="btn btn-primary w-full md:w-auto"
          disabled={!file || !tableName.trim() || loading}
        >
          {loading ? 'Importing...' : 'Import CSV to ClickHouse'}
        </button>
      </div>

      {/* Result/Error Display */}
        {(importResult || error) && (
            <div className="card mb-6">
                <h2 className="text-xl font-bold mb-4">Import Status</h2>
                {importResult && (
                    <div className="p-4 bg-green-50 text-green-800 rounded-lg">
                        <p className="font-medium text-lg mb-2 flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Import successful!
                        </p>
                        <p className="mb-4">{importResult.message}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-md bg-green-100 mr-3">
                                        <FaTable className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Target Table</p>
                                        <p className="font-semibold">{importResult.tableName}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-md bg-green-100 mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Columns</p>
                                        <p className="font-semibold">{importResult.columnCount || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-md bg-green-100 mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Records Processed</p>
                                        <p className="font-semibold">{importResult.recordCount !== undefined ? importResult.recordCount.toLocaleString() : 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <p className="mt-4 text-sm text-green-700">
                            <svg className="inline-block h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h.01a1 1 0 100-2H9z" clipRule="evenodd" />
                            </svg>
                            The table data is now available in ClickHouse and ready for queries.
                        </p>
                    </div>
                )}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg">
                        <p className="font-medium flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Import failed:
                        </p>
                        <p className="mt-2">{typeof error === 'object' ? error.message : error}</p>
                        
                        {typeof error === 'object' && error.processed && (
                            <p className="mt-2 text-sm text-red-700">{error.processed}</p>
                        )}
                        
                        {typeof error === 'object' && error.solution && (
                            <div className="mt-3 bg-red-100 p-3 rounded-md border border-red-200">
                                <p className="font-medium flex items-center text-red-800">
                                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h.01a1 1 0 100-2H9z" clipRule="evenodd" />
                                    </svg>
                                    Suggested solution:
                                </p>
                                <p className="text-sm text-red-700 mt-1">{error.solution}</p>
                            </div>
                        )}
                        
                        {typeof error === 'object' && error.technical && (
                            <details className="mt-3 text-sm">
                                <summary className="cursor-pointer font-medium text-red-700">Technical details</summary>
                                <div className="mt-2 p-2 bg-red-100 rounded font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                                    {error.technical}
                                </div>
                            </details>
                        )}
                        
                        <p className="mt-4 text-sm text-red-700">
                            <svg className="inline-block h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h.01a1 1 0 100-2H9z" clipRule="evenodd" />
                            </svg>
                            Please check your file format and try again. Make sure all values comply with ClickHouse column limits.
                        </p>
                    </div>
                )}
            </div>
        )}
    </div>
  )
}

export default FileToClickHouse 