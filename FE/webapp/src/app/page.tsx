"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OCRSearch from "@/components/OCRSearch";
import ASRSearch from "@/components/ASRSearch";
import KeyframeSearch from "@/components/KeyframeSearch";
import ResultsDisplay from "@/components/ResultsDisplay";
import { useSearch } from "@/hooks/useSearch";

export default function AnnivatorInterface() {
  const {
    searchHistory,
    currentResults,
    isLoading,
    error,
    performSearch,
    clearResults,
    clearHistory,
    setLoading,
    setError,
  } = useSearch();

  const handleOCRSearch = (query: string) => {
    console.log("OCR Search:", query);
    setLoading(true);

    // Simulate OCR API call
    setTimeout(() => {
      const mockResults = [
        {
          text: `Found text containing "${query}"`,
          confidence: 0.95,
          bbox: [100, 200, 300, 250],
        },
        {
          text: `Another match for "${query}"`,
          confidence: 0.87,
          bbox: [150, 350, 400, 400],
        },
      ];
      performSearch("ocr", query, mockResults);
      setLoading(false);
    }, 1000);
  };

  const handleASRSearch = (query: string) => {
    console.log("ASR Search:", query);
    setLoading(true);

    // Simulate ASR API call
    setTimeout(() => {
      const mockResults = [
        {
          text: `Audio transcript containing "${query}"`,
          confidence: 0.92,
          timestamp: 15.5,
        },
        {
          text: `Another audio match for "${query}"`,
          confidence: 0.78,
          timestamp: 42.3,
        },
      ];
      performSearch("asr", query, mockResults);
      setLoading(false);
    }, 1000);
  };

  const handleKeyframeSearch = (query: string, results: any[]) => {
    console.log("Keyframe Search:", query, results);
    performSearch("keyframe", query, results);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Main container with blue border */}
        <div className="border-2 border-blue-500 rounded-lg bg-white">
          {/* Top row - Sections A and B */}
          <div className="flex border-b-2 border-blue-500"> 
            {/* Section A - Left panel */}
            <div className="w-1/3 border-r-2 border-blue-500 p-4">
              {/* Search Status */}
              {isLoading && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-700 animate-pulse flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-700 flex items-center gap-2">
                    <span>⚠️</span>
                    Error: {error}
                  </div>
                </div>
              )}
            </div>

            {/* Section B - Right panel */}
            <div className="flex-1 p-4 bg-gradient-to-br from-blue-50/30 to-white">
              {/* Section D - Keyframe Search */}
              <div>
                <KeyframeSearch onSearch={handleKeyframeSearch} />
              </div>
            </div>
          </div>

          {/* Bottom row - Section C - Results Display */}
          <div className="p-4">
            <ResultsDisplay
              currentResults={currentResults}
              searchHistory={searchHistory}
              onClearResults={clearResults}
              onClearHistory={clearHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
