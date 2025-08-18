"use client";

import { useState, useCallback } from "react";
import {
  HybridSearchForm,
  type KeyframeSearchProps,
  type KeyframeResult,
} from "./search";

export default function KeyframeSearch({
  onSearch,
  apiBaseUrl = "http://localhost:8000/api/v1/keyframe",
}: KeyframeSearchProps) {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [ocrQuery, setOcrQuery] = useState("");
  const [results, setResults] = useState<KeyframeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Search parameters
  const [topK, setTopK] = useState(20);
  const [scoreThreshold, setScoreThreshold] = useState(0.1);

  // OCR search parameters
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [embeddingWeight, setEmbeddingWeight] = useState(0.7);
  const [metadataWeight, setMetadataWeight] = useState(0.3);

  // Object search parameters
  const [objectFilters, setObjectFilters] = useState<Record<string, number>>({});

  // Add/remove object filter
  const addObjectFilter = (className: string, count: number = 1) => {
    setObjectFilters(prev => ({
      ...prev,
      [className]: count
    }));
  };

  const removeObjectFilter = (className: string) => {
    setObjectFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[className];
      return newFilters;
    });
  };

  const updateObjectFilterCount = (className: string, count: number) => {
    setObjectFilters(prev => ({
      ...prev,
      [className]: Math.max(1, count)
    }));
  };

  // Perform semantic search only
  const performSemanticSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const endpoint = `${apiBaseUrl}/search`;
      const payload = {
        query: query,
        top_k: topK,
        score_threshold: scoreThreshold,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const searchResults = data.results || [];
      setResults(searchResults);
      
      if (!searchHistory.includes(query)) {
        setSearchHistory((prev) => [query, ...prev.slice(0, 9)]);
      }
      
      if (onSearch) onSearch(`Semantic: ${query}`, searchResults);
    } catch (error) {
      console.error("Semantic search error:", error);
      alert("Semantic search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Perform OCR search only
  const performOCRSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const endpoint = `${apiBaseUrl}/search/metadata`;
      const payload = {
        ocr_query: query,
        top_k: topK,
        case_sensitive: caseSensitive,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const searchResults = data.results || [];
      setResults(searchResults);
      
      if (!searchHistory.includes(query)) {
        setSearchHistory((prev) => [query, ...prev.slice(0, 9)]);
      }
      
      if (onSearch) onSearch(`OCR: ${query}`, searchResults);
    } catch (error) {
      console.error("OCR search error:", error);
      alert("OCR search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Perform object search only
  const performObjectSearch = async (filters: Record<string, number>) => {
    setIsLoading(true);
    try {
      const endpoint = `${apiBaseUrl}/search/objects`;
      const payload = {
        object_filters: filters,
        top_k: topK,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const searchResults = data.results || [];
      setResults(searchResults);
      
      const queryStr = Object.entries(filters).map(([obj, count]) => `${obj}:${count}`).join(', ');
      if (!searchHistory.includes(queryStr)) {
        setSearchHistory((prev) => [queryStr, ...prev.slice(0, 9)]);
      }
      
      if (onSearch) onSearch(`Objects: ${queryStr}`, searchResults);
    } catch (error) {
      console.error("Object search error:", error);
      alert("Object search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  // Perform hybrid search
  const performHybridSearch = async (textQuery: string, ocrQuery: string, objectFilters: Record<string, number> = {}) => {
    setIsLoading(true);
    try {
      const endpoint = `${apiBaseUrl}/search/hybrid`;
      
      const payload: any = {
        top_k: topK,
        score_threshold: scoreThreshold,
        embedding_weight: embeddingWeight,
        metadata_weight: metadataWeight,
        case_sensitive: caseSensitive,
      };

      // Add semantic query if provided
      if (textQuery?.trim()) {
        payload.query = textQuery;
      }

      // Add OCR query if provided
      if (ocrQuery?.trim()) {
        payload.ocr_query = ocrQuery;
      }

      // Add object filters if provided
      if (Object.keys(objectFilters).length > 0) {
        payload.object_filters = objectFilters;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const searchResults = data.results || [];
      setResults(searchResults);

      // Add to search history
      let hybridQuery = "";
      if (textQuery?.trim()) hybridQuery += textQuery;
      if (ocrQuery?.trim()) {
        if (hybridQuery) hybridQuery += " + ";
        hybridQuery += `OCR:${ocrQuery}`;
      }
      if (Object.keys(objectFilters).length > 0) {
        if (hybridQuery) hybridQuery += " + ";
        const objectStr = Object.entries(objectFilters).map(([obj, count]) => `${obj}:${count}`).join(',');
        hybridQuery += `Objects:(${objectStr})`;
      }
      
      if (!searchHistory.includes(hybridQuery)) {
        setSearchHistory((prev) => [hybridQuery, ...prev.slice(0, 9)]);
      }

      // Callback to parent
      if (onSearch) {
        onSearch(hybridQuery, searchResults);
      }
    } catch (error) {
      console.error("Hybrid search error:", error);
      alert("Hybrid search failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Perform search - check which field has data and call appropriate API
  const handleSearch = async () => {
    const hasSemanticQuery = searchQuery.trim();
    const hasOcrQuery = ocrQuery.trim();
    const hasObjectFilters = Object.keys(objectFilters).length > 0;

    // Count how many fields have data
    const activeFields = [hasSemanticQuery, hasOcrQuery, hasObjectFilters].filter(Boolean).length;

    if (activeFields === 0) {
      alert("Please enter at least one search criteria (semantic query, OCR text, or object filters)");
      return;
    }

    // If only one field, call appropriate single API
    if (activeFields === 1) {
      if (hasSemanticQuery) {
        await performSemanticSearch(searchQuery);
      } else if (hasOcrQuery) {
        await performOCRSearch(ocrQuery);
      } else if (hasObjectFilters) {
        await performObjectSearch(objectFilters);
      }
      return;
    }

    // If multiple fields, use hybrid search (now supports metadata-only combinations)
    await performHybridSearch(searchQuery, ocrQuery, objectFilters);
  };

  return (
    <div className="w-full space-y-4">
      {/* Hybrid Search Form */}
      <div className="bg-white p-4 rounded-lg border">
        <HybridSearchForm
          searchQuery={searchQuery}
          ocrQuery={ocrQuery}
          objectFilters={objectFilters}
          embeddingWeight={embeddingWeight}
          metadataWeight={metadataWeight}
          caseSensitive={caseSensitive}
          onSearchQueryChange={setSearchQuery}
          onOcrQueryChange={setOcrQuery}
          onAddObjectFilter={addObjectFilter}
          onRemoveObjectFilter={removeObjectFilter}
          onUpdateObjectFilterCount={updateObjectFilterCount}
          onEmbeddingWeightChange={setEmbeddingWeight}
          onMetadataWeightChange={setMetadataWeight}
          onCaseSensitiveChange={setCaseSensitive}
        />
      </div>

      {/* Simple Search Parameters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <h3 className="font-medium text-gray-800">Search Parameters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-800">
              Max Results
            </label>
            <input
              type="number"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              min="1"
              max="500"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-800">
              Min Score Threshold
            </label>
            <input
              type="number"
              step="0.05"
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(parseFloat(e.target.value))}
              min="0"
              max="1"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-800">
              Recent Searches
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {searchHistory.slice(0, 5).map((query, index) => (
                <button
                  key={index}
                  onClick={() => setSearchQuery(query)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border"
                >
                  {query.substring(0, 30)}
                  {query.length > 30 ? "..." : ""}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Action */}
      <div className="flex gap-2">
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </>
          ) : (
            "Smart Search"
          )}
        </button>
        <button
          onClick={() => {
            setResults([]);
            setSearchQuery("");
            setOcrQuery("");
            setObjectFilters({});
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {/* Results display can be added here if needed */}
    </div>
  );
}
