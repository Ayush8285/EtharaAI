import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';

export const markAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { employeeId, date, status } = req.body;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      res.status(404).json({ success: false, error: `No employee found with ID "${employeeId}"` });
      return;
    }

    // normalize to UTC midnight so we don't get weird timezone duplicates
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({ employee: employee._id, date: attendanceDate });
    if (existing) {
      res.status(409).json({
        success: false,
        error: `Attendance already marked for ${employeeId} on ${attendanceDate.toISOString().split('T')[0]}`,
      });
      return;
    }

    const attendance = await Attendance.create({
      employee: employee._id,
      date: attendanceDate,
      status,
    });

    const populated = await Attendance.findById(attendance._id).populate('employee', 'employeeId fullName department');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceByEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { from, to } = req.query;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      res.status(404).json({ success: false, error: `No employee found with ID "${employeeId}"` });
      return;
    }

    const filter: Record<string, unknown> = { employee: employee._id };

    if (from || to) {
      const dateRange: Record<string, Date> = {};
      if (from) {
        const d = new Date(from as string);
        d.setUTCHours(0, 0, 0, 0);
        dateRange.$gte = d;
      }
      if (to) {
        const d = new Date(to as string);
        d.setUTCHours(23, 59, 59, 999);
        dateRange.$lte = d;
      }
      filter.date = dateRange;
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate('employee', 'employeeId fullName department');

    const totalPresent = records.filter(r => r.status === 'Present').length;
    const totalAbsent = records.filter(r => r.status === 'Absent').length;

    res.json({
      success: true,
      count: records.length,
      summary: { totalPresent, totalAbsent },
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalEmployees = await Employee.countDocuments();

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const todayRecords = await Attendance.find({
      date: { $gte: todayStart, $lte: todayEnd },
    }).populate('employee', 'employeeId fullName department');

    const todayPresent = todayRecords.filter(r => r.status === 'Present').length;
    const todayAbsent = todayRecords.filter(r => r.status === 'Absent').length;
    const todayNotMarked = Math.max(0, totalEmployees - todayPresent - todayAbsent);

    res.json({
      success: true,
      data: {
        totalEmployees,
        todayPresent,
        todayAbsent,
        todayNotMarked,
        todayAttendance: todayRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};
