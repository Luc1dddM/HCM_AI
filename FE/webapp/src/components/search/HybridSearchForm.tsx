"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { OPENIMAGES_CLASSES } from "@/constants/openimages";
import { X } from "lucide-react";

interface HybridSearchFormProps {
  searchQuery: string;
  ocrQuery: string;
  objectFilters: Record<string, number>;
  embeddingWeight: number;
  metadataWeight: number;
  caseSensitive: boolean;
  onSearchQueryChange: (query: string) => void;
  onOcrQueryChange: (query: string) => void;
  onAddObjectFilter: (className: string, count: number) => void;
  onRemoveObjectFilter: (className: string) => void;
  onUpdateObjectFilterCount: (className: string, count: number) => void;
  onEmbeddingWeightChange: (weight: number) => void;
  onMetadataWeightChange: (weight: number) => void;
  onCaseSensitiveChange: (checked: boolean) => void;
}

export default function HybridSearchForm({
  searchQuery,
  ocrQuery,
  objectFilters,
  embeddingWeight,
  metadataWeight,
  caseSensitive,
  onSearchQueryChange,
  onOcrQueryChange,
  onAddObjectFilter,
  onRemoveObjectFilter,
  onUpdateObjectFilterCount,
  onEmbeddingWeightChange,
  onMetadataWeightChange,
  onCaseSensitiveChange,
}: HybridSearchFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800">
          Semantic Query (Required)
        </label>
        <Input
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Enter semantic search query (e.g., 'person walking')"
          className="w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Optional OCR filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800">
          OCR Filter Query (Optional)
        </label>
        <Input
          value={ocrQuery}
          onChange={(e) => onOcrQueryChange(e.target.value)}
          placeholder="Enter OCR text that must be present (e.g., 'Hôm nay')"
          className="w-full border-green-200 focus:border-green-500 focus:ring-green-500"
        />
      </div>

      {/* Optional Object filters */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800">
          Object Filters (Optional)
        </label>
        
        <Command className="border border-gray-300 rounded-md shadow-sm">
          <CommandInput placeholder="Search and add object filter..." />
          <CommandList>
            <CommandEmpty>No class found.</CommandEmpty>
            <CommandGroup>
              {OPENIMAGES_CLASSES
                .filter(cls => !objectFilters[cls])
                .map((className) => (
                  <CommandItem
                    key={className}
                    value={className}
                    onSelect={() => {
                      if (className && !objectFilters[className]) {
                        onAddObjectFilter(className, 1);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {className}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>

        {/* Active object filters for hybrid */}
        {Object.keys(objectFilters).length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(objectFilters).map(([className, count]) => (
                <div key={className} className="flex items-center gap-1 px-2 py-1 bg-orange-100 border border-orange-200 rounded-full text-xs">
                  <span className="text-orange-800 font-medium">{className}</span>
                  <span className="text-orange-600">≥</span>
                  <input
                    type="number"
                    min="1"
                    value={count}
                    onChange={(e) => onUpdateObjectFilterCount(className, parseInt(e.target.value) || 1)}
                    className="w-8 px-1 text-xs border-none bg-transparent text-orange-600 font-medium focus:outline-none"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveObjectFilter(className)}
                    className="h-4 w-4 p-0 ml-1 hover:bg-red-200"
                  >
                    <X className="h-2 w-2 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="caseSensitiveHybrid"
          checked={caseSensitive}
          onCheckedChange={(checked) => onCaseSensitiveChange(checked as boolean)}
        />
        <label htmlFor="caseSensitiveHybrid" className="text-sm text-gray-700">
          Case sensitive OCR search
        </label>
      </div>
    </div>
  );
}
