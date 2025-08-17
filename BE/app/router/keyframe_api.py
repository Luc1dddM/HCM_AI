
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from typing import List, Optional

from schema.request import (
    TextSearchRequest,
    TextSearchWithExcludeGroupsRequest,
    TextSearchWithSelectedGroupsAndVideosRequest,
    MetadataSearchRequest,
    HybridSearchRequest,
)
from schema.response import KeyframeServiceReponse, SingleKeyframeDisplay, KeyframeDisplay
from controller.query_controller import QueryController
from core.dependencies import get_query_controller
from core.logger import SimpleLogger


logger = SimpleLogger(__name__)


router = APIRouter(
    prefix="/keyframe",
    tags=["keyframe"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/search",
    response_model=KeyframeDisplay,
    summary="Simple text search for keyframes",
    description="""
    Perform a simple text-based search for keyframes using semantic similarity.
    
    This endpoint converts the input text query to an embedding and searches for 
    the most similar keyframes in the database.
    
    **Parameters:**
    - **query**: The search text (1-1000 characters)
    - **top_k**: Maximum number of results to return (1-100, default: 10)
    - **score_threshold**: Minimum confidence score (0.0-1.0, default: 0.0)
    
    **Returns:**
    List of keyframes with their metadata and confidence scores, ordered by similarity.
    
    **Example:**
    ```json
    {
        "query": "person walking in the park",
        "top_k": 5,
        "score_threshold": 0.7
    }
    ```
    """,
    response_description="List of matching keyframes with confidence scores"
)
async def search_keyframes(
    request: TextSearchRequest,
    controller: QueryController = Depends(get_query_controller)
):
    """
    Search for keyframes using text query with semantic similarity.
    """
    
    logger.info(f"Text search request: query='{request.query}', top_k={request.top_k}, threshold={request.score_threshold}")
    
    results = await controller.search_text(
        query=request.query,
        top_k=request.top_k,
        score_threshold=request.score_threshold
    )
    
    logger.info(f"Found {len(results)} results for query: '{request.query}'")
    display_results = list(
        map(
            lambda pair: SingleKeyframeDisplay(path=pair[0], score=pair[1]),
            map(controller.convert_model_to_path, results)
        )
    )
    return KeyframeDisplay(results=display_results)

    



@router.post(
    "/search/exclude-groups",
    response_model=KeyframeDisplay,
    summary="Text search with group exclusion",
    description="""
    Perform text-based search for keyframes while excluding specific groups.
    
    This endpoint allows you to search for keyframes while filtering out 
    results from specified groups (e.g., to avoid certain video categories).
    
    **Parameters:**
    - **query**: The search text
    - **top_k**: Maximum number of results to return
    - **score_threshold**: Minimum confidence score
    - **exclude_groups**: List of group IDs to exclude from results
    
    **Use Cases:**
    - Exclude specific video categories or datasets
    - Filter out content from certain time periods
    - Remove specific collections from search results
    
    **Example:**
    ```json
    {
        "query": "sunset landscape",
        "top_k": 15,
        "score_threshold": 0.6,
        "exclude_groups": [1, 3, 7]
    }
    ```
    """,
    response_description="List of matching keyframes excluding specified groups"
)
async def search_keyframes_exclude_groups(
    request: TextSearchWithExcludeGroupsRequest,
    controller: QueryController = Depends(get_query_controller)
):
    """
    Search for keyframes with group exclusion filtering.
    """

    logger.info(f"Text search with group exclusion: query='{request.query}', exclude_groups={request.exclude_groups}")
    
    results: list[KeyframeServiceReponse] = await controller.search_text_with_exlude_group(
        query=request.query,
        top_k=request.top_k,
        score_threshold=request.score_threshold,
        list_group_exlude=request.exclude_groups
    )
    
    logger.info(f"Found {len(results)} results excluding groups {request.exclude_groups}")\
    
    

    display_results = list(
        map(
            lambda pair: SingleKeyframeDisplay(path=pair[0], score=pair[1]),
            map(controller.convert_model_to_path, results)
        )
    )
    return KeyframeDisplay(results=display_results)






@router.post(
    "/search/selected-groups-videos",
    response_model=KeyframeDisplay,
    summary="Text search within selected groups and videos",
    description="""
    Perform text-based search for keyframes within specific groups and videos only.
    
    This endpoint allows you to limit your search to specific groups and videos,
    effectively creating a filtered search scope.
    
    **Parameters:**
    - **query**: The search text
    - **top_k**: Maximum number of results to return
    - **score_threshold**: Minimum confidence score
    - **include_groups**: List of group IDs to search within
    - **include_videos**: List of video IDs to search within
    
    **Behavior:**
    - Only keyframes from the specified groups AND videos will be searched
    - If a keyframe belongs to an included group OR an included video, it will be considered
    - Empty lists mean no filtering for that category
    
    **Use Cases:**
    - Search within specific video collections
    - Focus on particular time periods or datasets
    - Limit search to curated content sets
    
    **Example:**
    ```json
    {
        "query": "car driving on highway",
        "top_k": 20,
        "score_threshold": 0.5,
        "include_groups": [2, 4, 6],
        "include_videos": [101, 102, 203, 204]
    }
    ```
    """,
    response_description="List of matching keyframes from selected groups and videos"
)
async def search_keyframes_selected_groups_videos(
    request: TextSearchWithSelectedGroupsAndVideosRequest,
    controller: QueryController = Depends(get_query_controller)
):
    """
    Search for keyframes within selected groups and videos.
    """

    logger.info(f"Text search with selection: query='{request.query}', include_groups={request.include_groups}, include_videos={request.include_videos}")
    
    results = await controller.search_with_selected_video_group(
        query=request.query,
        top_k=request.top_k,
        score_threshold=request.score_threshold,
        list_of_include_groups=request.include_groups,
        list_of_include_videos=request.include_videos
    )
    
    logger.info(f"Found {len(results)} results within selected groups/videos")

    display_results = list(
        map(
            lambda pair: SingleKeyframeDisplay(path=pair[0], score=pair[1]),
            map(controller.convert_model_to_path, results)
        )
    )
    return KeyframeDisplay(results=display_results)


@router.post(
    "/search/metadata",
    response_model=KeyframeDisplay,
    summary="Search keyframes by OCR metadata only",
    description="""
    Search for keyframes based on OCR text results only (no embedding similarity).
    
    This endpoint searches through the OCR text extracted from keyframes to find 
    matches based on text content.
    
    **Parameters:**
    - **ocr_query**: The OCR text to search for
    - **top_k**: Maximum number of results to return (1-500, default: 10)
    - **case_sensitive**: Whether the search should be case sensitive (default: False)
    
    **Returns:**
    List of keyframes with their paths and confidence scores.
    
    **Example:**
    ```json
    {
        "ocr_query": "Hôm nay",
        "top_k": 10,
        "case_sensitive": false
    }
    ```
    """
)
async def search_keyframes_by_metadata(
    request: MetadataSearchRequest,
    controller: QueryController = Depends(get_query_controller)
):
    """
    Search for keyframes using OCR metadata only.
    """
    
    logger.info(f"Metadata search request: ocr_query='{request.ocr_query}', top_k={request.top_k}, case_sensitive={request.case_sensitive}")
    
    results = await controller.search_by_metadata_only(
        ocr_query=request.ocr_query,
        top_k=request.top_k,
        case_sensitive=request.case_sensitive
    )
    
    logger.info(f"Found {len(results)} results for OCR query: '{request.ocr_query}'")
    
    display_results = list(
        map(
            lambda pair: SingleKeyframeDisplay(path=pair[0], score=pair[1]),
            map(controller.convert_model_to_path, results)
        )
    )
    return KeyframeDisplay(results=display_results)


@router.post(
    "/search/hybrid",
    response_model=KeyframeDisplay,
    summary="Hybrid search combining text embedding and OCR metadata",
    description="""
    Perform hybrid search: First filter by OCR metadata, then rank by embedding similarity.
    
    This endpoint uses a two-step approach:
    1. Find keyframes that match the OCR query (acts as a filter)
    2. Rank those keyframes by semantic similarity to the text query
    
    This is more efficient than searching both separately and ensures all results
    contain the required OCR text.
    
    **Parameters:**
    - **query**: The semantic search text
    - **ocr_query**: The OCR text that must be present (required)
    - **top_k**: Maximum number of results to return (1-500, default: 10)
    - **score_threshold**: Minimum hybrid score (0.0-1.0, default: 0.0)
    - **embedding_weight**: Weight for embedding similarity (0.0-1.0, default: 0.7) [kept for compatibility]
    - **metadata_weight**: Weight for metadata match (0.0-1.0, default: 0.3) [kept for compatibility]
    - **case_sensitive**: Whether OCR search should be case sensitive (default: False)
    
    **Returns:**
    List of keyframes with their paths and confidence scores.
    
    **Example:**
    ```json
    {
        "query": "person walking",
        "ocr_query": "Hôm nay",
        "top_k": 10,
        "score_threshold": 0.5,
        "embedding_weight": 0.7,
        "metadata_weight": 0.3,
        "case_sensitive": false
    }
    ```
    """
)
async def search_keyframes_hybrid(
    request: HybridSearchRequest,
    controller: QueryController = Depends(get_query_controller)
):
    """
    Search for keyframes using hybrid approach combining embedding and metadata.
    """
    
    logger.info(f"Hybrid search request: query='{request.query}', ocr_query='{request.ocr_query}', "
               f"embedding_weight={request.embedding_weight}, metadata_weight={request.metadata_weight}")
    
    results = await controller.search_by_hybrid(
        query=request.query,
        ocr_query=request.ocr_query or "",
        top_k=request.top_k,
        score_threshold=request.score_threshold,
        embedding_weight=request.embedding_weight,
        metadata_weight=request.metadata_weight,
        case_sensitive=request.case_sensitive
    )
    
    logger.info(f"Found {len(results)} results for hybrid query")
    
    display_results = list(
        map(
            lambda pair: SingleKeyframeDisplay(path=pair[0], score=pair[1]),
            map(controller.convert_model_to_path, results)
        )
    )
    return KeyframeDisplay(results=display_results)

    


