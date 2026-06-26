import { z } from 'zod';

const fieldTypeEnum = z.enum([
  'TEXT', 'NUMBER', 'DATE', 'PHONE', 'EMAIL',
  'SELECT', 'MULTISELECT', 'CHECKBOX', 'TEXTAREA', 'ADDRESS',
]);

export const createFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(50)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  label: z.string().min(1, 'Field label is required').max(100),
  type: fieldTypeEnum,
  isRequired: z.boolean().optional().default(false),
  isGlobal: z.boolean().optional().default(true),
  options: z.array(z.string().min(1)).optional(), // Required for SELECT/MULTISELECT
  statusIds: z.array(z.string().uuid()).optional(), // When isGlobal = false
}).refine((data) => {
  if (data.type === 'SELECT' || data.type === 'MULTISELECT') {
    return data.options && data.options.length > 0;
  }
  return true;
}, {
  message: 'Options are required for SELECT and MULTISELECT fields',
  path: ['options'],
});

export const updateFieldSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  type: fieldTypeEnum.optional(),
  isRequired: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  isGlobal: z.boolean().optional(),
  options: z.array(z.string().min(1)).optional(),
  statusIds: z.array(z.string().uuid()).optional(),
});

export const reorderFieldSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1, 'Provide at least one field ID'),
});

export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
export type ReorderFieldInput = z.infer<typeof reorderFieldSchema>;
