// Status-related types

export interface Status {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isDefault: boolean;
  isArchived: boolean;
  position: number;
  createdBy: string;
  createdAt: string;
}

export interface StatusCreateInput {
  name: string;
  color: string;
  icon?: string | null;
}

export interface StatusUpdateInput {
  name?: string;
  color?: string;
  icon?: string | null;
  isArchived?: boolean;
}

export interface StatusReorderInput {
  orderedIds: string[];
}

export interface StatusWithCount extends Status {
  orderCount: number;
}
