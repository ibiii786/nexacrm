import { Response } from 'express';
import { ApiSuccessResponse, ApiErrorResponse } from '@nexacrm/shared';

/**
 * Standardized API response helpers (Section 12, Point 12)
 * Ensures all API responses conform to the exact required shapes.
 */

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: ApiSuccessResponse<T>['meta'],
  statusCode = 200
) {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
) {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return res.status(statusCode).json(response);
}
