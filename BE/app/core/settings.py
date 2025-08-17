from pydantic_settings import BaseSettings
from pydantic import Field
from dotenv import load_dotenv
load_dotenv()


class MongoDBSettings(BaseSettings):
    MONGO_HOST: str = Field(..., alias='MONGO_HOST')
    MONGO_PORT: int = Field(..., alias='MONGO_PORT')
    MONGO_DB: str = Field(..., alias='MONGO_DB')
    MONGO_USER: str = Field(..., alias='MONGO_USER')
    MONGO_PASSWORD: str = Field(..., alias='MONGO_PASSWORD')


class IndexPathSettings(BaseSettings):
    FAISS_INDEX_PATH: str | None
    USEARCH_INDEX_PATH: str | None

class KeyFrameIndexMilvusSetting(BaseSettings):
    COLLECTION_NAME: str = "keyframe"
    HOST: str = 'localhost'
    PORT: str = '19530'
    METRIC_TYPE: str = 'COSINE'
    INDEX_TYPE: str = 'FLAT'
    BATCH_SIZE: int =10000
    SEARCH_PARAMS: dict = {}

class AppSettings(BaseSettings):
    DATA_FOLDER: str  = "/media/"
    ID2INDEX_PATH: str = "/media/lam/SEAGATE/archive/AIC25-Batch1/TestFolder/V1/mapping.json"
    MODEL_NAME: str = "ViT-B-32"
    FRAME2OBJECT: str = '/media/tinhanhnguyen/Data3/Projects/HCMAI2025_Baseline/app/data/detections.json'
    ASR_PATH: str = '/media/tinhanhnguyen/Data3/Projects/HCMAI2025_Baseline/app/data/asr_proc.json'
