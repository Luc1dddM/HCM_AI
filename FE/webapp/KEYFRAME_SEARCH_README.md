# Enhanced Keyframe Search - Next.js Integration

This document describes the enhanced keyframe search functionality integrated into the ANNIVATOR Next.js application.

## 🚀 Features

### Multi-Modal Search
- **Text Search**: Search using natural language descriptions
- **Image Search**: Upload images to find similar keyframes
- **Hybrid Search**: Combine text and image queries for better results

### Advanced Filtering
- **Search Modes**: Default, Exclude Groups, Include Groups & Videos
- **Parameter Control**: Adjustable top-k results, score thresholds
- **Real-time Filtering**: Filter results by score, type, and metadata

### Enhanced UI/UX
- **Responsive Design**: Works on desktop and mobile devices
- **Multiple View Modes**: Grid and list views for results
- **Search History**: Automatic history tracking with replay functionality
- **Real-time Status**: Loading states and error handling

## 📁 File Structure

```
webapp/src/
├── components/
│   ├── KeyframeSearch.tsx      # Main keyframe search component
│   ├── ResultsDisplay.tsx      # Unified results display
│   ├── OCRSearch.tsx          # OCR search component
│   └── ASRSearch.tsx          # ASR search component
├── hooks/
│   └── useSearch.ts           # Search state management hook
└── app/
    └── page.tsx              # Main application page
```

## 🔧 Component Overview

### KeyframeSearch Component

**Props:**
- `onSearch`: Callback function when search is performed
- `apiBaseUrl`: API endpoint base URL (default: "http://localhost:8000")

**Features:**
- Multi-modal search (text, image, hybrid)
- Advanced parameter configuration
- Image upload via file picker or camera
- Search history with replay functionality
- Real-time search status

### ResultsDisplay Component

**Props:**
- `currentResults`: Current search results
- `searchHistory`: Array of previous searches
- `onClearResults`: Clear current results callback
- `onClearHistory`: Clear search history callback

**Features:**
- Tabbed interface (Current/History)
- Grid and list view modes
- Sorting and filtering capabilities
- Type-specific result rendering
- Search result statistics

### useSearch Hook

**Returns:**
- `searchHistory`: Array of previous searches
- `currentResults`: Current active search results
- `isLoading`: Loading state
- `error`: Error message if any
- `performSearch`: Function to add new search results
- `clearResults`: Clear current results
- `clearHistory`: Clear search history
- `setLoading`: Set loading state
- `setError`: Set error state

## 🎛️ Search Types & Modes

### Search Types
1. **Text Search**: Traditional text-based semantic search
2. **Image Search**: Visual similarity search using uploaded images
3. **Hybrid Search**: Combines text and image for enhanced results

### Search Modes
1. **Default**: Search across all available keyframes
2. **Exclude Groups**: Exclude specific group IDs from search
3. **Include Groups & Videos**: Limit search to specific groups and videos

## 🔌 API Integration

### Endpoints Used
- `POST /api/v1/keyframe/search` - Default search
- `POST /api/v1/keyframe/search/exclude-groups` - Exclude groups search
- `POST /api/v1/keyframe/search/selected-groups-videos` - Include specific groups/videos

### Request Format
```json
{
  "query": "search text",
  "top_k": 20,
  "score_threshold": 0.1,
  "image": "base64_encoded_image", // For image/hybrid search
  "search_type": "text|image|hybrid",
  "exclude_groups": [1, 2, 3], // For exclude mode
  "include_groups": [4, 5, 6], // For include mode
  "include_videos": [101, 102] // For include mode
}
```

### Response Format
```json
{
  "results": [
    {
      "path": "/path/to/keyframe.jpg",
      "score": 0.95,
      "video_id": 123,
      "group_id": 1,
      "timestamp": 15.5,
      "metadata": {...}
    }
  ]
}
```

## 🎨 UI Components

### Search Interface
- Clean, modern design with Tailwind CSS
- Gradient headers and consistent styling
- Responsive grid layouts
- Interactive buttons with hover effects

### Results Display
- Card-based layout for keyframes
- Statistical summaries (total, average, best score)
- Sorting and filtering controls
- Thumbnail previews with fallback handling

### Status Indicators
- Loading spinners during search
- Error messages with clear descriptions
- Success notifications with result counts
- Search progress indicators

## 🔄 State Management

The application uses React hooks for state management:

- **Local State**: Component-specific UI state (view modes, filters)
- **Search State**: Centralized search state via useSearch hook
- **Session Storage**: Persistent search history (optional)

## 🚀 Usage Examples

### Basic Text Search
```tsx
<KeyframeSearch
  onSearch={(query, results) => {
    console.log(`Found ${results.length} results for "${query}"`);
  }}
  apiBaseUrl="http://localhost:8000"
/>
```

### Image Search with Custom Handler
```tsx
const handleKeyframeSearch = (query: string, results: any[]) => {
  // Process results
  processSearchResults(results);
  
  // Update application state
  setSearchResults(results);
};

<KeyframeSearch onSearch={handleKeyframeSearch} />
```

## 🎯 Best Practices

### Performance
- Debounce search queries to avoid excessive API calls
- Implement result pagination for large datasets
- Use image compression for uploaded files
- Cache recent search results

### User Experience
- Provide clear feedback during loading states
- Show meaningful error messages
- Implement search suggestions
- Allow search result bookmarking

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_MAX_FILE_SIZE=5242880 // 5MB in bytes
NEXT_PUBLIC_SUPPORTED_FORMATS=jpg,jpeg,png,bmp,tiff
```

### Customization Options
- API endpoint configuration
- Search parameter defaults
- UI theme and styling
- Result display preferences

## 🐛 Troubleshooting

### Common Issues

**Search not working:**
- Check API endpoint connectivity
- Verify request format and parameters
- Check browser console for errors

**Images not displaying:**
- Ensure image paths are accessible
- Check CORS settings for image URLs
- Verify image format support

**Performance issues:**
- Reduce max results count
- Implement result pagination
- Optimize image file sizes

### Error Handling
- Network errors: Automatic retry with backoff
- API errors: Display user-friendly messages
- Validation errors: Inline form validation
- Image errors: Fallback placeholder display

## 🔮 Future Enhancements

- [ ] Advanced filtering options (date, duration, quality)
- [ ] Batch operations (download, delete, tag)
- [ ] Export functionality (JSON, CSV, PDF)
- [ ] Search result analytics
- [ ] Collaborative features (sharing, comments)
- [ ] Mobile app integration
- [ ] Advanced image preprocessing
- [ ] Machine learning result ranking

## 📝 License

This enhanced keyframe search functionality is part of the ANNIVATOR project.

## 🤝 Contributing

When contributing to the keyframe search functionality:

1. Follow the existing component structure
2. Maintain consistent styling with Tailwind CSS
3. Add appropriate TypeScript types
4. Include error handling and loading states
5. Test with various search scenarios
6. Update documentation as needed

---

For technical support or questions about the keyframe search functionality, please refer to the main project documentation or contact the development team.