import { Router } from 'express';
import {
  markAttendance,
  getAttendanceByEmployee,
} from '../controllers/attendanceController';
import { validateAttendance } from '../middleware/validation';

const router = Router();

router.route('/').post(validateAttendance, markAttendance);

router.route('/employee/:employeeId').get(getAttendanceByEmployee);

export default router;
