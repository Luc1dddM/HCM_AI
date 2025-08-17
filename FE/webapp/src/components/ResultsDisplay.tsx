"use client";

import { useState } from "react";
import { SearchResult } from "@/hooks/useSearch";
import {
  Search,
  Image as ImageIcon,
  FileText,
  Volume2,
  Clock,
  Star,
  Copy,
  Download,
  Eye,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  SortDesc,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResultsDisplayProps {
  currentResults: SearchResult | null;
  searchHistory: SearchResult[];
  onClearResults?: () => void;
  onClearHistory?: () => void;
}

export default function ResultsDisplay({
  currentResults,
  searchHistory,
  onClearResults,
  onClearHistory,
}: ResultsDisplayProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"timestamp" | "relevance" | "type">(
    "timestamp",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<
    "all" | "ocr" | "asr" | "keyframe"
  >("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedTab, setSelectedTab] = useState<"current" | "history">(
    "current",
  );

  // Get type icon and color - consistent blue theme
  const getTypeInfo = (type: string) => {
    switch (type) {
      case "ocr":
        return {
          icon: FileText,
          color: "text-blue-600",
          bg: "bg-blue-50",
          label: "OCR",
        };
      case "asr":
        return {
          icon: Volume2,
          color: "text-blue-700",
          bg: "bg-blue-100",
          label: "ASR",
        };
      case "keyframe":
        return {
          icon: ImageIcon,
          color: "text-blue-800",
          bg: "bg-blue-200",
          label: "Keyframe",
        };
      default:
        return {
          icon: Search,
          color: "text-blue-600",
          bg: "bg-blue-50",
          label: "Search",
        };
    }
  };

  // Filter and sort history
  const filteredHistory = searchHistory
    .filter((result) => {
      if (filterType !== "all" && result.type !== filterType) return false;
      if (
        searchFilter &&
        !result.query.toLowerCase().includes(searchFilter.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case "timestamp":
          compareValue = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case "type":
          compareValue = a.type.localeCompare(b.type);
          break;
        case "relevance":
          compareValue = a.results.length - b.results.length;
          break;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

  // Render keyframe results
  const renderKeyframeResults = (results: any[]) => (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-3"
      }
    >
      {results.map((result, index) => {
        if (viewMode === "grid") {
          return (
            <div
              key={index}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <img
                  src={`http://localhost:8000${result.path}`}
                  alt={`Keyframe ${index + 1}`}
                  className="max-w-full max-h-full object-contain"
                  // onError={(e) => {
                  //   (e.target as HTMLImageElement).src =
                  //     "/api/placeholder/200/150";
                  // }}
                />
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">#{index + 1}</div>
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {result.score ? result.score.toFixed(3) : "N/A"}
                  </div>
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {result.path ? result.path.split("/").pop() : "Unknown"}
                </div>
                {result.video_id && (
                  <div className="text-xs text-gray-500 mt-1">
                    Video: {result.video_id}
                  </div>
                )}
              </div>
            </div>
          );
        } else {
          return (
            <div
              key={index}
              className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                <img
                  src={`http://localhost:8000${result.path}`}
                  alt={`Keyframe ${index + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold">#{index + 1}</div>
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {result.score ? result.score.toFixed(3) : "N/A"}
                  </div>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {result.path || "Unknown path"}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        }
      })}
    </div>
  );

  return (
    <div className="bg-white rounded-lg border min-h-64">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Title removed as tabs are self-explanatory */}
          </div>
          <div className="flex items-center gap-2">
            {/* Tab selector */}
            <div className="flex border rounded-lg">
              <Button
                variant={selectedTab === "current" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTab("current")}
                className={`rounded-r-none border-r-0 ${
                  selectedTab === "current"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "hover:bg-blue-50"
                }`}
              >
                Current
              </Button>
              <Button
                variant={selectedTab === "history" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTab("history")}
                className={`rounded-l-none ${
                  selectedTab === "history"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "hover:bg-blue-50"
                }`}
              >
                History ({searchHistory.length})
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        {(selectedTab === "current"
          ? currentResults
          : searchHistory.length > 0) && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* View mode toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="flex items-center gap-1"
            >
              {viewMode === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid3X3 className="h-4 w-4" />
              )}
              {viewMode === "grid" ? "List" : "Grid"}
            </Button>

            {/* Sort controls */}
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as any)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Time</SelectItem>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-1"
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>

            {/* Filter controls for history */}
            {selectedTab === "history" && (
              <>
                <Select
                  value={filterType}
                  onValueChange={(value) => setFilterType(value as any)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="ocr">OCR</SelectItem>
                    <SelectItem value="asr">ASR</SelectItem>
                    <SelectItem value="keyframe">Keyframe</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filter queries..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-32"
                />
              </>
            )}

            {/* Clear actions */}
            <div className="flex gap-1 ml-auto">
              {selectedTab === "current" && currentResults && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearResults}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Clear
                </Button>
              )}
              {selectedTab === "history" && searchHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearHistory}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear History
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {selectedTab === "current" ? (
          // Current Results
          currentResults ? (
            <div>
              {/* Render results based on type */}
              {currentResults.results.length > 0 ? (
                renderKeyframeResults(currentResults.results)
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <div className="text-gray-700 font-medium">
                    No results found for this search
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <div className="text-gray-700 font-medium">
                No search results yet
              </div>
              <div className="text-sm mt-2 text-gray-600">
                Perform a search using OCR, ASR, or Keyframe search to see
                results here
              </div>
            </div>
          )
        ) : // Search History
        filteredHistory.length > 0 ? (
          <div className="space-y-4">
            {filteredHistory.map((result, index) => {
              const { icon: Icon, color, bg, label } = getTypeInfo(result.type);
              return (
                <div
                  key={result.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${bg}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {label} Search
                        </div>
                        <div className="text-sm text-gray-700">
                          "{result.query}"
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-800">
                        {result.results.length} results
                      </div>
                      <div className="text-xs text-gray-600">
                        {result.timestamp.toLocaleDateString()}{" "}
                        {result.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Quick preview for keyframe results */}
                  {result.type === "keyframe" && result.results.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {result.results.slice(0, 4).map((item, idx) => (
                        <img
                          key={idx}
                          src={`http://localhost:8000${item.path}`}
                          alt={`Preview ${idx + 1}`}
                          className="w-16 h-12 object-cover rounded border flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ))}
                      {result.results.length > 4 && (
                        <div className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-700 font-medium flex-shrink-0">
                          +{result.results.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <div className="text-gray-700 font-medium">
              No search history found
            </div>
            {searchFilter && (
              <div className="text-sm mt-2 text-gray-600">
                Try adjusting your filter criteria
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
