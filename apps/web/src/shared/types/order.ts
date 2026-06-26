// Order-related types

export interface Order {
  id: string;
  orderNumber: string;
  statusId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deliveryDate: string | null;
  customFields: Record<string, string>;
  notes: string | null;
}

export interface OrderWithRelations extends Order {
  status: {
    id: string;
    name: string;
    color: string;
  };
  creator: {
    id: string;
    name: string;
  };
  attachments: Attachment[];
}

export interface OrderCreateInput {
  statusId: string;
  deliveryDate?: string | null;
  customFields?: Record<string, string>;
  notes?: string | null;
}

export interface OrderUpdateInput {
  statusId?: string;
  deliveryDate?: string | null;
  customFields?: Record<string, string>;
  notes?: string | null;
}

export interface OrderFilters {
  statusId?: string;
  createdBy?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Attachment {
  id: string;
  orderId: string;
  filename: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

export interface OrderAuditEntry {
  id: string;
  orderId: string;
  userId: string;
  userName?: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}



export interface ParsePasteResult {
  mappedFields: Record<string, string>;
  unknownFields: Array<{
    candidateName: string;
    candidateValue: string;
  }>;
}

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';
