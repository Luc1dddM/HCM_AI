import os
import sys
ROOT_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__), '../'
    )
)
sys.path.insert(0, ROOT_DIR)


from repository.milvus import KeyframeVectorRepository
from repository.milvus import MilvusSearchRequest
from repository.mongo import KeyframeRepository

from schema.response import KeyframeServiceReponse

class KeyframeQueryService:
    def __init__(
            self,
            keyframe_vector_repo: KeyframeVectorRepository,
            keyframe_mongo_repo: KeyframeRepository,
        ):

        self.keyframe_vector_repo = keyframe_vector_repo
        self.keyframe_mongo_repo= keyframe_mongo_repo


    async def _retrieve_keyframes(self, ids: list[int]):
        keyframes = await self.keyframe_mongo_repo.get_keyframe_by_list_of_keys(ids)
        print(keyframes[:5])

        keyframe_map = {k.key: k for k in keyframes}
        return_keyframe = [
            keyframe_map[k] for k in ids
        ]
        return return_keyframe

    async def _search_keyframes(
        self,
        text_embedding: list[float],
        top_k: int,
        score_threshold: float | None = None,
        exclude_indices: list[int] | None = None
    ) -> list[KeyframeServiceReponse]:

        search_request = MilvusSearchRequest(
            embedding=text_embedding,
            top_k=top_k,
            exclude_ids=exclude_indices
        )

        search_response = await self.keyframe_vector_repo.search_by_embedding(search_request)


        filtered_results = [
            result for result in search_response.results
            if score_threshold is None or result.distance > score_threshold
        ]

        sorted_results = sorted(
            filtered_results, key=lambda r: r.distance, reverse=True
        )

        sorted_ids = [result.id_ for result in sorted_results]

        keyframes = await self._retrieve_keyframes(sorted_ids)


        keyframe_map = {k.key: k for k in keyframes}
        response = []

        for result in sorted_results:
            keyframe = keyframe_map.get(result.id_)
            if keyframe is not None:
                response.append(
                    KeyframeServiceReponse(
                        key=keyframe.key,
                        video_num=keyframe.video_num,
                        group_num=keyframe.group_num,
                        keyframe_num=keyframe.keyframe_num,
                        confidence_score=result.distance
                    )
                )
        return response


    async def search_by_text(
        self,
        text_embedding: list[float],
        top_k: int,
        score_threshold: float | None = 0.5,
    ):
        return await self._search_keyframes(text_embedding, top_k, score_threshold, None)


    async def search_by_text_range(
        self,
        text_embedding: list[float],
        top_k: int,
        score_threshold: float | None,
        range_queries: list[tuple[int,int]]
    ):
        """
        range_queries: a bunch of start end indices, and we just search inside these, ignore everything
        """

        all_ids = self.keyframe_vector_repo.get_all_id()
        allowed_ids = set()
        for start, end in range_queries:
            allowed_ids.update(range(start, end + 1))

        exclude_ids = [id_ for id_ in all_ids if id_ not in allowed_ids]

        return await self._search_keyframes(text_embedding, top_k, score_threshold, exclude_ids)

    async def search_by_text_exclude_ids(
        self,
        text_embedding: list[float],
        top_k: int,
        score_threshold: float | None,
        exclude_ids: list[int] | None
    ):
        """
        range_queries: a bunch of start end indices, and we just search inside these, ignore everything
        """
        return await self._search_keyframes(text_embedding, top_k, score_threshold, exclude_ids)

    async def search_by_metadata_only(
        self,
        ocr_query: str,
        top_k: int = 10,
        case_sensitive: bool = False
    ) -> list[KeyframeServiceReponse]:
        """Search keyframes by OCR metadata only"""
        
        keyframes = await self.keyframe_mongo_repo.search_by_ocr(
            ocr_query=ocr_query,
            case_sensitive=case_sensitive,
            limit=top_k
        )
        
        # Convert to simple response format
        response = []
        for kf_interface in keyframes:
            response.append(
                KeyframeServiceReponse(
                    key=kf_interface.key,
                    video_num=kf_interface.video_num,
                    group_num=kf_interface.group_num,
                    keyframe_num=kf_interface.keyframe_num,
                    confidence_score=1.0  # Full confidence for metadata-only search
                )
            )
        
        return response[:top_k]

    async def search_by_hybrid(
        self,
        text_embedding: list[float] = None,
        ocr_query: str = None,
        object_filters: dict[str, int] = None,
        top_k: int = 10,
        score_threshold: float | None = 0.5,
        embedding_weight: float = 0.7,  # Kept for API compatibility but not used
        metadata_weight: float = 0.3,   # Kept for API compatibility but not used
        case_sensitive: bool = False
    ) -> list[KeyframeServiceReponse]:
        """
        Enhanced Hybrid search: Filter by OCR and/or objects first, then rank by embedding similarity
        
        This approach:
        1. Filter by OCR (if provided) and objects (if provided) as mandatory filters
        2. Search embeddings only within that filtered set (if embedding provided)
        3. Rank by embedding similarity or return filtered results
        
        This ensures all results match all provided filters and is much faster than naive hybrid approaches.
        The embedding_weight and metadata_weight parameters are kept for API compatibility but not used
        since we use filters as binary filters (must match) and embedding for ranking.
        """
        
        candidate_ids = None
        
        # Step 1: Get OCR candidates if OCR query provided
        if ocr_query:
            ocr_keyframes = await self.keyframe_mongo_repo.search_by_ocr(
                ocr_query=ocr_query,
                case_sensitive=case_sensitive,
                limit=top_k * 10  # Get more candidates
            )
            candidate_ids = set(kf.key for kf in ocr_keyframes)
        
        # Step 2: Get object candidates if object filters provided
        if object_filters:
            object_keyframes = await self.keyframe_mongo_repo.search_by_objects(
                object_filters=object_filters,
                limit=top_k * 10  # Get more candidates
            )
            object_candidate_ids = set(kf.key for kf in object_keyframes)
            
            # Intersect with OCR candidates if both filters are provided
            if candidate_ids is not None:
                candidate_ids = candidate_ids.intersection(object_candidate_ids)
            else:
                candidate_ids = object_candidate_ids
        
        # If no filters provided but text_embedding available, search all (fallback to regular text search)
        if candidate_ids is None and text_embedding is not None:
            return await self.search_by_text(text_embedding, top_k, score_threshold)
        
        # If no metadata filters provided and no text embedding, return empty
        if candidate_ids is None:
            return []
        
        # If no candidates found after filtering, return empty
        if not candidate_ids:
            return []
        
        # If we have candidates but no text embedding, return the metadata results directly
        if text_embedding is None:
            # Get keyframe details for the candidates
            metadata_results = []
            if ocr_query:
                ocr_keyframes = await self.keyframe_mongo_repo.search_by_ocr(
                    ocr_query=ocr_query,
                    case_sensitive=case_sensitive,
                    limit=top_k
                )
                for kf in ocr_keyframes:
                    if kf.key in candidate_ids:
                        metadata_results.append(
                            KeyframeServiceReponse(
                                key=kf.key,
                                video_num=kf.video_num,
                                group_num=kf.group_num,
                                keyframe_num=kf.keyframe_num,
                                confidence_score=1.0  # Full confidence for metadata-only search
                            )
                        )
            elif object_filters:
                object_keyframes = await self.keyframe_mongo_repo.search_by_objects(
                    object_filters=object_filters,
                    limit=top_k
                )
                for kf in object_keyframes:
                    if kf.key in candidate_ids:
                        metadata_results.append(
                            KeyframeServiceReponse(
                                key=kf.key,
                                video_num=kf.video_num,
                                group_num=kf.group_num,
                                keyframe_num=kf.keyframe_num,
                                confidence_score=1.0  # Full confidence for metadata-only search
                            )
                        )
            return metadata_results[:top_k]
        
        # Step 3: Create exclude list for vector search (search only within candidates)
        all_vector_ids = self.keyframe_vector_repo.get_all_id()
        exclude_ids = [id_ for id_ in all_vector_ids if id_ not in candidate_ids]
        
        # Step 4: Perform vector search on filtered candidates
        vector_results = await self._search_keyframes(
            text_embedding=text_embedding,
            top_k=top_k,
            score_threshold=score_threshold,
            exclude_indices=exclude_ids
        )
        
    async def search_by_hybrid(
        self,
        text_embedding: list[float] = None,
        ocr_query: str = None,
        object_filters: dict[str, int] = None,
        top_k: int = 10,
        score_threshold: float | None = 0.5,
        embedding_weight: float = 0.7,  # Kept for API compatibility but not used
        metadata_weight: float = 0.3,   # Kept for API compatibility but not used
        case_sensitive: bool = False
    ) -> list[KeyframeServiceReponse]:
        """
        Enhanced Hybrid search: Filter by OCR and/or objects first, then rank by embedding similarity
        
        This approach:
        1. Filter by OCR (if provided) and objects (if provided) as mandatory filters
        2. Search embeddings only within that filtered set (if embedding provided)
        3. Rank by embedding similarity or return filtered results
        
        This ensures all results match all provided filters and is much faster than naive hybrid approaches.
        The embedding_weight and metadata_weight parameters are kept for API compatibility but not used
        since we use filters as binary filters (must match) and embedding for ranking.
        """
        
        candidate_ids = None
        
        # Step 1: Get OCR candidates if OCR query provided
        if ocr_query:
            ocr_keyframes = await self.keyframe_mongo_repo.search_by_ocr(
                ocr_query=ocr_query,
                case_sensitive=case_sensitive,
                limit=top_k * 10  # Get more candidates
            )
            candidate_ids = set(kf.key for kf in ocr_keyframes)
        
        # Step 2: Get object candidates if object filters provided
        if object_filters:
            object_keyframes = await self.keyframe_mongo_repo.search_by_objects(
                object_filters=object_filters,
                limit=top_k * 10  # Get more candidates
            )
            object_candidate_ids = set(kf.key for kf in object_keyframes)
            
            # Intersect with OCR candidates if both filters are provided
            if candidate_ids is not None:
                candidate_ids = candidate_ids.intersection(object_candidate_ids)
            else:
                candidate_ids = object_candidate_ids
        
        # If no filters provided but text_embedding available, search all (fallback to regular text search)
        if candidate_ids is None and text_embedding is not None:
            return await self.search_by_text(text_embedding, top_k, score_threshold)
        
        # If no metadata filters provided and no text embedding, return empty
        if candidate_ids is None:
            return []
        
        # If no candidates found after filtering, return empty
        if not candidate_ids:
            return []
        
        # If we have candidates but no text embedding, return the metadata results directly
        if text_embedding is None:
            # Get keyframe details for the candidates
            metadata_results = []
            if ocr_query:
                ocr_keyframes = await self.keyframe_mongo_repo.search_by_ocr(
                    ocr_query=ocr_query,
                    case_sensitive=case_sensitive,
                    limit=top_k
                )
                for kf in ocr_keyframes:
                    if kf.key in candidate_ids:
                        metadata_results.append(
                            KeyframeServiceReponse(
                                key=kf.key,
                                video_num=kf.video_num,
                                group_num=kf.group_num,
                                keyframe_num=kf.keyframe_num,
                                confidence_score=1.0  # Full confidence for metadata-only search
                            )
                        )
            elif object_filters:
                object_keyframes = await self.keyframe_mongo_repo.search_by_objects(
                    object_filters=object_filters,
                    limit=top_k
                )
                for kf in object_keyframes:
                    if kf.key in candidate_ids:
                        metadata_results.append(
                            KeyframeServiceReponse(
                                key=kf.key,
                                video_num=kf.video_num,
                                group_num=kf.group_num,
                                keyframe_num=kf.keyframe_num,
                                confidence_score=1.0  # Full confidence for metadata-only search
                            )
                        )
            return metadata_results[:top_k]
        
        # Step 3: Create exclude list for vector search (search only within candidates)
        all_vector_ids = self.keyframe_vector_repo.get_all_id()
        exclude_ids = [id_ for id_ in all_vector_ids if id_ not in candidate_ids]
        
        # Step 4: Perform vector search on filtered candidates
        vector_results = await self._search_keyframes(
            text_embedding=text_embedding,
            top_k=top_k,
            score_threshold=score_threshold,
            exclude_indices=exclude_ids
        )
        
        return vector_results

    async def search_by_objects_only(
        self,
        object_filters: dict[str, int],
        top_k: int = 10
    ) -> list[KeyframeServiceReponse]:
        """Search keyframes by object detection results only"""
        
        keyframes = await self.keyframe_mongo_repo.search_by_objects(
            object_filters=object_filters,
            limit=top_k
        )
        
        # Convert to response format
        response = []
        for kf_interface in keyframes:
            response.append(
                KeyframeServiceReponse(
                    key=kf_interface.key,
                    video_num=kf_interface.video_num,
                    group_num=kf_interface.group_num,
                    keyframe_num=kf_interface.keyframe_num,
                    confidence_score=1.0  # Full confidence for object-only search
                )
            )
        
        return response[:top_k]
