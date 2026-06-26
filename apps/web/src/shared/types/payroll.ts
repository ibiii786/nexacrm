// Payroll-related types

export interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  joiningDate: string | null;
  baseSalary: number | null;
  paymentSchedule: string | null;
  isActive: boolean;
  createdBy: string;
}

export interface EmployeeCreateInput {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  joiningDate?: string;
  baseSalary?: number;
  paymentSchedule?: 'weekly' | 'biweekly' | 'monthly';
}

export interface EmployeeUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  joiningDate?: string;
  baseSalary?: number;
  paymentSchedule?: string;
  isActive?: boolean;
}

export type PayrollStatus = 'PENDING' | 'PAID';

export interface PayrollPeriod {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  grossSalary: number | null;
  deductions: Record<string, number>;
  netSalary: number | null;
  status: PayrollStatus;
  paidAt: string | null;
  createdBy: string;
  employee?: Employee;
}

export interface PayrollPeriodCreateInput {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  grossSalary: number;
  deductions?: Record<string, number>;
  netSalary: number;
}

export interface PayrollPeriodUpdateInput {
  grossSalary?: number;
  deductions?: Record<string, number>;
  netSalary?: number;
  status?: PayrollStatus;
  paidAt?: string;
}

export interface Commission {
  id: string;
  employeeId: string;
  amount: number;
  reason: string | null;
  date: string | null;
  payrollPeriodId: string | null;
  createdBy: string;
  employee?: Employee;
}

export interface CommissionCreateInput {
  employeeId: string;
  amount: number;
  reason?: string;
  date?: string;
  payrollPeriodId?: string;
}
