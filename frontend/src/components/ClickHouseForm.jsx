import React, { useState } from 'react'
import { clickhouseApi, baseURL } from '../services/api'
import { FaDatabase, FaServer, FaLock, FaUser, FaKey } from 'react-icons/fa'
import axios from 'axios'
import { notify } from '../config/toastConfig'

function ClickHouseForm({ onConnect, isConnected }) {
  const [loading, setLoading] = useState(false)
  const [connection, setConnection] = useState({
    host: 'piulaazluo.eastus2.azure.clickhouse.cloud',
    port: '8443',
    database: 'default',
    username: 'default',
    password: '',
    jwtToken: ''
  })
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setConnection(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      console.log('Making request to ClickHouse with config:', connection)
      
      // Skip the direct axios call and just use the API service
      await clickhouseApi.testConnection(connection)
      notify.success('Connected to ClickHouse successfully!')
      onConnect(connection)
    } catch (error) {
      console.error('Connection failed:', error)
      
      // Simplify error message
      let errorMessage = 'Failed to connect to ClickHouse'
      
      // Only show specific error details if they exist and are user-friendly
      if (error.response?.data?.error?.message) {
        errorMessage += `: ${error.response.data.error.message}`
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
  
  return (
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
              disabled={isConnected}
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
              disabled={isConnected}
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
            disabled={isConnected}
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
              disabled={isConnected}
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
              placeholder="Password (optional)"
              disabled={isConnected}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-secondary-700 font-medium mb-2 flex items-center">
            <FaKey className="mr-2 text-secondary-500" />
            JWT Token (for authentication)
          </label>
          <textarea
            name="jwtToken"
            value={connection.jwtToken}
            onChange={handleChange}
            className="input h-24 font-mono text-sm"
            placeholder="Enter JWT token if using token-based authentication"
            disabled={isConnected}
          />
          <p className="text-xs text-secondary-500 mt-1 ml-1">
            Only required if your ClickHouse instance uses JWT authentication
          </p>
        </div>
        
        {!isConnected ? (
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
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onConnect(null)}
          >
            Disconnect
          </button>
        )}
      </form>
    </div>
  )
}

export default ClickHouseForm 