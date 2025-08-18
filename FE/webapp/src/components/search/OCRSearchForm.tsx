"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface OCRSearchFormProps {
  ocrQuery: string;
  caseSensitive: boolean;
  onOcrQueryChange: (query: string) => void;
  onCaseSensitiveChange: (checked: boolean) => void;
}

export default function OCRSearchForm({
  ocrQuery,
  caseSensitive,
  onOcrQueryChange,
  onCaseSensitiveChange,
}: OCRSearchFormProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-800">
        OCR Text Search
      </label>
      <Input
        value={ocrQuery}
        onChange={(e) => onOcrQueryChange(e.target.value)}
        placeholder="Enter text to search in images (e.g., 'Hôm nay')"
        className="w-full border-green-200 focus:border-green-500 focus:ring-green-500"
      />
      <div className="flex items-center space-x-2">
        <Checkbox
          id="caseSensitive"
          checked={caseSensitive}
          onCheckedChange={(checked) => onCaseSensitiveChange(checked as boolean)}
        />
        <label htmlFor="caseSensitive" className="text-sm text-gray-700">
          Case sensitive search
        </label>
      </div>
    </div>
  );
}
