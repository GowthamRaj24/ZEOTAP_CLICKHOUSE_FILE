import React from 'react'
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'

function ProgressBar({ progress, isComplete, error }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          {isComplete && !error ? (
            <FaCheckCircle className="text-green-600 mr-2" />
          ) : error ? (
            <FaExclamationTriangle className="text-red-600 mr-2" />
          ) : (
            <FaSpinner className="text-primary-600 mr-2 animate-spin" />
          )}
          <span className="font-medium text-secondary-800">
            {isComplete ? 'Complete!' : error ? 'Error' : 'Processing...'}
          </span>
        </div>
        <span className="font-medium text-secondary-800">{progress}%</span>
      </div>
      
      <div className="relative h-3 bg-secondary-200 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
            error ? 'bg-gradient-to-r from-red-600 to-red-500' 
                 : isComplete ? 'bg-gradient-to-r from-green-600 to-green-500' 
                 : 'bg-gradient-to-r from-primary-700 to-primary-500'
          }`}
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white opacity-20 overflow-hidden rounded-full">
            <div className="h-full w-20 bg-white/30 skew-x-30 animate-shimmer"></div>
          </div>
        </div>
      </div>
      
      {isComplete && !error && (
        <div className="mt-3 px-4 py-2 bg-green-100 border border-green-200 text-green-800 rounded-lg flex items-center">
          <FaCheckCircle className="text-green-600 mr-2" />
          <p className="text-sm font-medium">
            Process completed successfully!
          </p>
        </div>
      )}
      
      {error && (
        <div className="mt-3 px-4 py-2 bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-center">
          <FaExclamationTriangle className="text-red-600 mr-2" />
          <p className="text-sm font-medium">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}

export default ProgressBar 