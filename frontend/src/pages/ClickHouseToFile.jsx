import React, { useState, useEffect } from 'react'
import ClickHouseForm from '../components/ClickHouseForm'
import ColumnSelector from '../components/ColumnSelector'
import DataPreview from '../components/DataPreview'
import ProgressBar from '../components/ProgressBar'
import { clickhouseApi, ingestionApi } from '../services/api'
import { getApiUrl } from '../config/appConfig'
import { notify } from '../config/toastConfig'

function ClickHouseToFile() {
  const [connection, setConnection] = useState(null)
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState('')
  const [columns, setColumns] = useState([])
  const [selectedColumns, setSelectedColumns] = useState([])
  const [previewData, setPreviewData] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')
  const [jobId, setJobId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState(null)
  const [exportFile, setExportFile] = useState(null)
  
  // Load tables when connection changes
  useEffect(() => {
    if (connection) {
      loadTables()
    } else {
      setTables([])
      setSelectedTable('')
      setColumns([])
      setSelectedColumns([])
      setPreviewData(null)
    }
  }, [connection])
  
  // Load columns when selected table changes
  useEffect(() => {
    if (connection && selectedTable) {
      loadColumns(selectedTable)
    } else {
      setColumns([])
      setSelectedColumns([])
      setPreviewData(null)
    }
  }, [selectedTable])
  
  // Monitor job progress
  useEffect(() => {
    if (!jobId) return
    
    const intervalId = setInterval(async () => {
      try {
        const response = await ingestionApi.getStatus(jobId)
        
        // Check if the response contains a job object
        if (!response.data || !response.data.job) {
          setError('Invalid response from server');
          clearInterval(intervalId);
          return;
        }
        
        const job = response.data.job
        
        if (job.status === 'running' || job.status === 'started') {
          // Update progress
          const percentage = job.progress || 0;
          setProgress(percentage);
        } else if (job.status === 'completed') {
          // Job is done
          setProgress(100)
          setIsComplete(true)
          setExportFile(job.outputFile)
          notify.success('Export completed successfully!')
          clearInterval(intervalId)
        } else if (job.status === 'failed') {
          // Job failed
          setError(job.message || 'Export failed')
          notify.error('Export failed: ' + (job.message || 'Unknown error'))
          clearInterval(intervalId)
        } else if (job.status === 'unknown') {
          // Job not found
          setError(job.message || 'Job not found')
          notify.error(job.message || 'Job not found')
          clearInterval(intervalId)
        }
      } catch (error) {
        console.error('Error checking job status:', error)
        setError('Failed to check job status: ' + (error.response?.data?.message || error.message))
        notify.error('Failed to check job status')
        clearInterval(intervalId)
      }
    }, 1000)
    
    return () => clearInterval(intervalId)
  }, [jobId])
  
  const loadTables = async () => {
    try {
      setLoading(true)
      const response = await clickhouseApi.getTables(connection)
      setTables(response.data.tables)
    } catch (error) {
      console.error('Failed to load tables:', error)
      notify.error(`Failed to load tables: ${error.response?.data?.error?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const loadColumns = async (tableToLoad) => {
    const tableToUse = tableToLoad || selectedTable;
    console.log('tableToUse', tableToUse);
    
    if (!tableToUse) {
      console.error('No table selected');
      return;
    }
    
    try {
      setLoading(true);
      
      // Use the existing clickhouseApi service for consistency

      console.log('connection', connection);
      console.log('tableToUse', tableToUse);
      const response = await clickhouseApi.getColumns({
        ...connection,
        table: tableToUse
      });
      
      if (response.data.success) {
        setColumns(response.data.columns);
        // Select all columns by default
        setSelectedColumns(response.data.columns.map(col => col.name));
      } else {
        console.error('Error loading columns:', response.data.error);
        notify.error(`Failed to load columns: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Failed to load columns:', error);
      notify.error(`Failed to load columns: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const loadPreview = async () => {
    if (!selectedTable || selectedColumns.length === 0) {
      notify.warn('Please select a table and at least one column')
      return
    }
    
    try {
      setLoading(true)
      const response = await clickhouseApi.previewData(
        connection,
        selectedTable,
        selectedColumns,
        10
      )
      console.log('response', response);
      setPreviewData(response.data.data)
      setTotalCount(response.data.totalCount)
    } catch (error) {
      console.error('Failed to load preview:', error)
      notify.error(`Failed to load preview: ${error.response?.data?.error?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleColumnToggle = (columnName) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnName)) {
        return prev.filter(col => col !== columnName)
      } else {
        return [...prev, columnName]
      }
    })
  }
  
  const handleSelectAllColumns = () => {
    setSelectedColumns(columns.map(col => col.name))
  }
  
  const handleSelectNoneColumns = () => {
    setSelectedColumns([])
  }
  
  const startExport = async () => {
    if (!selectedTable || selectedColumns.length === 0) {
      notify.warn('Please select a table and at least one column')
      return
    }
    
    try {
      setLoading(true)
      setJobId(null)
      setProgress(0)
      setIsComplete(false)
      setError(null)
      setExportFile(null)
      
      const response = await ingestionApi.clickhouseToFile({
        clickhouse: connection,
        table: selectedTable,
        columns: selectedColumns,
        outputFormat: exportFormat,
        filename: `${selectedTable}-export.${exportFormat}`
      })
      
      setJobId(response.data.jobId)
      notify.info('Export started!')
    } catch (error) {
      console.error('Failed to start export:', error)
      notify.error(`Failed to start export: ${error.response?.data?.error?.message || error.message}`)
      setError(`Failed to start export: ${error.response?.data?.error?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const downloadExportFile = () => {
    if (!exportFile) return
    
    // Create a link to download the file
    const link = document.createElement('a')
    const apiBaseUrl = getApiUrl().replace('/api', '')
    link.href = `${apiBaseUrl}/${exportFile}`
    link.download = exportFile.split('/').pop()
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  const handleTableSelect = (tableValue) => {
    setSelectedTable(tableValue);
    
    if (tableValue) {
      loadColumns(tableValue);
    } else {
      setColumns([]);
      setSelectedColumns([]);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">ClickHouse to Flat File Export</h1>
        <p className="text-xl text-gray-600 mt-2">
          Export data from ClickHouse to a CSV or TSV file
        </p>
      </div>
      
      <ClickHouseForm 
        onConnect={setConnection}
        isConnected={!!connection}
      />
      
      {connection && (
        <>
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Select Table</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Table</label>
              <select
                className="input"
                value={selectedTable}
                onChange={(e) => handleTableSelect(e.target.value)}
                disabled={loading}
              >
                <option value="">Select a table</option>
                {tables.map((table) => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
          </div>
          
          {selectedTable && (
            <>
              <ColumnSelector
                columns={columns}
                selectedColumns={selectedColumns}
                onColumnToggle={handleColumnToggle}
                onSelectAll={handleSelectAllColumns}
                onSelectNone={handleSelectNoneColumns}
              />
              
              <div className="card mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Export Options</h2>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1">Format</label>
                  <select
                    className="input"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    disabled={loading || !!jobId}
                  >
                    <option value="csv">CSV (Comma Separated)</option>
                    <option value="tsv">TSV (Tab Separated)</option>
                  </select>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={loadPreview}
                    disabled={loading || selectedColumns.length === 0}
                  >
                    Preview Data
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={startExport}
                    disabled={loading || selectedColumns.length === 0 || !!jobId}
                  >
                    Start Export
                  </button>
                </div>
              </div>
              
              {jobId && (
                <div className="card mb-6">
                  <h2 className="text-xl font-bold mb-4">Export Progress</h2>
                  
                  <ProgressBar 
                    progress={progress} 
                    isComplete={isComplete}
                    error={error}
                  />
                  
                  {isComplete && exportFile && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={downloadExportFile}
                    >
                      Download File
                    </button>
                  )}
                </div>
              )}
              
              {previewData && (
                <DataPreview 
                  data={previewData} 
                  totalCount={totalCount}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default ClickHouseToFile 