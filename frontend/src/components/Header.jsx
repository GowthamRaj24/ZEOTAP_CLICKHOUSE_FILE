import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaDatabase, FaChevronDown, FaSignOutAlt, FaUser, FaKey } from 'react-icons/fa'
import { authApi } from '../services/api'
import { notify } from '../config/toastConfig'

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('clickhouse_token')
    setIsAuthenticated(!!token)
  }, [location.pathname]) // Re-check when path changes
  
  const handleLogout = () => {
    authApi.logout()
    notify.info('You have been logged out')
    navigate('/connect')
  }
  
  return (
    <header className="bg-white shadow-lg border-b border-secondary-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
              <FaDatabase className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
                ClickHouse Connector
              </h1>
              <p className="text-xs text-secondary-500 font-medium">
                Bidirectional Data Transfer Solution
              </p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <nav className="flex space-x-1">
                <NavLink to="/" currentPath={location.pathname}>
                  Dashboard
                </NavLink>
                <NavLink to="/clickhouse-to-file" currentPath={location.pathname}>
                  ClickHouse → File
                </NavLink>
                <NavLink to="/file-to-clickhouse" currentPath={location.pathname}>
                  File → ClickHouse
                </NavLink>
              </nav>
            )}
            
            {isAuthenticated && (
              <>
                <Link
                  to="/connect?show=true"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 transition-all duration-200"
                  title="View JWT Token"
                >
                  <FaKey />
                  <span className="hidden md:inline">JWT Token</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 transition-all duration-200"
                  title="Logout"
                >
                  <FaSignOutAlt />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            )}
            
            {!isAuthenticated && (
              <Link
                to="/connect"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 transition-all duration-200"
              >
                <FaUser />
                <span>Connect</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({ to, currentPath, children }) {
  const isActive = currentPath === to
  
  return (
    <Link 
      to={to}
      className={`px-4 py-2 rounded-lg flex items-center space-x-1 transition-all duration-200 ${
        isActive 
          ? 'bg-primary-100 text-primary-700 font-semibold' 
          : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
      }`}
    >
      <span>{children}</span>
      {isActive && <FaChevronDown className="text-xs ml-1 text-primary-500" />}
    </Link>
  )
}

export default Header 