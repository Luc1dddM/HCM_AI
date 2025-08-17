from typing_extensions import Dict, List
from beanie import Document, Indexed
from typing import Annotated
from pydantic import BaseModel, Field


class Keyframe(Document):
    key: Annotated[int, Indexed(unique=True)]
    video_num: Annotated[int, Indexed()]
    group_num: Annotated[int, Indexed()]
    keyframe_num: Annotated[int, Indexed()]
    object_counts: Dict[str, int]
    ocr_results: List[str]

    class Settings:
        name = "keyframes"
