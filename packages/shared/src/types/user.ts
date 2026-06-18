// User-related types

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string | null;
  previousLogin: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface UserCreateInput {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  orderCount: number;
}

export interface UserWithPermissions extends User {
  effectivePermissions: string[];
}

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
}
