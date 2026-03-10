from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from app.database import get_db
from app.models import EmployeeCreate

router = APIRouter(prefix="/api/employees", tags=["employees"])


def serialize_employee(doc: dict) -> dict:
    return {
        "_id": str(doc["_id"]),
        "employeeId": doc["employeeId"],
        "fullName": doc["fullName"],
        "email": doc["email"],
        "department": doc["department"],
        "createdAt": doc.get("createdAt", ""),
    }


@router.get("")
async def get_employees():
    db = get_db()
    cursor = db.employees.find().sort("employeeId", 1)
    employees = [serialize_employee(doc) async for doc in cursor]
    return {"success": True, "count": len(employees), "data": employees}


@router.post("", status_code=201)
async def create_employee(payload: EmployeeCreate):
    db = get_db()

    existing = await db.employees.find_one({"employeeId": payload.employeeId})
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f'Employee with ID "{payload.employeeId}" already exists',
        )

    existing_email = await db.employees.find_one({"email": payload.email})
    if existing_email:
        raise HTTPException(
            status_code=409,
            detail=f'An employee with email "{payload.email}" already exists',
        )

    doc = {
        "employeeId": payload.employeeId,
        "fullName": payload.fullName,
        "email": payload.email,
        "department": payload.department,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.employees.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "data": serialize_employee(doc)}


@router.get("/{id}")
async def get_employee(id: str):
    db = get_db()
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    doc = await db.employees.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"success": True, "data": serialize_employee(doc)}


@router.delete("/{id}")
async def delete_employee(id: str):
    db = get_db()
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    doc = await db.employees.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Employee not found")

    await db.attendances.delete_many({"employee": ObjectId(id)})
    await db.employees.delete_one({"_id": ObjectId(id)})
    return {"success": True, "data": {}}
