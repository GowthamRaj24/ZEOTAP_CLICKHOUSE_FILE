import axios from 'axios'
import { getApiUrl } from './appConfig'

const instance = axios.create({
  baseURL: getApiUrl(),
  // ...other config
}); 

export default instance;