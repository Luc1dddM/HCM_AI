"use client";

import { Button } from "@/components/ui/button";
import {
  Search,
  Image as ImageIcon,
  Filter,
  FileText,
} from "lucide-react";

export type SearchType = "text" | "image" | "ocr" | "hybrid" | "objects";

interface SearchTypeSelectorProps {
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
}

export default function SearchTypeSelector({
  searchType,
  onSearchTypeChange,
}: SearchTypeSelectorProps) {
  const searchTypes = [
    { value: "text" as const, label: "Text", icon: FileText },
    { value: "image" as const, label: "Image", icon: ImageIcon },
    { value: "ocr" as const, label: "OCR", icon: FileText },
    { value: "objects" as const, label: "Objects", icon: Filter },
    { value: "hybrid" as const, label: "Hybrid", icon: Search },
  ];

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex items-center gap-4 mb-4">
        <span className="font-medium text-gray-800">Search Type:</span>
        <div className="flex gap-2 flex-wrap">
          {searchTypes.map(({ value, label, icon: Icon }) => {
            const isActive = searchType === value;

            return (
              <Button
                key={value}
                size="sm"
                onClick={() => onSearchTypeChange(value)}
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
    </div>
  );
}
