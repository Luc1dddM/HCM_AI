# Metadata Search Feature

Tính năng tìm kiếm với metadata (OCR) cho phép tìm kiếm keyframes dựa trên nội dung văn bản được trích xuất từ hình ảnh.

## Tính năng mới

### 1. Metadata-Only Search
Tìm kiếm chỉ dựa trên kết quả OCR, không sử dụng embedding.

**Endpoint:** `POST /keyframe/search/metadata`

**Request Body:**
```json
{
    "ocr_query": "Hôm nay",
    "top_k": 10,
    "case_sensitive": false
}
```

**Use Cases:**
- Tìm kiếm text tiếng Việt cụ thể trong video
- Tìm keyframes có biển báo hoặc nội dung text đặc biệt
- Lọc theo kết quả OCR mà không cần tương đồng ngữ nghĩa

### 2. Hybrid Search
Kết hợp tìm kiếm embedding với metadata OCR.

**Endpoint:** `POST /keyframe/search/hybrid`

**Request Body:**
```json
{
    "query": "người đi bộ trong công viên",
    "ocr_query": "Hôm nay",
    "top_k": 10,
    "score_threshold": 0.5,
    "embedding_weight": 0.7,
    "metadata_weight": 0.3,
    "case_sensitive": false
}
```

**Use Cases:**
- Tìm cảnh có nội dung visual cụ thể VÀ text cụ thể
- Tăng cường kết quả khớp cả nghĩa và nội dung text
- Điều chỉnh trọng số giữa embedding và metadata

## Kiến trúc Implementation

### 1. Schema Changes

#### Request Schemas (`schema/request.py`)
- `MetadataSearchRequest`: Cho metadata-only search
- `HybridSearchRequest`: Cho hybrid search

#### Response Schemas (`schema/response.py`)
- `KeyframeWithMetadataResponse`: Bao gồm OCR results và metadata score

### 2. Repository Layer (`repository/mongo.py`)

#### Phương thức mới:
- `search_by_ocr()`: Tìm kiếm keyframes theo OCR
- `get_keyframes_with_metadata()`: Lấy keyframes với đầy đủ metadata

#### MongoDB Query:
```python
# Case-insensitive OCR search
{"ocr_results": {"$elemMatch": {"$regex": ocr_query, "$options": "i"}}}

# Case-sensitive OCR search  
{"ocr_results": {"$elemMatch": {"$regex": ocr_query}}}
```

### 3. Service Layer (`service/search_service.py`)

#### Phương thức mới:
- `search_by_metadata_only()`: Tìm kiếm chỉ theo metadata
- `search_by_hybrid()`: Tìm kiếm kết hợp
- `_calculate_ocr_match_score()`: Tính điểm khớp OCR

#### Algorithm Hybrid Search:
1. **Step 1: OCR Filtering** - Query MongoDB để tìm keyframes có OCR matching
2. **Step 2: Vector Search on Filtered Set** - Chỉ search embedding trên subset có OCR match
3. **Step 3: Hybrid Scoring** - Tính hybrid score cho results từ vector search
4. **Step 4: Ranking** - Sắp xếp theo hybrid score và trả về top_k

**Advantages of this approach:**
- **Performance**: Giảm số lượng vector search dramatically
- **Precision**: Đảm bảo tất cả results đều có OCR match
- **Resource Efficient**: Không search toàn bộ vector database
- **Logical Flow**: OCR acts as a pre-filter, embedding provides ranking

### 4. Controller Layer (`controller/query_controller.py`)

#### Phương thức mới:
- `search_by_metadata_only()`: Controller cho metadata search
- `search_by_hybrid()`: Controller cho hybrid search
- `convert_metadata_model_to_path()`: Convert model to file path

### 5. API Layer (`router/keyframe_api.py`)

#### Endpoints mới:
- `POST /keyframe/search/metadata`: API cho metadata-only search
- `POST /keyframe/search/hybrid`: API cho hybrid search

## OCR Matching Algorithm

### Scoring Method:
1. **Exact Match**: Score = 1.0
2. **Substring Match**: Score = query_length / ocr_text_length
3. **Word Overlap**: Score = overlapping_words / query_words * 0.8

### Example:
```python
Query: "Hôm nay"
OCR Results: ["Hôm nay trời đẹp", "Ngày mai", "Hôm nay"]

Scores:
- "Hôm nay trời đẹp": 0.5 (substring match: 7/14)
- "Ngày mai": 0.0 (no match)
- "Hôm nay": 1.0 (exact match)
```

## Configuration

### Weight Tuning:
- `embedding_weight`: 0.7 (default) - Trọng số cho semantic similarity
- `metadata_weight`: 0.3 (default) - Trọng số cho OCR match
- Tổng weights = 1.0

### Search Parameters:
- `top_k`: 10 (default), max 500
- `score_threshold`: 0.0 (default), range 0.0-1.0
- `case_sensitive`: false (default)

## Testing

Chạy demo script:
```bash
cd BE/app/examples
python metadata_search_demo.py
```

## Performance Considerations

1. **MongoDB Indexing**: Đảm bảo index trên `ocr_results` field
2. **Hybrid Search**: Có thể chậm hơn do phải query cả vector và MongoDB
3. **Caching**: Consider caching OCR results cho frequent queries
4. **Batch Processing**: Optimize cho large-scale search

## Future Enhancements

1. **Fuzzy Matching**: Sử dụng Levenshtein distance cho typos
2. **Multi-language Support**: Hỗ trợ nhiều ngôn ngữ khác nhau
3. **Advanced Scoring**: Machine learning-based relevance scoring
4. **Real-time Updates**: WebSocket support cho real-time search
