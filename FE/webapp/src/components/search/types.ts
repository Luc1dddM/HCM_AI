export interface KeyframeResult {
  path: string;
  score: number;
  video_id?: string | number;
  group_id?: string | number;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export type SearchType = "text" | "image" | "ocr" | "hybrid" | "objects";

export interface KeyframeSearchProps {
  onSearch?: (query: string, results: KeyframeResult[]) => void;
  apiBaseUrl?: string;
}
