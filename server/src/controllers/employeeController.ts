import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';

export const getEmployees = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { employeeId, fullName, email, department } = req.body;

    // check both unique fields before creating
    const existingById = await Employee.findOne({ employeeId });
    if (existingById) {
      res.status(409).json({ success: false, error: `Employee with ID "${employeeId}" already exists` });
      return;
    }

    const existingByEmail = await Employee.findOne({ email: email.toLowerCase() });
    if (existingByEmail) {
      res.status(409).json({ success: false, error: `An employee with email "${email}" already exists` });
      return;
    }

    const employee = await Employee.create({ employeeId, fullName, email, department });
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }

    // also remove their attendance records
    await Attendance.deleteMany({ employee: employee._id });
    await Employee.findByIdAndDelete(req.params.id);

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
