
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from typing import List, Optional

from schema.request import (
    TextSearchRequest,
    TextSearchWithExcludeGroupsRequest,
    TextSearchWithSelectedGroupsAndVideosRequest,
    MetadataSearchRequest,
    HybridSearchRequest,
    ObjectSearchRequest,
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
    summary="Enhanced hybrid search",
    description="""
    Search for keyframes using enhanced hybrid approach combining text embedding, OCR metadata, and object detection.
    
    This endpoint provides flexible multi-modal search by allowing you to combine:
    - Text-based semantic search using embeddings (optional)
    - OCR text search within images (optional)
    - Object detection filters (optional)
    
    **At least one search criteria must be provided.**
    
    **How it works:**
    1. Filters by OCR and/or objects first (mandatory filters if provided)
    2. Performs semantic search only within that filtered set (if query provided)
    3. Results are ranked by embedding similarity (if query provided) or metadata relevance
    
    **Parameters:**
    - **query**: Optional search text for semantic similarity
    - **ocr_query**: Optional OCR text to search for
    - **object_filters**: Optional object detection filters with minimum counts
    - **top_k**: Maximum number of results to return
    - **score_threshold**: Minimum confidence score for embedding similarity
    - **case_sensitive**: Whether OCR search is case sensitive
    - **embedding_weight/metadata_weight**: Kept for API compatibility
    
    **Example:**
    ```json
    {
        "ocr_query": "Hôm nay",
        "object_filters": {"person": 1, "car": 1},
        "top_k": 10,
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
    
    # Validate that at least one search criteria is provided
    has_query = request.query is not None and len(request.query.strip()) > 0
    has_ocr = request.ocr_query is not None and len(request.ocr_query.strip()) > 0
    has_objects = request.object_filters is not None and len(request.object_filters) > 0
    
    if not (has_query or has_ocr or has_objects):
        raise HTTPException(
            status_code=422,
            detail="At least one search criteria must be provided: query, ocr_query, or object_filters"
        )
    
    logger.info(f"Hybrid search request: query='{request.query}', ocr_query='{request.ocr_query}', "
               f"embedding_weight={request.embedding_weight}, metadata_weight={request.metadata_weight}")
    
    results = await controller.search_by_hybrid(
        query=request.query,
        ocr_query=request.ocr_query,
        object_filters=request.object_filters,
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


@router.post(
    "/search/objects",
    response_model=KeyframeDisplay,
    summary="Object detection-based search",
    description="""
    Search for keyframes based on object detection results.
    
    This endpoint allows you to find keyframes containing specific objects
    with minimum occurrence counts.
    
    **Parameters:**
    - **object_filters**: Dictionary of object names and minimum counts
    - **top_k**: Maximum number of results to return
    
    **Example:**
    ```json
    {
        "object_filters": {"person": 2, "car": 1},
        "top_k": 10
    }
    ```
    """
)
async def search_keyframes_by_objects(
    request: ObjectSearchRequest,
    controller: QueryController = Depends(get_query_controller)
):
    """
    Search for keyframes containing specific objects with minimum counts.
    """
    
    logger.info(f"Object search request: object_filters={request.object_filters}, top_k={request.top_k}")
    
    results = await controller.search_by_objects_only(
        object_filters=request.object_filters,
        top_k=request.top_k
    )
    
    logger.info(f"Found {len(results)} results for object search")
    
    display_results = list(
        map(
            lambda pair: SingleKeyframeDisplay(path=pair[0], score=pair[1]),
            map(controller.convert_model_to_path, results)
        )
    )
    return KeyframeDisplay(results=display_results)

    


