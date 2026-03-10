from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017/hrms-lite"
    port: int = 5000

    class Config:
        env_file = ".env"


settings = Settings()
