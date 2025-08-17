from pydantic import BaseModel, Field
from typing import List, Optional


class BaseSearchRequest(BaseModel):
    """Base search request with common parameters"""
    query: str = Field(..., description="Search query text", min_length=1, max_length=1000)
    top_k: int = Field(default=10, ge=1, le=500, description="Number of top results to return")
    score_threshold: float = Field(default=0.0, ge=0.0, le=1.0, description="Minimum confidence score threshold")


class TextSearchRequest(BaseSearchRequest):
    """Simple text search request"""
    pass


class TextSearchWithExcludeGroupsRequest(BaseSearchRequest):
    """Text search request with group exclusion"""
    exclude_groups: List[int] = Field(
        default_factory=list,
        description="List of group IDs to exclude from search results",
    )


class TextSearchWithSelectedGroupsAndVideosRequest(BaseSearchRequest):
    """Text search request with specific group and video selection"""
    include_groups: List[int] = Field(
        default_factory=list,
        description="List of group IDs to include in search results",
    )
    include_videos: List[int] = Field(
        default_factory=list,
        description="List of video IDs to include in search results",
    )


class MetadataSearchRequest(BaseModel):
    """Search request for metadata-based search"""
    ocr_query: str = Field(..., description="OCR text to search for", min_length=1)
    top_k: int = Field(default=10, ge=1, le=500, description="Number of top results to return")
    case_sensitive: bool = Field(default=False, description="Whether search is case sensitive")


class HybridSearchRequest(BaseSearchRequest):
    """Hybrid search combining text embedding and metadata"""
    ocr_query: Optional[str] = Field(default=None, description="OCR text to search for")
    case_sensitive: bool = Field(default=False, description="Whether OCR search is case sensitive")
    embedding_weight: float = Field(default=0.7, ge=0.0, le=1.0, description="Weight for embedding similarity")
    metadata_weight: float = Field(default=0.3, ge=0.0, le=1.0, description="Weight for metadata match")


