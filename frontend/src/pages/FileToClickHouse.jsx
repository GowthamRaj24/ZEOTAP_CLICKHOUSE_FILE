import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import ClickHouseForm from '../components/ClickHouseForm'
import { clickhouseApi } from '../services/api'
import ColumnSelector from '../components/ColumnSelector'
import ProgressBar from '../components/ProgressBar'
import { FaUpload, FaTable, FaFileAlt } from 'react-icons/fa'

function FileToClickHouse() {
  const [clickhouseConfig, setClickhouseConfig] = useState(null)
  const [file, setFile] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [columns, setColumns] = useState([])
  const [selectedColumns, setSelectedColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState(null)
  const [totalRecords, setTotalRecords] = useState(0)

  // Handle file change
  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0])
      setUploadedFile(null) // Reset uploaded file state when a new file is selected
      setColumns([])
      setSelectedColumns([])
      setIsComplete(false)
      setError(null)
    }
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await clickhouseApi.uploadFile(formData)
      
      if (response.data.success) {
        setUploadedFile(response.data.filename)
        toast.success('File uploaded successfully')
        
        // Load columns automatically after upload
        await loadColumns(response.data.filename)
      } else {
        throw new Error(response.data.error || 'Failed to upload file')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload file')
      toast.error(`Upload failed: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Load columns from uploaded file
  const loadColumns = async (filename) => {
    try {
      const response = await clickhouseApi.getFileColumns(filename || uploadedFile)
      
      if (response.data.success) {
        setColumns(response.data.columns)
        setSelectedColumns(response.data.columns.map(col => col.name)) // Select all columns by default
      } else {
        throw new Error(response.data.error?.message || 'Failed to load columns')
      }
    } catch (err) {
      console.error('Failed to load columns:', err)
      toast.error(`Failed to load columns: ${err.message || 'Unknown error'}`)
    }
  }

  // Handle data import
  const handleImport = async () => {
    if (!clickhouseConfig) {
      toast.error('Please connect to ClickHouse first')
      return
    }

    if (!uploadedFile) {
      toast.error('Please upload a file first')
      return
    }

    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column')
      return
    }

    setLoading(true)
    setProgress(0)
    setIsComplete(false)
    setError(null)

    try {
      const importResponse = await clickhouseApi.importFile({
        filename: uploadedFile,
        columns: selectedColumns,
        clickhouseConfig
      })

      setTotalRecords(importResponse.data.recordCount || 0)
      setIsComplete(true)
      toast.success(`Successfully imported ${importResponse.data.recordCount} records`)
    } catch (err) {
      console.error('Import error:', err)
      setError(err.message || 'Failed to import data')
      toast.error(`Import failed: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
      setProgress(100) // Set to 100% when done
    }
  }

  // Track progress (simulated for now)
  useEffect(() => {
    if (loading && !isComplete && !error) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5
          if (newProgress >= 90) {
            clearInterval(interval)
            return 90 // We'll set to 100 when actually complete
          }
          return newProgress
        })
      }, 300)
      
      return () => clearInterval(interval)
    }
  }, [loading, isComplete, error])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">File to ClickHouse</h1>
        <p className="text-xl text-gray-600 mt-2">
          Import data from flat files to your ClickHouse database
        </p>
      </div>
      
      <ClickHouseForm onConnect={setClickhouseConfig} isConnected={!!clickhouseConfig} />
      
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">File Upload</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">
            Select File (CSV or TSV)
          </label>
          <input
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-secondary-700
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100 cursor-pointer
                      border border-secondary-300 rounded-lg"
            disabled={loading}
          />
          {file && (
            <p className="mt-2 text-sm text-secondary-600 flex items-center">
              <FaFileAlt className="mr-1" />
              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={handleUpload}
            className="btn btn-primary"
            disabled={!file || loading}
          >
            Upload File
          </button>
          
          {uploadedFile && (
            <button
              onClick={() => loadColumns()}
              className="btn btn-secondary"
              disabled={loading}
            >
              <FaTable className="mr-2" />
              Load Columns
            </button>
          )}
        </div>
      </div>
      
      {columns.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Select Columns</h2>
          
          <ColumnSelector 
            columns={columns}
            selectedColumns={selectedColumns}
            onChange={setSelectedColumns}
            onColumnToggle={(col) => {
              if (selectedColumns.includes(col)) {
                setSelectedColumns(selectedColumns.filter(c => c !== col));
              } else {
                setSelectedColumns([...selectedColumns, col]);
              }
            }}
            onSelectAll={() => setSelectedColumns(columns.map(col => col.name))}
            onSelectNone={() => setSelectedColumns([])}
          />
        </div>
      )}
      
      {(loading || isComplete || error) && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Import Progress</h2>
          
          <ProgressBar 
            progress={progress} 
            isComplete={isComplete}
            error={error}
          />
          
          {isComplete && totalRecords > 0 && (
            <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg">
              <p className="font-medium">Import completed successfully!</p>
              <p>Imported {totalRecords} records to ClickHouse.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">Import to ClickHouse</h2>
        
        <button
          onClick={handleImport}
          className="btn btn-primary"
          disabled={!uploadedFile || selectedColumns.length === 0 || loading || !clickhouseConfig}
        >
          Import Data
        </button>
      </div>
    </div>
  )
}

export default FileToClickHouse 