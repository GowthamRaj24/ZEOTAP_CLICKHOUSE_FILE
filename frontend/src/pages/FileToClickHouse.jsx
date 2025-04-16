import React, { useState } from 'react'
import { clickhouseApi } from '../services/api'
import { FaFileAlt, FaDatabase, FaTable } from 'react-icons/fa'
import { notify } from '../config/toastConfig'

function FileToClickHouse() {
  const [file, setFile] = useState(null)
  const [delimiter, setDelimiter] = useState(',') // Default to comma
  const [tableName, setTableName] = useState('') // Target table name
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [importResult, setImportResult] = useState(null) // To show success message

  // Handle file change
  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0])
      setError(null) // Reset error on new file selection
      setImportResult(null) // Reset result
    } else {
      setFile(null)
    }
  }

  // Handle data import directly
  const handleImport = async () => {
    setError(null)
    setImportResult(null)

    if (!file) {
      notify.error('Please select a file')
      return
    }
    if (!delimiter) {
        notify.error('Please select a delimiter')
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

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      // Append other data as strings
      formData.append('tableName', tableName.trim())
      formData.append('delimiter', delimiter)

      // Use the new direct import API call
      const response = await clickhouseApi.importFileToClickHouse(formData)

      if (response.data.success) {
        setImportResult(response.data) // Store result for display
        notify.success(response.data.message || 'Import successful!')
        setFile(null) // Clear file input after successful import
        // Optionally clear table name too, or keep it for next import
        // setTableName('')
      } else {
        throw new Error(response.data.error || 'Import failed')
      }
    } catch (err) {
      console.error('Import error:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Failed to import data'
      setError(errorMessage)
      notify.error(`Import failed: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">File to ClickHouse</h1>
        <p className="text-xl text-gray-600 mt-2">
          Import data directly from CSV/TSV files to your ClickHouse database
        </p>
      </div>
      
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaFileAlt className="mr-2" /> File & Import Settings
        </h2>
        
        {/* File Input */}
        <div className="mb-4">
          <label htmlFor="file-input" className="block text-gray-700 mb-1">
            Select File (CSV or TSV)
          </label>
          <input
            id="file-input"
            type="file"
            accept=".csv,.tsv,.txt" // Keep accepting common extensions
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
            <p className="mt-2 text-sm text-secondary-600 flex items-center">
              <FaFileAlt className="mr-1" />
              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
        </div>

        {/* Delimiter Selection */}
         <div className="mb-4">
          <label htmlFor="delimiter-select" className="block text-gray-700 mb-1">
            Delimiter
          </label>
          <select
            id="delimiter-select"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 bg-white"
            disabled={loading}
          >
            <option value=",">Comma (,)</option>
            <option value="\t">Tab (\t)</option>
            {/* Add other delimiters if needed */}
             <option value=";">Semicolon (;)</option>
             <option value="|">Pipe (|)</option>
          </select>
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
                className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5"
                disabled={loading}
            />
             <p className="mt-1 text-xs text-secondary-500">
                The table will be created if it doesn't exist. Columns will be inferred as String type.
             </p>
        </div>
      </div>

      {/* Import Action Card */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
            <FaDatabase className="mr-2" /> Import to ClickHouse
        </h2>
        
        <button
          onClick={handleImport}
          className="btn btn-primary w-full md:w-auto"
          disabled={!file || !delimiter || !tableName.trim() || loading}
        >
          {loading ? 'Importing...' : 'Import Data to ClickHouse'}
        </button>
      </div>

      {/* Result/Error Display */}
        {(importResult || error) && (
            <div className="card mb-6">
                <h2 className="text-xl font-bold mb-4">Import Status</h2>
                {importResult && (
                    <div className="p-4 bg-green-50 text-green-800 rounded-lg">
                        <p className="font-medium">Import successful!</p>
                        <p>{importResult.message}</p>
                        {importResult.recordCount !== undefined && (
                            <p>Records processed/inserted: {importResult.recordCount}</p>
                        )}
                    </div>
                )}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg">
                        <p className="font-medium">Import failed:</p>
                        <p>{error}</p>
                    </div>
                )}
            </div>
        )}
    </div>
  )
}

export default FileToClickHouse 