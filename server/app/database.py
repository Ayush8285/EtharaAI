import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri, tlsCAFile=certifi.where())
    db = client.get_default_database("hrms-lite")
    # ensure indexes
    await db.employees.create_index("employeeId", unique=True)
    await db.employees.create_index("email", unique=True)
    await db.attendances.create_index(
        [("employee", 1), ("date", 1)], unique=True
    )
    print("Connected to MongoDB")


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return db
