import { Router } from 'express';
import {
  getEmployees,
  createEmployee,
  getEmployee,
  deleteEmployee,
} from '../controllers/employeeController';
import { validateEmployee } from '../middleware/validation';

const router = Router();

router.route('/').get(getEmployees).post(validateEmployee, createEmployee);

router.route('/:id').get(getEmployee).delete(deleteEmployee);

export default router;
