// Permission-related types

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  permissions: Permission[];
}

export interface PolicyCreateInput {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface PolicyUpdateInput {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  policyCount: number;
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
  policies: Array<{
    id: string;
    name: string;
    addedAt: string;
  }>;
}

export interface UserPolicyAssignment {
  id: string;
  userId: string;
  policyId: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  policy: Policy;
}


export interface EffectivePermissions {
  permissions: string[];
  sources: Array<{
    source: 'individual' | 'group';
    sourceName: string;
    policyName: string;
    permissions: string[];
    expiresAt: string | null;
  }>;
}
