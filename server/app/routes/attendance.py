from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional
from app.database import get_db
from app.models import AttendanceCreate

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


def serialize_attendance(doc: dict, employee: dict | None = None) -> dict:
    result = {
        "_id": str(doc["_id"]),
        "employee": str(doc["employee"]),
        "date": doc["date"] if isinstance(doc["date"], str) else doc["date"].isoformat() if doc.get("date") else "",
        "status": doc["status"],
    }
    if employee:
        result["employee"] = {
            "_id": str(employee["_id"]),
            "employeeId": employee["employeeId"],
            "fullName": employee["fullName"],
            "department": employee["department"],
        }
    return result


@router.post("", status_code=201)
async def mark_attendance(payload: AttendanceCreate):
    db = get_db()

    employee = await db.employees.find_one({"employeeId": payload.employeeId})
    if not employee:
        raise HTTPException(
            status_code=404,
            detail=f'No employee found with ID "{payload.employeeId}"',
        )

    attendance_date = datetime(
        *map(int, payload.date.split("-")), tzinfo=timezone.utc
    )

    existing = await db.attendances.find_one(
        {"employee": employee["_id"], "date": attendance_date}
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Attendance already marked for {payload.employeeId} on {payload.date}",
        )

    doc = {
        "employee": employee["_id"],
        "date": attendance_date,
        "status": payload.status,
    }
    result = await db.attendances.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "data": serialize_attendance(doc, employee)}


@router.get("/employee/{employee_id}")
async def get_attendance_by_employee(
    employee_id: str,
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    db = get_db()

    employee = await db.employees.find_one({"employeeId": employee_id})
    if not employee:
        raise HTTPException(
            status_code=404,
            detail=f'No employee found with ID "{employee_id}"',
        )

    query: dict = {"employee": employee["_id"]}

    if from_date or to_date:
        date_range = {}
        if from_date:
            date_range["$gte"] = datetime(
                *map(int, from_date.split("-")), tzinfo=timezone.utc
            )
        if to_date:
            parts = list(map(int, to_date.split("-")))
            date_range["$lte"] = datetime(
                parts[0], parts[1], parts[2], 23, 59, 59, 999999,
                tzinfo=timezone.utc,
            )
        query["date"] = date_range

    cursor = db.attendances.find(query).sort("date", -1)
    records = []
    async for doc in cursor:
        records.append(serialize_attendance(doc, employee))

    total_present = sum(1 for r in records if r["status"] == "Present")
    total_absent = sum(1 for r in records if r["status"] == "Absent")

    return {
        "success": True,
        "count": len(records),
        "summary": {"totalPresent": total_present, "totalAbsent": total_absent},
        "data": records,
    }
