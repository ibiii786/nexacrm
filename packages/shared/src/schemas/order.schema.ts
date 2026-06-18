import { z } from 'zod';

export const createOrderSchema = z.object({
  statusId: z.string().uuid('Invalid status ID'),
  deliveryDate: z.string().nullable().optional(),
  customFields: z.record(z.string(), z.string()).optional().default({}),
  notes: z.string().nullable().optional(),
});

export const updateOrderSchema = z.object({
  statusId: z.string().uuid('Invalid status ID').optional(),
  deliveryDate: z.string().nullable().optional(),
  customFields: z.record(z.string(), z.string()).optional(),
  notes: z.string().nullable().optional(),
});

export const bulkStatusChangeSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1, 'Select at least one order'),
  statusId: z.string().uuid('Invalid status ID'),
});

export const bulkDeleteSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1, 'Select at least one order'),
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Type DELETE to confirm' }),
  }),
});

export const parsePasteSchema = z.object({
  text: z.string().min(1, 'Paste text cannot be empty'),
});

export const orderFiltersSchema = z.object({
  statusId: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  deliveryDateFrom: z.string().optional(),
  deliveryDateTo: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(200).optional().default(50),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type BulkStatusChangeInput = z.infer<typeof bulkStatusChangeSchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type ParsePasteInput = z.infer<typeof parsePasteSchema>;
export type OrderFiltersInput = z.infer<typeof orderFiltersSchema>;
