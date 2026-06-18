// Field type definitions and standard pre-built fields
// From Section 3 Module 3

import { FieldType } from '../types/field';

export { FieldType };

// Labels for field types in UI
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FieldType.TEXT]: 'Text',
  [FieldType.NUMBER]: 'Number',
  [FieldType.DATE]: 'Date',
  [FieldType.PHONE]: 'Phone',
  [FieldType.EMAIL]: 'Email',
  [FieldType.SELECT]: 'Select',
  [FieldType.MULTISELECT]: 'Multi-Select',
  [FieldType.CHECKBOX]: 'Checkbox',
  [FieldType.TEXTAREA]: 'Text Area',
  [FieldType.ADDRESS]: 'Address',
};

// Standard pre-built fields — cannot be deleted, only hidden
// From Section 3: Module 3

export interface StandardField {
  name: string;       // Internal name (camelCase)
  label: string;      // Display label
  type: FieldType;
  isRequired: boolean;
  isSystem: boolean;  // System fields are auto-set, not user-editable
  position: number;
  options?: string[]; // For SELECT type
}

export const STANDARD_FIELDS: StandardField[] = [
  {
    name: 'customerName',
    label: 'Customer Name',
    type: FieldType.TEXT,
    isRequired: true,
    isSystem: false,
    position: 0,
  },
  {
    name: 'orderNumber',
    label: 'Order Number',
    type: FieldType.TEXT,
    isRequired: true,
    isSystem: true, // Auto-generated NX-YYYY-NNNNN
    position: 1,
  },
  {
    name: 'orderStatus',
    label: 'Order Status',
    type: FieldType.SELECT,
    isRequired: true,
    isSystem: false,
    position: 2,
  },
  {
    name: 'customerPhone',
    label: 'Customer Phone',
    type: FieldType.PHONE,
    isRequired: false,
    isSystem: false,
    position: 3,
  },
  {
    name: 'deliveryAddress',
    label: 'Delivery Address',
    type: FieldType.ADDRESS,
    isRequired: false,
    isSystem: false,
    position: 4,
  },
  {
    name: 'orderDate',
    label: 'Order Date',
    type: FieldType.DATE,
    isRequired: true,
    isSystem: true, // Auto-set on creation
    position: 5,
  },
  {
    name: 'deliveryDate',
    label: 'Delivery Date',
    type: FieldType.DATE,
    isRequired: false,
    isSystem: false,
    position: 6,
  },
  {
    name: 'productsOrdered',
    label: 'Products Ordered',
    type: FieldType.TEXTAREA,
    isRequired: false,
    isSystem: false,
    position: 7,
  },
  {
    name: 'price',
    label: 'Price',
    type: FieldType.NUMBER,
    isRequired: false,
    isSystem: false,
    position: 8,
  },
  {
    name: 'paymentStatus',
    label: 'Payment Status',
    type: FieldType.SELECT,
    isRequired: false,
    isSystem: false,
    position: 9,
    options: ['Paid', 'Unpaid', 'Partial'],
  },
  {
    name: 'notes',
    label: 'Notes',
    type: FieldType.TEXTAREA,
    isRequired: false,
    isSystem: false,
    position: 10,
  },
  {
    name: 'createdBy',
    label: 'Created By',
    type: FieldType.TEXT,
    isRequired: true,
    isSystem: true, // Auto-set, readonly
    position: 11,
  },
];
