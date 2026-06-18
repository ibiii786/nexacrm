import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1, 'Name is required').max(100).optional(),
  role: z.enum(['ADMIN', 'USER']).optional(), // Cannot assign SUPER_ADMIN
  isActive: z.boolean().optional(),
});

export const assignPolicySchema = z.object({
  policyId: z.string().uuid('Invalid policy ID'),
  expiresAt: z.string().datetime().nullable().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignPolicyInput = z.infer<typeof assignPolicySchema>;
