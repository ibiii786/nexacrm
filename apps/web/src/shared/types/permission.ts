// Permission-related types

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  permission: Permission;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  permissionCount: number;
}

export interface GroupCreateInput {
  name: string;
  description?: string;
}

export interface GroupUpdateInput {
  name?: string;
  description?: string;
}

export interface GroupWithDetails extends Group {
  members: Array<{
    id: string;
    name: string;
    email: string;
    addedAt: string;
  }>;
  permissions: Array<{
    id: string;
    name: string;
    addedAt: string;
  }>;
}

export interface UserPermissionAssignment {
  id: string;
  userId: string;
  permissionId: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  permission: Permission;
}
