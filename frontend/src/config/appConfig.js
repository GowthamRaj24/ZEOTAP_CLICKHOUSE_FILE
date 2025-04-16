/**
 * Application-wide configuration settings
 */

/**
 * ENVIRONMENT TOGGLE
 * ------------------
 * Set to true for production deployment, false for local development
 * 
 * Change this single variable to switch between environments:
 * - true: Uses the deployed backend at https://zeotap-clickhouse-file.onrender.com
 * - false: Uses the local backend at http://localhost:5000
 */
export const deployment = false;

// API URLs based on environment
export const apiUrls = {
  development: 'http://localhost:5000/api',
  production: 'https://zeotap-clickhouse-file.onrender.com/api'
};

// Get the current API URL based on deployment flag
export const getApiUrl = () => deployment ? apiUrls.production : apiUrls.development;

// Export a default config object
const appConfig = {
  deployment,
  apiUrl: getApiUrl()
};

export default appConfig; 