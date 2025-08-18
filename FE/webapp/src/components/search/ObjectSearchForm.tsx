"use client";

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

interface ObjectSearchFormProps {
  objectFilters: Record<string, number>;
  onAddObjectFilter: (className: string, count: number) => void;
  onRemoveObjectFilter: (className: string) => void;
  onUpdateObjectFilterCount: (className: string, count: number) => void;
}

export default function ObjectSearchForm({
  objectFilters,
  onAddObjectFilter,
  onRemoveObjectFilter,
  onUpdateObjectFilterCount,
}: ObjectSearchFormProps) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-gray-800">
        Object Detection Filters
      </label>
      <div className="space-y-3">
        {/* Object selection dropdown with search */}
        <label className="text-xs text-gray-600">Add Object Filter:</label>

        <Command className="border border-gray-300 rounded-md shadow-sm">
          <CommandInput placeholder="Search object class..." />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>No class found.</CommandEmpty>
            <CommandGroup>
              {OPENIMAGES_CLASSES
                .filter((cls) => !objectFilters[cls])
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

        {/* Active filters */}
        {Object.keys(objectFilters).length > 0 && (
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Active Filters:</label>
            <div className="space-y-2">
              {Object.entries(objectFilters).map(([className, count]) => (
                <div key={className} className="flex items-center gap-3 p-2 bg-orange-50 border border-orange-200 rounded">
                  <span className="text-sm font-medium text-orange-800 flex-1">{className}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-orange-600">Min count:</label>
                    <input
                      type="number"
                      min="1"
                      value={count}
                      onChange={(e) => onUpdateObjectFilterCount(className, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-orange-300 text-gray-800"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveObjectFilter(className)}
                      className="h-6 w-6 p-0 hover:bg-red-100 hover:border-red-300"
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
