import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OCRSearchProps {
  onSearch?: (query: string) => void;
}

export default function OCRSearch({ onSearch }: OCRSearchProps) {
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("ocrQuery") as string;
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="mb-4 bg-white rounded-lg border border-blue-200 p-4">
      <div className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
        <span className="text-blue-600">📄</span>
        OCR Search
      </div>
      <form onSubmit={handleSearch}>
        <Input
          name="ocrQuery"
          placeholder="Search text in images..."
          className="mb-3 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
        />
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 w-full transition-colors"
          size="sm"
        >
          SEARCH OCR
        </Button>
      </form>
    </div>
  );
}
