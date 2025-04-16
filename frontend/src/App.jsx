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

function App() {
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/clickhouse-to-file" element={<ClickHouseToFile />} />
            <Route path="/file-to-clickhouse" element={<FileToClickHouse />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer {...containerConfig} />
      </div>
    </ErrorBoundary>
  )
}

export default App 