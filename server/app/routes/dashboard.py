from fastapi import APIRouter
from datetime import datetime, timezone
from app.database import get_db

router = APIRouter(tags=["dashboard"])


@router.get("/api/dashboard")
async def get_dashboard():
    db = get_db()

    total_employees = await db.employees.count_documents({})

    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    today_end = datetime(
        now.year, now.month, now.day, 23, 59, 59, 999999, tzinfo=timezone.utc
    )

    cursor = db.attendances.find(
        {"date": {"$gte": today_start, "$lte": today_end}}
    )

    today_records = []
    async for doc in cursor:
        emp = await db.employees.find_one({"_id": doc["employee"]})
        record = {
            "_id": str(doc["_id"]),
            "date": doc["date"].isoformat() if hasattr(doc["date"], "isoformat") else str(doc["date"]),
            "status": doc["status"],
            "employee": {
                "_id": str(emp["_id"]),
                "employeeId": emp["employeeId"],
                "fullName": emp["fullName"],
                "department": emp["department"],
            } if emp else str(doc["employee"]),
        }
        today_records.append(record)

    today_present = sum(1 for r in today_records if r["status"] == "Present")
    today_absent = sum(1 for r in today_records if r["status"] == "Absent")
    today_not_marked = max(0, total_employees - today_present - today_absent)

    return {
        "success": True,
        "data": {
            "totalEmployees": total_employees,
            "todayPresent": today_present,
            "todayAbsent": today_absent,
            "todayNotMarked": today_not_marked,
            "todayAttendance": today_records,
        },
    }
