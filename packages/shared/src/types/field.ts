// Field-related types

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  CHECKBOX = 'CHECKBOX',
  TEXTAREA = 'TEXTAREA',
  ADDRESS = 'ADDRESS',
}

export interface Field {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  isRequired: boolean;
  isVisible: boolean;
  isGlobal: boolean;
  options: string[] | null; // For SELECT and MULTISELECT
  position: number;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FieldCreateInput {
  name: string;
  label: string;
  type: FieldType;
  isRequired?: boolean;
  isGlobal?: boolean;
  options?: string[];
  statusIds?: string[]; // When isGlobal = false
}

export interface FieldUpdateInput {
  label?: string;
  type?: FieldType;
  isRequired?: boolean;
  isVisible?: boolean;
  isGlobal?: boolean;
  options?: string[];
  statusIds?: string[];
}

export interface FieldReorderInput {
  orderedIds: string[];
}

export interface FieldWithStatusIds extends Field {
  statusIds: string[];
}
