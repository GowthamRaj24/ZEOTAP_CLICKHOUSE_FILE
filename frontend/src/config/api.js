import axios from 'axios'
import { getApiUrl } from './appConfig'

const instance = axios.create({
  baseURL: getApiUrl(),
  // ...other config
}); 

// Add interceptor to include auth token in all requests
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('clickhouse_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

export default instance;