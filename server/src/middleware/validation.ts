import { body } from 'express-validator';

export const validateEmployee = [
  body('employeeId')
    .trim()
    .notEmpty()
    .withMessage('Employee ID is required'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),
];

export const validateAttendance = [
  body('employeeId')
    .trim()
    .notEmpty()
    .withMessage('Employee ID is required'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date format (YYYY-MM-DD)'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Present', 'Absent'])
    .withMessage('Status must be either Present or Absent'),
];
