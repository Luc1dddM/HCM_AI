# Search Components

This directory contains reusable search components for OCR (Optical Character Recognition) and ASR (Automatic Speech Recognition) functionality.

## Components

### OCRSearch
A component for searching text content within images.

**Props:**
- `onSearch?: (query: string) => void` - Callback function when search is performed
- `placeholder?: string` - Custom placeholder text (default: "Search OCR text...")
- `className?: string` - Additional CSS classes

**Example:**
```tsx
import { OCRSearch } from "@/components"

function MyComponent() {
  const handleOCRSearch = (query: string) => {
    console.log('Searching for:', query)
    // Your OCR search logic here
  }

  return (
    <OCRSearch
      onSearch={handleOCRSearch}
      placeholder="Search for text in images..."
      className="my-custom-class"
    />
  )
}
```

### ASRSearch
A component for searching spoken content in audio/video files.

**Props:**
- `onSearch?: (query: string) => void` - Callback function when search is performed
- `placeholder?: string` - Custom placeholder text (default: "Search audio content...")
- `className?: string` - Additional CSS classes

**Example:**
```tsx
import { ASRSearch } from "@/components"

function MyComponent() {
  const handleASRSearch = (query: string) => {
    console.log('Searching for:', query)
    // Your ASR search logic here
  }

  return (
    <ASRSearch
      onSearch={handleASRSearch}
      placeholder="Search for spoken words..."
      className="my-custom-class"
    />
  )
}
```

### SearchInterface
A complete interface that combines both OCR and ASR search components with search history.

**Features:**
- Side-by-side OCR and ASR search
- Search history tracking
- Responsive design

**Example:**
```tsx
import { SearchInterface } from "@/components"

function App() {
  return <SearchInterface />
}
```

## UI Components

### Button
A reusable button component with multiple variants and sizes.

**Props:**
- `variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"`
- `size?: "default" | "sm" | "lg" | "icon"`
- `asChild?: boolean` - Render as child component
- `className?: string` - Additional CSS classes

### Input
A styled input component for form inputs.

**Props:**
- Standard HTML input props
- `className?: string` - Additional CSS classes

## Usage Examples

### Individual Components
```tsx
import { OCRSearch, ASRSearch } from "@/components"

function MyPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <OCRSearch onSearch={(q) => console.log('OCR:', q)} />
      <ASRSearch onSearch={(q) => console.log('ASR:', q)} />
    </div>
  )
}
```

### Complete Interface
```tsx
import { SearchInterface } from "@/components"

function App() {
  return <SearchInterface />
}
```

## Dependencies

- `@radix-ui/react-slot` - For flexible component composition
- `class-variance-authority` - For component variant management
- `clsx` - For conditional className joining
- `tailwind-merge` - For merging Tailwind CSS classes

## Styling

All components use Tailwind CSS for styling and are fully responsive. You can customize the appearance by:

1. Passing custom `className` props
2. Modifying the default styles in each component
3. Using Tailwind utility classes

## Development

To run the example page showing all components:

```bash
npm run dev
```

Then visit `/example` to see component usage examples.