import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ASRSearchProps {
  onSearch?: (query: string) => void;
}

export default function ASRSearch({ onSearch }: ASRSearchProps) {
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("asrQuery") as string;
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="mb-4 bg-white rounded-lg border border-blue-200 p-4">
      <div className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
        <span className="text-blue-600">🎵</span>
        ASR Search
      </div>
      <form onSubmit={handleSearch}>
        <Input
          name="asrQuery"
          placeholder="Search audio content..."
          className="mb-3 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
        />
        <Button
          type="submit"
          className="bg-blue-700 hover:bg-blue-800 w-full transition-colors"
          size="sm"
        >
          SEARCH ASR
        </Button>
      </form>
    </div>
  );
}
