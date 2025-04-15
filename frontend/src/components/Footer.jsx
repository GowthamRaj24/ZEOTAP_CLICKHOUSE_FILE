import React from 'react'
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa'

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-secondary-800 to-secondary-900 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <h3 className="text-xl font-display font-semibold text-white mb-2">
              ClickHouse & Flat File Connector
            </h3>
            <p className="text-secondary-400 text-sm">
              A professional data ingestion platform for bidirectional transfers
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-secondary-400 hover:text-white transition-colors">
                <FaGithub className="text-xl" />
              </a>
              <a href="#" className="text-secondary-400 hover:text-white transition-colors">
                <FaTwitter className="text-xl" />
              </a>
              <a href="#" className="text-secondary-400 hover:text-white transition-colors">
                <FaLinkedin className="text-xl" />
              </a>
            </div>
            <p className="text-secondary-400 text-sm">
              &copy; {new Date().getFullYear()} • Built with React, Express & ClickHouse
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer 