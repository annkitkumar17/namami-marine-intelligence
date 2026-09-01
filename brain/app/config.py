from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "NAMAMI Brain Service"
    ENVIRONMENT: str = "development"
    DATA_MODE: str = "FIXTURE" # FIXTURE | REAL | FALLBACK
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://namami_user:namami_password@localhost:5432/namami"
    
    # Redis & MinIO
    REDIS_URL: str = "redis://localhost:6379/0"
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadminpassword"
    MINIO_BUCKET_COG: str = "namami-cog-granules"
    
    # External APIs
    INCOIS_PFZ_API_URL: str = "https://incois.gov.in/portal/pfz/advisory"
    IMD_DISTRICT_WARNING_URL: str = "https://mausam.imd.gov.in/api/districtwarning"
    MOSDAC_SST_API_URL: str = "https://api.mosdac.gov.in/products/sst"
    BHOONIDHI_API_URL: str = "https://bhoonidhi.nrsc.gov.in/api/ocm3"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
