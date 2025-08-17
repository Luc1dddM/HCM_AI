import sys
import os

ROOT_FOLDER = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')
)
sys.path.insert(0, ROOT_FOLDER)


from pathlib import Path
import asyncio
import json
import argparse

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.settings import MongoDBSettings
from app.models.keyframe import Keyframe

SETTING = MongoDBSettings()

async def init_db():
    client = AsyncIOMotorClient(
        host=SETTING.MONGO_HOST,
        port=SETTING.MONGO_PORT,
        username=SETTING.MONGO_USER,
        password=SETTING.MONGO_PASSWORD,
    )
    await init_beanie(database=client[SETTING.MONGO_DB], document_models=[Keyframe])


def load_json_data(file_path: str):
    """Load JSON từ file"""
    return json.load(open(file_path, "r", encoding="utf-8"))


def transform_data(mapping: dict[str, str], metadata: dict[str, dict]) -> list[Keyframe]:
    """
    Chuyển đổi mapping + metadata sang list Keyframe objects
    """
    keyframes = []
    for key, mapping_value in mapping.items():
        group, video, keyframe = mapping_value.split('/')
        meta = metadata.get(keyframe, {})

        keyframe_obj = Keyframe(
            key=int(key),
            video_num=int(video),
            group_num=int(group),
            keyframe_num=int(keyframe),
            object_counts=meta.get("object_counts", {}),
            ocr_results=meta.get("ocr_results", [])
        )
        keyframes.append(keyframe_obj)
    return keyframes


async def migrate_videos(data_root: str):
    """Duyệt tất cả folder video và migrate keyframes"""
    await init_db()

    data_root = Path(data_root)
    if not data_root.exists() or not data_root.is_dir():
        print(f"Data root folder {data_root} không tồn tại hoặc không phải folder")
        return

    video_folders = [f for f in data_root.iterdir() if f.is_dir()]
    if not video_folders:
        print(f"Không tìm thấy folder video trong {data_root}")
        return

    for video_folder in video_folders:
        mapping_path = video_folder / "mapping.json"
        metadata_path = video_folder / "metadata.json"

        if not mapping_path.exists() or not metadata_path.exists():
            print(f"Skipping {video_folder.name}: missing mapping.json or metadata.json")
            continue

        mapping = load_json_data(mapping_path)
        metadata = load_json_data(metadata_path)

        keyframes = transform_data(mapping, metadata)

        # Lưu từng keyframe (insert nếu mới, update nếu đã tồn tại)
        for kf in keyframes:
            await kf.save()  # <- Thay thế upsert() bằng save()

        print(f"Processed video {video_folder.name}: {len(keyframes)} keyframes migrated")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate keyframes from multiple videos.")
    parser.add_argument(
        "--data_root",
        type=str,
        required=True,
        help="Path to folder containing video folders",
    )
    args = parser.parse_args()

    asyncio.run(migrate_videos(args.data_root))
