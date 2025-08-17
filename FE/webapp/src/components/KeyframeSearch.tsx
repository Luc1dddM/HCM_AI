"use client";

import { useState, useRef, useCallback } from "react";
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
import OCRSearch from "./OCRSearch";
import {
  Search,
  Upload,
  Camera,
  Image as ImageIcon,
  Filter,
  Download,
  History,
  Settings,
  RefreshCw,
  Star,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  X,
  Eye,
  Copy,
  Share2,
  FileText,
  BarChart3,
} from "lucide-react";

interface KeyframeResult {
  path: string;
  score: number;
  video_id?: string | number;
  group_id?: string | number;
  timestamp?: number;
  metadata?: Record<string, any>;
}

interface KeyframeSearchProps {
  onSearch?: (query: string, results: KeyframeResult[]) => void;
  apiBaseUrl?: string;
}

export default function KeyframeSearch({
  onSearch,
  apiBaseUrl = "http://localhost:8000/api/v1/keyframe",
}: KeyframeSearchProps) {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [ocrQuery, setOcrQuery] = useState("");
  const [searchType, setSearchType] = useState<"text" | "image" | "ocr" | "hybrid">("text");
  const [searchMode, setSearchMode] = useState("default");
  const [results, setResults] = useState<KeyframeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"score" | "path" | "video">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Search parameters
  const [topK, setTopK] = useState(20);
  const [scoreThreshold, setScoreThreshold] = useState(0.1);
  const [excludeGroups, setExcludeGroups] = useState("");
  const [includeGroups, setIncludeGroups] = useState("");
  const [includeVideos, setIncludeVideos] = useState("");

  // OCR search parameters
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [embeddingWeight, setEmbeddingWeight] = useState(0.7);
  const [metadataWeight, setMetadataWeight] = useState(0.3);

  // Advanced filters
  const [minScore, setMinScore] = useState(0);
  const [maxResults, setMaxResults] = useState(50);
  const [showMetadata, setShowMetadata] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleImageUpload = useCallback((file: File) => {
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Handle OCR search
  const handleOCRSearch = useCallback(async (query: string) => {
    setOcrQuery(query);
    await performOCRSearch(query);
  }, []);

  // Handle hybrid search
  const handleHybridSearch = useCallback(async () => {
    if (!searchQuery.trim() || !ocrQuery.trim()) {
      alert("Please enter both text query and OCR query for hybrid search");
      return;
    }
    await performHybridSearch(searchQuery, ocrQuery);
  }, [searchQuery, ocrQuery]);

  // Perform OCR-only search
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
      setSearchType("ocr");

      // Add to search history
      if (query && !searchHistory.includes(query)) {
        setSearchHistory((prev) => [query, ...prev.slice(0, 9)]);
      }

      // Callback to parent
      if (onSearch) {
        onSearch(`OCR: ${query}`, searchResults);
      }
    } catch (error) {
      console.error("OCR search error:", error);
      alert("OCR search failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Perform hybrid search
  const performHybridSearch = async (textQuery: string, ocrQuery: string) => {
    setIsLoading(true);
    try {
      const endpoint = `${apiBaseUrl}/search/hybrid`;
      
      const payload = {
        query: textQuery,
        ocr_query: ocrQuery,
        top_k: topK,
        score_threshold: scoreThreshold,
        embedding_weight: embeddingWeight,
        metadata_weight: metadataWeight,
        case_sensitive: caseSensitive,
      };

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
      setSearchType("hybrid");

      // Add to search history
      const hybridQuery = `${textQuery} + OCR:${ocrQuery}`;
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
  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(",")[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Perform search
  const handleSearch = async () => {
    if (searchType === "text" && !searchQuery.trim()) {
      alert("Please enter a search query");
      return;
    }
    if (searchType === "image" && !uploadedImage) {
      alert("Please upload an image");
      return;
    }
    if (searchType === "ocr" && !ocrQuery.trim()) {
      alert("Please enter OCR query");
      return;
    }
    if (searchType === "hybrid" && (!searchQuery.trim() || !ocrQuery.trim())) {
      alert("Please enter both text query and OCR query for hybrid search");
      return;
    }

    // Handle different search types
    if (searchType === "ocr") {
      await performOCRSearch(ocrQuery);
      return;
    }
    
    if (searchType === "hybrid") {
      await performHybridSearch(searchQuery, ocrQuery);
      return;
    }

    // Original search logic for text and image search
    setIsLoading(true);
    try {
      let endpoint = `${apiBaseUrl}/search`;

      // Determine endpoint based on mode
      if (searchMode === "exclude") {
        endpoint = `${apiBaseUrl}/search/exclude-groups`;
      } else if (searchMode === "include") {
        endpoint = `${apiBaseUrl}/search/selected-groups-videos`;
      }

      // Prepare payload
      const payload: any = {
        query: searchQuery,
        top_k: topK,
        score_threshold: scoreThreshold,
      };

      // Add mode-specific parameters
      if (searchMode === "exclude" && excludeGroups) {
        payload.exclude_groups = excludeGroups
          .split(",")
          .map((g) => parseInt(g.trim()))
          .filter((g) => !isNaN(g));
      }
      if (searchMode === "include") {
        if (includeGroups) {
          payload.include_groups = includeGroups
            .split(",")
            .map((g) => parseInt(g.trim()))
            .filter((g) => !isNaN(g));
        }
        if (includeVideos) {
          payload.include_videos = includeVideos
            .split(",")
            .map((v) => parseInt(v.trim()))
            .filter((v) => !isNaN(v));
        }
      }

      // Add image if needed
      if (searchType === "image" && uploadedImage) {
        payload.image = await imageToBase64(uploadedImage);
        payload.search_type = searchType;
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
      if (searchQuery && !searchHistory.includes(searchQuery)) {
        setSearchHistory((prev) => [searchQuery, ...prev.slice(0, 9)]);
      }

      // Callback to parent
      if (onSearch) {
        onSearch(searchQuery, searchResults);
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Search failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case "score":
        compareValue = a.score - b.score;
        break;
      case "path":
        compareValue = a.path.localeCompare(b.path);
        break;
      case "video":
        compareValue = (a.video_id || 0)
          .toString()
          .localeCompare((b.video_id || 0).toString());
        break;
    }

    return sortOrder === "asc" ? compareValue : -compareValue;
  });

  // Filter results
  const filteredResults = sortedResults
    .filter((result) => result.score >= minScore)
    .slice(0, maxResults);

  // Calculate statistics
  const stats = {
    total: results.length,
    average:
      results.length > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length
        : 0,
    max: results.length > 0 ? Math.max(...results.map((r) => r.score)) : 0,
    uniqueVideos: new Set(results.map((r) => r.video_id)).size,
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Type Selection */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4 mb-4">
          <span className="font-medium text-gray-800">Search Type:</span>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "text", label: "Text", icon: FileText },
              { value: "image", label: "Image", icon: ImageIcon },
              { value: "ocr", label: "OCR", icon: FileText },
              { value: "hybrid", label: "Hybrid", icon: Search },
            ].map(({ value, label, icon: Icon }) => {
              const isActive = searchType === value;

              return (
                <Button
                  key={value}
                  size="sm"
                  onClick={() => setSearchType(value as any)}
                  className={`flex items-center gap-2 rounded-md border
                    ${
                      isActive
                        ? "bg-white text-black border-black"
                        : "bg-black text-white border-black"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Text Search */}
        {searchType === "text" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">
              Text Query
            </label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter your search query (e.g., 'person walking in the park')"
              className="w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        )}

        {/* OCR Search */}
        {searchType === "ocr" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">
              OCR Text Search
            </label>
            <Input
              value={ocrQuery}
              onChange={(e) => setOcrQuery(e.target.value)}
              placeholder="Enter text to search in images (e.g., 'Hôm nay')"
              className="w-full border-green-200 focus:border-green-500 focus:ring-green-500"
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="caseSensitive"
                checked={caseSensitive}
                onCheckedChange={(checked) => setCaseSensitive(checked as boolean)}
              />
              <label htmlFor="caseSensitive" className="text-sm text-gray-700">
                Case sensitive search
              </label>
            </div>
          </div>
        )}

        {/* Hybrid Search */}
        {searchType === "hybrid" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">
                Semantic Query
              </label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter semantic search query (e.g., 'person walking')"
                className="w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">
                OCR Filter Query
              </label>
              <Input
                value={ocrQuery}
                onChange={(e) => setOcrQuery(e.target.value)}
                placeholder="Enter OCR text that must be present (e.g., 'Hôm nay')"
                className="w-full border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-800">
                  Embedding Weight ({embeddingWeight})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={embeddingWeight}
                  onChange={(e) => setEmbeddingWeight(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-800">
                  Metadata Weight ({metadataWeight})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={metadataWeight}
                  onChange={(e) => setMetadataWeight(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="caseSensitiveHybrid"
                checked={caseSensitive}
                onCheckedChange={(checked) => setCaseSensitive(checked as boolean)}
              />
              <label htmlFor="caseSensitiveHybrid" className="text-sm text-gray-700">
                Case sensitive OCR search
              </label>
            </div>
          </div>
        )}

        {/* Image Upload */}
        {searchType === "image" && (
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium text-gray-800">
              Image Query
            </label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Camera
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            {imagePreview && (
              <div className="relative w-32 h-32 border rounded overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={() => {
                    setUploadedImage(null);
                    setImagePreview(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* OCR Search Component (can be used independently) */}
      {searchType !== "ocr" && searchType !== "hybrid" && (
        <OCRSearch onSearch={handleOCRSearch} />
      )}

      {/* Search Parameters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800">Search Parameters</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Advanced
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-800">
              Max Results
            </label>
            <Input
              type="number"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              min="1"
              max="500"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-800">
              Min Score
            </label>
            <Input
              type="number"
              step="0.05"
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(parseFloat(e.target.value))}
              min="0"
              max="1"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-800">
              Search Mode
            </label>
            <Select value={searchMode} onValueChange={setSearchMode}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="exclude">Exclude Groups</SelectItem>
                <SelectItem value="include">Include Groups & Videos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mode-specific parameters */}
        {searchMode === "exclude" && (
          <div>
            <label className="text-sm font-medium text-gray-800">
              Exclude Group IDs
            </label>
            <Input
              value={excludeGroups}
              onChange={(e) => setExcludeGroups(e.target.value)}
              placeholder="1, 3, 7"
              className="mt-1"
            />
          </div>
        )}

        {searchMode === "include" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-800">
                Include Group IDs
              </label>
              <Input
                value={includeGroups}
                onChange={(e) => setIncludeGroups(e.target.value)}
                placeholder="2, 4, 6"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800">
                Include Video IDs
              </label>
              <Input
                value={includeVideos}
                onChange={(e) => setIncludeVideos(e.target.value)}
                placeholder="101, 102, 203"
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Advanced options */}
        {showAdvanced && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-800">
                  Display Min Score
                </label>
                <Input
                  type="number"
                  step="0.05"
                  value={minScore}
                  onChange={(e) => setMinScore(parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-800">
                  Max Display Results
                </label>
                <Input
                  type="number"
                  value={maxResults}
                  onChange={(e) => setMaxResults(parseInt(e.target.value))}
                  min="1"
                  max="200"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showMetadata"
                checked={showMetadata}
                onCheckedChange={(checked) =>
                  setShowMetadata(checked as boolean)
                }
              />
              <label
                htmlFor="showMetadata"
                className="text-sm font-medium text-gray-800"
              >
                Show detailed metadata
              </label>
            </div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-800">
              Recent Searches
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {searchHistory.slice(0, 5).map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery(query)}
                  className="text-xs"
                >
                  <History className="h-3 w-3 mr-1" />
                  {query.substring(0, 20)}
                  {query.length > 20 ? "..." : ""}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          className={`flex-1 ${
            searchType === "ocr" 
              ? "bg-green-600 hover:bg-green-700" 
              : searchType === "hybrid"
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              {searchType === "ocr" && "Search OCR"}
              {searchType === "hybrid" && "Hybrid Search"}
              {searchType === "text" && "Search Keyframes"}
              {searchType === "image" && "Search by Image"}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setResults([]);
            setSearchQuery("");
            setOcrQuery("");
            setUploadedImage(null);
            setImagePreview(null);
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Results Section */}
      
      {/*
      {results.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Search Results</h3>
                <div className="text-sm text-gray-600">
                  Search Type: 
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                    searchType === "ocr" ? "bg-green-100 text-green-800" :
                    searchType === "hybrid" ? "bg-purple-100 text-purple-800" :
                    searchType === "text" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {searchType === "ocr" && "OCR Search"}
                    {searchType === "hybrid" && "Hybrid Search"}
                    {searchType === "text" && "Text Search"}
                    {searchType === "image" && "Image Search"}
                  </span>
                  {searchType === "hybrid" && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Text: "{searchQuery}" + OCR: "{ocrQuery}")
                    </span>
                  )}
                  {searchType === "ocr" && (
                    <span className="ml-2 text-xs text-gray-500">
                      ("{ocrQuery}")
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                  }
                >
                  {viewMode === "grid" ? (
                    <List className="h-4 w-4" />
                  ) : (
                    <Grid3X3 className="h-4 w-4" />
                  )}
                </Button>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as any)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="path">Path</SelectItem>
                    <SelectItem value="video">Video ID</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                <div className="text-blue-800 font-semibold">{stats.total}</div>
                <div className="text-blue-600">Total Results</div>
              </div>
              <div className="bg-blue-100 p-2 rounded border border-blue-300">
                <div className="text-blue-800 font-semibold">
                  {stats.average.toFixed(3)}
                </div>
                <div className="text-blue-600">Avg Score</div>
              </div>
              <div className="bg-blue-200 p-2 rounded border border-blue-400">
                <div className="text-blue-900 font-semibold">
                  {stats.max.toFixed(3)}
                </div>
                <div className="text-blue-700">Best Score</div>
              </div>
              <div className="bg-blue-300 p-2 rounded border border-blue-500">
                <div className="text-blue-900 font-semibold">
                  {stats.uniqueVideos}
                </div>
                <div className="text-blue-800">Videos</div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="text-sm text-gray-700 mb-4">
              Showing {filteredResults.length} of {results.length} results
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResults.map((result, index) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <img
                        src={result.path}
                        alt={`Result ${index + 1}`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCA1MEwxNTAgMTAwTDUwIDE1MFY1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4=";
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-gray-800">
                          #{index + 1}
                        </div>
                        <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          {result.score.toFixed(3)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mb-1 break-all">
                        {result.path.split("/").pop()}
                      </div>
                      {showMetadata && (
                        <div className="text-xs text-gray-500">
                          {result.video_id && (
                            <div>Video: {result.video_id}</div>
                          )}
                          {result.group_id && (
                            <div>Group: {result.group_id}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-20 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <img
                        src={result.path}
                        alt={`Result ${index + 1}`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-semibold text-gray-800">
                          Result #{index + 1}
                        </div>
                        <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          {result.score.toFixed(3)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 truncate mb-1">
                        {result.path}
                      </div>
                      {showMetadata && (
                        <div className="text-xs text-gray-500">
                          {result.video_id && `Video: ${result.video_id} • `}
                          {result.group_id && `Group: ${result.group_id}`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      */}
    </div>
  );
}
