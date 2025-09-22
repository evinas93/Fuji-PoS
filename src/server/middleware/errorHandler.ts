// Global error handling middleware
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Custom error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

// Error response interface
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
  details?: unknown;
  stack?: string;
}

// Main error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = undefined;

  // Handle different error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof z.ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = {
      errors: err.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code,
      })),
    };
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.message.includes('duplicate key value violates unique constraint')) {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.message.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  } else if (err.message.includes('check constraint')) {
    statusCode = 400;
    message = 'Data validation failed';
  }

  // Log error details
  const errorLog = {
    statusCode,
    message: err.message,
    stack: err.stack,
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    user: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  };

  // Log different levels based on status code
  if (statusCode >= 500) {
    console.error('🔥 Server Error:', errorLog);
  } else if (statusCode >= 400) {
    console.warn('⚠️  Client Error:', errorLog);
  } else {
    console.log('ℹ️  Info:', errorLog);
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: getErrorName(statusCode),
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };

  // Add details for validation errors
  if (details) {
    errorResponse.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Get error name from status code
function getErrorName(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Unprocessable Entity';
    case 500:
      return 'Internal Server Error';
    case 502:
      return 'Bad Gateway';
    case 503:
      return 'Service Unavailable';
    default:
      return 'Error';
  }
}

// Async error wrapper for route handlers
export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found middleware (should be used before error handler)
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};

