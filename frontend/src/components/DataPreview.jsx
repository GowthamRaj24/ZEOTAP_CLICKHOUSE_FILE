import React from 'react'
import { FaTable, FaSearch, FaDatabase } from 'react-icons/fa'

function DataPreview({ data, totalCount }) {
  if (!data || data.length === 0) {
    return null
  }
  
  // Get column headers from the first row
  const headers = Object.keys(data[0])
  
  return (
    <div className="card mb-6 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-accent-100 rounded-lg mr-3">
            <FaTable className="text-accent-700 text-lg" />
          </div>
          <h2 className="text-xl font-bold">Data Preview</h2>
        </div>
        <div className="flex items-center text-sm text-secondary-600 bg-secondary-100 px-3 py-1 rounded-full">
          <FaSearch className="mr-2 text-secondary-500" />
          <span>Showing <span className="font-semibold">{data.length}</span> of <span className="font-semibold">{totalCount}</span> records</span>
        </div>
      </div>
      
      <div className="border border-secondary-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gradient-to-r from-secondary-100 to-secondary-50">
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-sm font-semibold text-secondary-700 border-b border-secondary-200"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-secondary-50 transition-colors">
                  {headers.map((header) => (
                    <td
                      key={`${rowIndex}-${header}`}
                      className="px-4 py-3 text-sm text-secondary-700 whitespace-nowrap"
                    >
                      {row[header] === null || row[header] === undefined 
                        ? <span className="text-secondary-400 italic">NULL</span>
                        : String(row[header]).length > 100
                          ? <span title={String(row[header])}>
                              {String(row[header]).substring(0, 100) + '...'}
                            </span>
                          : String(row[header])
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <div className="text-xs text-secondary-500 flex items-center">
          <FaDatabase className="mr-1" />
          <span>Preview data may be truncated for performance reasons</span>
        </div>
      </div>
    </div>
  )
}

export default DataPreview 