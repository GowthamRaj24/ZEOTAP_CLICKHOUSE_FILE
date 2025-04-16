import axios from 'axios'
import { getApiUrl } from '../config/appConfig'

// Export the baseURL so it can be imported elsewhere
export const baseURL = getApiUrl()

// Create an axios instance with the baseURL
const api = axios.create({
  baseURL
})

// Add an interceptor to add the auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('clickhouse_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ClickHouse API
export const clickhouseApi = {
  testConnection: (config) => api.post('/clickhouse/test-connection', config),
  
  getTables: () => api.post('/clickhouse/tables', {}),
  
  getColumns: (params) => api.post('/clickhouse/columns', params),
  
  executeQuery: (params) => api.post('/clickhouse/query', params),
  
  // NEW function for direct file import
  importFileToClickHouse: (formData) => api.post('/file/file-to-clickhouse', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  previewData: (table, columns, limit = 10, page = 1, joinCondition = null, additionalTables = []) => {
    const tables = [table];
    
    // Add additional tables if provided
    if (additionalTables && additionalTables.length) {
      tables.push(...additionalTables);
    }
    
    return api.post('/clickhouse/preview-data', {
      tables,
      columns,
      page,
      pageSize: limit,
      joinCondition: tables.length > 1 ? joinCondition : undefined
    });
  }
}

// Auth API
export const authApi = {
  connect: (config) => api.post('/auth/connect', config),
  
  logout: () => {
    localStorage.removeItem('clickhouse_token')
    return Promise.resolve()
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