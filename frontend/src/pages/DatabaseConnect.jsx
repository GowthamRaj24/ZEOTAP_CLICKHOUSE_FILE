import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaDatabase, FaServer, FaLock, FaUser, FaKey, FaCopy, FaEye, FaEyeSlash, FaCode } from 'react-icons/fa'
import axios from 'axios'
import { getApiUrl } from '../config/appConfig'
import { notify } from '../config/toastConfig'

function DatabaseConnect() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [showDecodedToken, setShowDecodedToken] = useState(false)
  const [decodedToken, setDecodedToken] = useState(null)
  
  const [connection, setConnection] = useState({
    host: 'piulaazluo.eastus2.azure.clickhouse.cloud',
    port: '8443',
    database: 'default',
    username: 'default',
    password: '',
    jwtToken: ''
  })
  
  // Check if user is already authenticated
  useEffect(() => {
    const savedToken = localStorage.getItem('clickhouse_token')
    if (savedToken) {
      setToken(savedToken)
      decodeJwtToken(savedToken)
      // Only redirect if not explicitly visiting the connect page
      if (window.location.pathname === '/connect' && !window.location.search.includes('show=true')) {
        navigate('/')
      }
    }
  }, [navigate])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setConnection(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      console.log('Making connection request to backend')
      
      const response = await axios.post(`${getApiUrl()}/auth/connect`, connection)
      
      if (response.data.success) {
        // Store the token in localStorage
        const newToken = response.data.token
        localStorage.setItem('clickhouse_token', newToken)
        setToken(newToken)
        decodeJwtToken(newToken)
        
        notify.success('Connected to ClickHouse successfully!')
        
        // Don't redirect if showing token
        if (!window.location.search.includes('show=true')) {
          // Redirect to home page
          navigate('/')
        }
      } else {
        throw new Error(response.data.error || 'Failed to connect to database')
      }
    } catch (error) {
      console.error('Connection failed:', error)
      
      // Simplify error message
      let errorMessage = 'Failed to connect to ClickHouse'
      
      // Only show specific error details if they exist and are user-friendly
      if (error.response?.data?.error) {
        errorMessage += `: ${error.response.data.error}`
      } 
      // Don't show technical network errors to users
      else if (!error.message.includes('Network Error')) {
        errorMessage += `: ${error.message}`
      }
      
      notify.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(token)
    notify.success('Token copied to clipboard')
  }
  
  const toggleShowToken = () => {
    setShowToken(!showToken)
  }
  
  const toggleShowDecodedToken = () => {
    setShowDecodedToken(!showDecodedToken)
  }
  
  const decodeJwtToken = (token) => {
    try {
      // JWT tokens are split into three parts: header, payload, signature
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format')
      }
      
      // Decode the payload (middle part)
      const payload = parts[1]
      const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
      
      // Remove sensitive data like passwords
      if (decodedPayload.password) {
        decodedPayload.password = '******'
      }
      
      setDecodedToken(decodedPayload)
    } catch (error) {
      console.error('Failed to decode JWT token:', error)
      setDecodedToken(null)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Connect to ClickHouse</h1>
        <p className="text-xl text-gray-600 mt-2">
          Connect to your ClickHouse database to get started
        </p>
      </div>
      
      <div className="card mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-100 to-transparent rounded-full -mr-20 -mt-20 opacity-50"></div>
        
        <div className="flex items-center mb-6">
          <div className="p-3 bg-primary-100 rounded-lg mr-4">
            <FaDatabase className="text-primary-600 text-xl" />
          </div>
          <h2 className="text-xl font-bold">ClickHouse Connection</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-secondary-700 font-medium mb-2 flex items-center">
                <FaServer className="mr-2 text-secondary-500" />
                Host
              </label>
              <input
                type="text"
                name="host"
                value={connection.host}
                onChange={handleChange}
                className="input"
                placeholder="piulaazluo.eastus2.azure.clickhouse.cloud"
                required
              />
              <p className="text-xs text-secondary-500 mt-1 ml-1">
                Enter hostname without http:// or https://
              </p>
            </div>
            
            <div>
              <label className="block text-secondary-700 font-medium mb-2">Port</label>
              <input
                type="text"
                name="port"
                value={connection.port}
                onChange={handleChange}
                className="input"
                placeholder="8443"
                required
              />
              <p className="text-xs text-secondary-500 mt-1 ml-1">
                Use 8443 for ClickHouse Cloud (HTTPS)
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-secondary-700 font-medium mb-2 flex items-center">
              <FaDatabase className="mr-2 text-secondary-500" />
              Database
            </label>
            <input
              type="text"
              name="database"
              value={connection.database}
              onChange={handleChange}
              className="input"
              placeholder="default"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-secondary-700 font-medium mb-2 flex items-center">
                <FaUser className="mr-2 text-secondary-500" />
                Username
              </label>
              <input
                type="text"
                name="username"
                value={connection.username}
                onChange={handleChange}
                className="input"
                placeholder="default"
              />
            </div>
            
            <div>
              <label className="block text-secondary-700 font-medium mb-2 flex items-center">
                <FaLock className="mr-2 text-secondary-500" />
                Password
              </label>
              <input
                type="password"
                name="password"
                value={connection.password}
                onChange={handleChange}
                className="input"
                placeholder="Password"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-full md:w-auto"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              <span className="flex items-center">
                <FaDatabase className="mr-2" />
                Connect to ClickHouse
              </span>
            )}
          </button>
        </form>
      </div>
      
      {token && (
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <FaKey className="mr-2 text-secondary-500" /> 
              Your JWT Token
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={toggleShowToken}
                className="p-2 rounded-full hover:bg-secondary-100"
                title={showToken ? "Hide Token" : "Show Token"}
              >
                {showToken ? <FaEyeSlash /> : <FaEye />}
              </button>
              <button 
                onClick={copyTokenToClipboard} 
                className="p-2 rounded-full hover:bg-secondary-100"
                title="Copy Token"
              >
                <FaCopy />
              </button>
              <button 
                onClick={toggleShowDecodedToken}
                className="p-2 rounded-full hover:bg-secondary-100"
                title={showDecodedToken ? "Hide Decoded Token" : "Show Decoded Token"}
              >
                <FaCode />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200 font-mono text-xs text-secondary-800 overflow-x-auto">
              {showToken ? token : '•'.repeat(Math.min(50, token.length))}
            </div>
            <div className="mt-2 text-xs text-secondary-500">
              This token contains your encrypted connection details and is automatically included in API requests.
            </div>
          </div>
          
          {showDecodedToken && decodedToken && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Decoded Token Contents</h3>
              <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200 font-mono text-xs text-secondary-800 overflow-x-auto">
                <pre>{JSON.stringify(decodedToken, null, 2)}</pre>
              </div>
              <div className="mt-2 text-xs text-secondary-500">
                This is the decoded content of your JWT token, which includes your connection details (with sensitive info hidden).
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DatabaseConnect