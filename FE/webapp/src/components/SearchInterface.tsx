import { useState } from "react"
import OCRSearch from "./OCRSearch"
import ASRSearch from "./ASRSearch"

interface SearchResult {
  type: 'ocr' | 'asr'
  query: string
  timestamp: Date
}

export default function SearchInterface() {
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([])

  const handleOCRSearch = (query: string) => {
    console.log('OCR Search:', query)
    setSearchHistory(prev => [...prev, {
      type: 'ocr',
      query,
      timestamp: new Date()
    }])
    // Add your OCR search logic here
  }

  const handleASRSearch = (query: string) => {
    console.log('ASR Search:', query)
    setSearchHistory(prev => [...prev, {
      type: 'asr',
      query,
      timestamp: new Date()
    }])
    // Add your ASR search logic here
  }

  const clearHistory = () => {
    setSearchHistory([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Search Interface</h1>
          <p className="text-gray-600">Search for text and audio content using OCR and ASR</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <OCRSearch onSearch={handleOCRSearch} />
          <ASRSearch onSearch={handleASRSearch} />
        </div>

        {searchHistory.length > 0 && (
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Search History</h3>
              <button
                onClick={clearHistory}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchHistory.slice(-10).reverse().map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      item.type === 'ocr'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-700">{item.query}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {item.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
