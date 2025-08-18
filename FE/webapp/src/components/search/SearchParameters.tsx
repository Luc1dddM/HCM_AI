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
import { Settings, History } from "lucide-react";

interface SearchParametersProps {
  topK: number;
  scoreThreshold: number;
  searchMode: string;
  excludeGroups: string;
  includeGroups: string;
  includeVideos: string;
  showAdvanced: boolean;
  minScore: number;
  maxResults: number;
  showMetadata: boolean;
  searchHistory: string[];
  onTopKChange: (value: number) => void;
  onScoreThresholdChange: (value: number) => void;
  onSearchModeChange: (mode: string) => void;
  onExcludeGroupsChange: (groups: string) => void;
  onIncludeGroupsChange: (groups: string) => void;
  onIncludeVideosChange: (videos: string) => void;
  onShowAdvancedToggle: () => void;
  onMinScoreChange: (score: number) => void;
  onMaxResultsChange: (max: number) => void;
  onShowMetadataChange: (show: boolean) => void;
  onHistoryItemClick: (query: string) => void;
}

export default function SearchParameters({
  topK,
  scoreThreshold,
  searchMode,
  excludeGroups,
  includeGroups,
  includeVideos,
  showAdvanced,
  minScore,
  maxResults,
  showMetadata,
  searchHistory,
  onTopKChange,
  onScoreThresholdChange,
  onSearchModeChange,
  onExcludeGroupsChange,
  onIncludeGroupsChange,
  onIncludeVideosChange,
  onShowAdvancedToggle,
  onMinScoreChange,
  onMaxResultsChange,
  onShowMetadataChange,
  onHistoryItemClick,
}: SearchParametersProps) {
  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800">Search Parameters</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onShowAdvancedToggle}
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
            onChange={(e) => onTopKChange(parseInt(e.target.value))}
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
            onChange={(e) => onScoreThresholdChange(parseFloat(e.target.value))}
            min="0"
            max="1"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-800">
            Search Mode
          </label>
          <Select value={searchMode} onValueChange={onSearchModeChange}>
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
            onChange={(e) => onExcludeGroupsChange(e.target.value)}
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
              onChange={(e) => onIncludeGroupsChange(e.target.value)}
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
              onChange={(e) => onIncludeVideosChange(e.target.value)}
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
                onChange={(e) => onMinScoreChange(parseFloat(e.target.value))}
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
                onChange={(e) => onMaxResultsChange(parseInt(e.target.value))}
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
              onCheckedChange={(checked) => onShowMetadataChange(checked as boolean)}
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
                onClick={() => onHistoryItemClick(query)}
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
  );
}
