// Facebook Accounts module types

export type FbAccountStatus = 'Active' | 'Restricted' | 'Banned' | 'Under Review';

export interface FbAccount {
  id: string;
  displayName: string;
  linkedEmail: string | null;
  status: FbAccountStatus;
  creationDate: string | null;
  lastActivityDate: string | null;
  notes: string | null;
  assignedTo: string | null;
  assignedUser?: {
    id: string;
    name: string;
  };
  hasVaultNote: boolean; // Don't expose encrypted content, just indicate presence
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FbAccountCreateInput {
  displayName: string;
  linkedEmail?: string;
  status: FbAccountStatus;
  creationDate?: string;
  notes?: string;
  assignedTo?: string;
  vaultNote?: string; // Plain text — encrypted server-side
}

export interface FbAccountUpdateInput {
  displayName?: string;
  linkedEmail?: string;
  status?: FbAccountStatus;
  lastActivityDate?: string;
  notes?: string;
  assignedTo?: string;
  vaultNote?: string;
}

export interface FbAccountStatusLogEntry {
  id: string;
  fbAccountId: string;
  oldStatus: string | null;
  newStatus: string;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  reason: string | null;
}

export interface RevealVaultInput {
  password: string; // User must confirm their password to reveal
}
