"""
The implementation of Keyframe repositories. The following class is responsible for getting the keyframe by many ways
"""

import os
import sys
ROOT_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__), '../'
    )
)

sys.path.insert(0, ROOT_DIR)

from typing import Any
from models.keyframe import Keyframe
from common.repository import MongoBaseRepository
from schema.interface import KeyframeInterface




class KeyframeRepository(MongoBaseRepository[Keyframe]):
    async def get_keyframe_by_list_of_keys(
        self, keys: list[int]
    ):
        result = await self.find({"key": {"$in": keys}})
        return [
            KeyframeInterface(
                key=keyframe.key,
                video_num=keyframe.video_num,
                group_num=keyframe.group_num,
                keyframe_num=keyframe.keyframe_num
            ) for keyframe in result

        ]

    async def get_keyframe_by_video_num(
        self, 
        video_num: int,
    ):
        result = await self.find({"video_num": video_num})
        return [
            KeyframeInterface(
                key=keyframe.key,
                video_num=keyframe.video_num,
                group_num=keyframe.group_num,
                keyframe_num=keyframe.keyframe_num
            ) for keyframe in result
        ]

    async def get_keyframe_by_keyframe_num(
        self, 
        keyframe_num: int,
    ):
        result = await self.find({"keyframe_num": keyframe_num})
        return [
            KeyframeInterface(
                key=keyframe.key,
                video_num=keyframe.video_num,
                group_num=keyframe.group_num,
                keyframe_num=keyframe.keyframe_num
            ) for keyframe in result
        ]

    async def search_by_ocr(
        self,
        ocr_query: str,
        case_sensitive: bool = False,
        limit: int = 100
    ):
        """Search keyframes by OCR results"""
        if case_sensitive:
            query = {"ocr_results": {"$elemMatch": {"$regex": ocr_query}}}
        else:
            query = {"ocr_results": {"$elemMatch": {"$regex": ocr_query, "$options": "i"}}}
        
        result = await self.find(query, limit=limit)
        return [
            KeyframeInterface(
                key=keyframe.key,
                video_num=keyframe.video_num,
                group_num=keyframe.group_num,
                keyframe_num=keyframe.keyframe_num
            ) for keyframe in result
        ]
    

    
    async def search_by_objects(
    self,
    object_filters: dict[str, int],
    limit: int = 100
    ):
        """
        Search keyframes by multiple object detection results.
        
        Args:
            object_filters: dict với key = object_name, value = min_count
                ví dụ {"person": 2, "car": 1}
            limit: số lượng kết quả tối đa
        
        Returns:
            List[KeyframeInterface]
        """
        query_conditions = [
            {f"object_counts.{obj}": {"$gte": count}}
            for obj, count in object_filters.items()
        ]
        
        query = {"$and": query_conditions} if query_conditions else {}
        
        result = await self.find(query, limit=limit)
        return [
            KeyframeInterface(
                key=keyframe.key,
                video_num=keyframe.video_num,
                group_num=keyframe.group_num,
                keyframe_num=keyframe.keyframe_num
            ) for keyframe in result
        ]



