import logging
import certifi
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.mongodb_uri, tlsCAFile=certifi.where())
        db = client.get_default_database("hrms-lite")
        # ensure indexes
        await db.employees.create_index("employeeId", unique=True)
        await db.employees.create_index("email", unique=True)
        await db.attendances.create_index(
            [("employee", 1), ("date", 1)], unique=True
        )
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error("Failed to connect to MongoDB: %s", e)
        raise


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db
