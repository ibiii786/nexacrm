import { z } from 'zod';

export const createStatusSchema = z.object({
  name: z.string().min(1, 'Status name is required').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  icon: z.string().max(50).nullable().optional(),
});

export const updateStatusSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  icon: z.string().max(50).nullable().optional(),
  isArchived: z.boolean().optional(),
});

export const reorderStatusSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1, 'Provide at least one status ID'),
});

export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ReorderStatusInput = z.infer<typeof reorderStatusSchema>;
