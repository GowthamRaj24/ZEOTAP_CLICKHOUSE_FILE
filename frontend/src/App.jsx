import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import ClickHouseToFile from './pages/ClickHouseToFile'
import FileToClickHouse from './pages/FileToClickHouse'
import 'react-toastify/dist/ReactToastify.css'
import ErrorBoundary from './components/ErrorBoundary'
import { containerConfig } from './config/toastConfig'
import DatabaseConnect from './pages/DatabaseConnect'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            {/* Public Routes */}
            <Route path="/connect" element={<DatabaseConnect />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } />
            <Route path="/clickhouse-to-file" element={
              <PrivateRoute>
                <ClickHouseToFile />
              </PrivateRoute>
            } />
            <Route path="/file-to-clickhouse" element={
              <PrivateRoute>
                <FileToClickHouse />
              </PrivateRoute>
            } />
          </Routes>
        </main>
        <Footer />
        <ToastContainer {...containerConfig} />
      </div>
    </ErrorBoundary>
  )
}

export default App 