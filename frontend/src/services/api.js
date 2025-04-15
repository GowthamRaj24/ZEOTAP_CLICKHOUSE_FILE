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
  
  // NEW function for direct file import
  importFileToClickHouse: (formData) => api.post('/file/file-to-clickhouse', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
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
  // Kept empty for potential future file-related (non-import) functions
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