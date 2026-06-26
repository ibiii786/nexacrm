// ./ - Shared types, schemas, and constants
// This package is consumed by both apps/web and apps/api

// Types
export * from './types/user';
export * from './types/order';
export * from './types/status';
export * from './types/field';
export * from './types/permission';
export * from './types/payroll';
export * from './types/fb-account';

// Schemas
export * from './schemas/auth.schema';
export * from './schemas/order.schema';
export * from './schemas/user.schema';
export * from './schemas/status.schema';
export * from './schemas/field.schema';
export * from './schemas/settings.schema';

// Constants
export * from './constants/permissions';
export * from './constants/defaultStatuses';
export * from './constants/fieldTypes';

// Standard API Response shapes (Section 12, point 12)
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page: number;
    total: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Force rebuild: 2026-06-21
