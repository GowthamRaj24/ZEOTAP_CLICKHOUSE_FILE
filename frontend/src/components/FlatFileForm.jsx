import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { fileApi } from '../services/api'

function FlatFileForm({ onFileSelect, selectedFile }) {
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [delimiter, setDelimiter] = useState(',')
  const [existingFiles, setExistingFiles] = useState([])
  const [showExistingFiles, setShowExistingFiles] = useState(false)
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setLoading(true)
    setUploadProgress(0)
    
    try {
      const response = await fileApi.uploadFile(file, (progress) => {
        setUploadProgress(progress)
      })
      
      toast.success('File uploaded successfully')
      onFileSelect({
        ...response.data.file,
        delimiter
      })
    } catch (error) {
      console.error('File upload failed:', error)
      toast.error(`Upload failed: ${error.response?.data?.error?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelimiterChange = (e) => {
    setDelimiter(e.target.value)
    if (selectedFile) {
      onFileSelect({
        ...selectedFile,
        delimiter: e.target.value
      })
    }
  }
  
  const loadExistingFiles = async () => {
    try {
      setLoading(true)
      const response = await fileApi.listFiles()
      setExistingFiles(response.data.files)
      setShowExistingFiles(true)
    } catch (error) {
      console.error('Failed to load files:', error)
      toast.error(`Failed to load files: ${error.response?.data?.error?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const selectExistingFile = (file) => {
    onFileSelect({
      ...file,
      delimiter
    })
    setShowExistingFiles(false)
  }
  
  return (
    <div className="card mb-6">
      <h2 className="text-xl font-bold mb-4">Flat File Selection</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-1">Delimiter</label>
        <select 
          value={delimiter} 
          onChange={handleDelimiterChange}
          className="input"
          disabled={loading}
        >
          <option value=",">Comma (,)</option>
          <option value="\t">Tab (\t)</option>
          <option value=";">Semicolon (;)</option>
          <option value="|">Pipe (|)</option>
        </select>
      </div>
      
      {!selectedFile ? (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Upload New File</label>
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".csv,.tsv,.txt"
              className="w-full"
              disabled={loading}
            />
            
            {loading && (
              <div className="mt-2">
                <div className="bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Uploading: {uploadProgress}%
                </p>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadExistingFiles}
              disabled={loading}
            >
              Select Previously Uploaded File
            </button>
            
            {showExistingFiles && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Existing Files</h3>
                {existingFiles.length === 0 ? (
                  <p className="text-gray-600">No files found</p>
                ) : (
                  <ul className="border rounded-md divide-y">
                    {existingFiles.map((file) => (
                      <li 
                        key={file.path}
                        className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        onClick={() => selectExistingFile(file)}
                      >
                        <div>
                          <p className="font-medium">{file.filename}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(file.uploadDate).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mb-4">
          <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="font-semibold">Selected File</h3>
            <p className="text-gray-700 mt-1">{selectedFile.filename}</p>
            <p className="text-sm text-gray-600">
              {(selectedFile.size / 1024).toFixed(1)} KB • 
              Delimiter: {selectedFile.delimiter === ',' 
                ? 'Comma' 
                : selectedFile.delimiter === '\t' 
                  ? 'Tab' 
                  : selectedFile.delimiter === ';' 
                    ? 'Semicolon' 
                    : 'Pipe'}
            </p>
          </div>
          
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={() => onFileSelect(null)}
          >
            Change File
          </button>
        </div>
      )}
    </div>
  )
}

export default FlatFileForm 