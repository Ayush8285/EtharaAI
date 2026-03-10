import { Request, Response, NextFunction } from 'express';

interface MongoError extends Error {
  statusCode?: number;
  code?: number;
  keyPattern?: Record<string, number>;
  errors?: Record<string, { message: string }>;
}

const errorHandler = (err: MongoError, _req: Request, res: Response, _next: NextFunction): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyPattern ? Object.keys(err.keyPattern).join(', ') : 'field';
    message = `Duplicate value for ${field}. This record already exists.`;
  }

  // mongoose validation
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join('. ');
  }

  // bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  res.status(statusCode).json({ success: false, error: message });
};

export default errorHandler;
