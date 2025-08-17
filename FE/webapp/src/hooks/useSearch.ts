import { useState, useCallback } from 'react';

export interface SearchResult {
  id: string;
  type: 'ocr' | 'asr' | 'keyframe';
  query: string;
  results: any[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UseSearchReturn {
  // State
  searchHistory: SearchResult[];
  currentResults: SearchResult | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  performSearch: (type: 'ocr' | 'asr' | 'keyframe', query: string, results: any[], metadata?: Record<string, any>) => void;
  clearResults: () => void;
  clearHistory: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export function useSearch(): UseSearchReturn {
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [currentResults, setCurrentResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback((
    type: 'ocr' | 'asr' | 'keyframe',
    query: string,
    results: any[],
    metadata?: Record<string, any>
  ) => {
    const searchResult: SearchResult = {
      id: `${type}-${Date.now()}`,
      type,
      query,
      results,
      timestamp: new Date(),
      metadata,
    };

    setCurrentResults(searchResult);
    setSearchHistory(prev => [searchResult, ...prev.slice(0, 19)]); // Keep last 20 searches
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    setCurrentResults(null);
    setError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setError(null);
    }
  }, []);

  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
    if (errorMessage) {
      setIsLoading(false);
    }
  }, []);

  return {
    searchHistory,
    currentResults,
    isLoading,
    error,
    performSearch,
    clearResults,
    clearHistory,
    setLoading: setLoadingState,
    setError: setErrorState,
  };
}
