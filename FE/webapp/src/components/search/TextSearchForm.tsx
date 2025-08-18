"use client";

import { Input } from "@/components/ui/input";

interface TextSearchFormProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export default function TextSearchForm({
  searchQuery,
  onSearchQueryChange,
}: TextSearchFormProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-800">
        Text Query
      </label>
      <Input
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder="Enter your search query (e.g., 'person walking in the park')"
        className="w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  );
}
