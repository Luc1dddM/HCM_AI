"use client";

import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";

export type SearchType = "text" | "image" | "ocr" | "hybrid" | "objects";

interface SearchActionsProps {
  searchType: SearchType;
  isLoading: boolean;
  onSearch: () => void;
  onReset: () => void;
}

export default function SearchActions({
  searchType,
  isLoading,
  onSearch,
  onReset,
}: SearchActionsProps) {
  const getButtonText = () => {
    switch (searchType) {
      case "ocr":
        return "Search OCR";
      case "objects":
        return "Search Objects";
      case "hybrid":
        return "Hybrid Search";
      case "text":
        return "Search Keyframes";
      case "image":
        return "Search by Image";
      default:
        return "Search";
    }
  };

  const getButtonColor = () => {
    switch (searchType) {
      case "ocr":
        return "bg-green-600 hover:bg-green-700";
      case "objects":
        return "bg-orange-600 hover:bg-orange-700";
      case "hybrid":
        return "bg-purple-600 hover:bg-purple-700";
      default:
        return "bg-blue-600 hover:bg-blue-700";
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={onSearch}
        disabled={isLoading}
        className={`flex-1 ${getButtonColor()}`}
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            {getButtonText()}
          </>
        )}
      </Button>
      <Button variant="outline" onClick={onReset}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
