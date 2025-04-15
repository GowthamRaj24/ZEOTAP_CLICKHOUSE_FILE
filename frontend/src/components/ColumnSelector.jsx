import React, { useState } from 'react'

function ColumnSelector({ columns, selectedColumns, onColumnToggle, onSelectAll, onSelectNone }) {
  const [filter, setFilter] = useState('')
  
  const filteredColumns = columns.filter(
    col => col.name.toLowerCase().includes(filter.toLowerCase())
  )
  
  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Select Columns</h2>
        <div className="text-sm text-gray-600">
          {selectedColumns.length} of {columns.length} selected
        </div>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter columns..."
          className="input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      <div className="mb-4">
        <button 
          type="button" 
          className="btn btn-secondary mr-2"
          onClick={onSelectAll}
        >
          Select All
        </button>
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onSelectNone}
        >
          Select None
        </button>
      </div>
      
      <div className="max-h-96 overflow-y-auto border rounded-md">
        {filteredColumns.length > 0 ? (
          <div className="divide-y">
            {filteredColumns.map((column) => (
              <div 
                key={column.name}
                className="p-3 hover:bg-gray-50 flex items-center"
              >
                <input
                  type="checkbox"
                  id={`col-${column.name}`}
                  checked={selectedColumns.includes(column.name)}
                  onChange={() => onColumnToggle(column.name)}
                  className="mr-3 w-5 h-5"
                />
                <div className="flex-grow">
                  <label 
                    htmlFor={`col-${column.name}`}
                    className="font-medium cursor-pointer"
                  >
                    {column.name}
                  </label>
                  <div className="text-sm text-gray-600">
                    Type: {column.type}
                    {column.sample && (
                      <span className="ml-2">
                        • Sample: <code className="bg-gray-100 px-1 py-0.5 rounded">
                          {String(column.sample).length > 30 
                            ? String(column.sample).substring(0, 30) + '...' 
                            : column.sample}
                        </code>
                      </span>
                    )}
                    {column.is_in_primary_key && (
                      <span className="ml-2 text-yellow-600">• Primary Key</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            No columns match the filter
          </div>
        )}
      </div>
    </div>
  )
}

export default ColumnSelector 