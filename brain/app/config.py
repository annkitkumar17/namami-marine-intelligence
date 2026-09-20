from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "NAMAMI Brain Service"
    ENVIRONMENT: str = "development"
    DATA_MODE: str = "FIXTURE"  # FIXTURE | REAL | FALLBACK
    LOG_LEVEL: str = "info"
    READY_STRICT: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://namami_user:namami_password@localhost:5432/namami"
    REDIS_URL: str = "redis://localhost:6379/0"
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadminpassword"
    MINIO_BUCKET_COG: str = "namami-cog-granules"

    FEATURE_INCOIS: bool = False
    FEATURE_IMD: bool = False
    FEATURE_BHOONIDHI: bool = False
    FEATURE_BHASHINI: bool = False
    FEATURE_NAVIC: bool = False
    FEATURE_MOSDAC: bool = False

    INCOIS_PFZ_API_URL: str = ""
    INCOIS_API_KEY: str = ""
    IMD_DISTRICT_WARNING_URL: str = ""
    IMD_API_KEY: str = ""
    MOSDAC_SST_API_URL: str = ""
    MOSDAC_API_KEY: str = ""
    BHOONIDHI_API_URL: str = ""
    BHOONIDHI_API_KEY: str = ""
    BHASHINI_API_URL: str = "https://dhruva-api.bhashini.gov.in/services/inference"
    BHASHINI_USER_ID: str = "4488e52b16-cd68-4ec5-b2f7-0469e5c91b69"
    BHASHINI_API_KEY: str = "4488e52b16-cd68-4ec5-b2f7-0469e5c91b69"
    BHASHINI_INFERENCE_KEY: str = "k3FEJN4_5onQnl6oOfmOFzz96DruoAmkhg4bduFKVi7W4X9sp59jAwzVvCl9fjbp"
    NAVIC_GATEWAY_URL: str = ""
    NAVIC_GATEWAY_KEY: str = ""


settings = Settings()
