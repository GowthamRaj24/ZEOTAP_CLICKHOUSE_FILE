import axios from 'axios'

// Export the baseURL so it can be imported elsewhere
export const baseURL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL
})

// ClickHouse API
export const clickhouseApi = {
  testConnection: (config) => api.post('/clickhouse/test-connection', config),
  
  getTables: (config) => api.post('/clickhouse/tables', config),
  
  getColumns: (params) => api.post('/clickhouse/columns', params),
  
  executeQuery: (params) => api.post('/clickhouse/query', params),
  
  uploadFile: (formData) => api.post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  getFileColumns: (filename) => api.get(`/file/columns/${filename}`),
  
  importFile: (params) => api.post('/clickhouse/import', params),
  
  previewData: (connection, table, columns, limit = 10, page = 1, joinCondition = null, additionalTables = []) => {
    const tables = [table];
    
    // Add additional tables if provided
    if (additionalTables && additionalTables.length) {
      tables.push(...additionalTables);
    }
    
    return api.post('/clickhouse/preview-data', {
      ...connection,
      tables,
      columns,
      page,
      pageSize: limit,
      joinCondition: tables.length > 1 ? joinCondition : undefined
    });
  }
}

// File API
export const fileApi = {
  uploadFile: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/file/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        if (onProgress) onProgress(percentCompleted)
      }
    })
  },
  
  getColumns: (filePath, delimiter = ',') => 
    api.post('/file/columns', { filePath, delimiter }),
  
  previewData: (filePath, delimiter = ',', columns, limit = 100) => 
    api.post('/file/preview', { filePath, delimiter, columns, limit }),
  
  listFiles: () => api.get('/file/list')
}

// Ingestion API
export const ingestionApi = {
  clickhouseToFile: (params) => 
    api.post('/ingestion/clickhouse-to-file', params),
  
  fileToClickhouse: (params) => 
    api.post('/ingestion/file-to-clickhouse', params),
  
  getStatus: (jobId) => api.get(`/ingestion/status/${jobId}`)
}

export default api 