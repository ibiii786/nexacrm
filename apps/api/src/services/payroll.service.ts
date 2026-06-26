import { prisma } from '../config/database';

export class PayrollService {
  // === EMPLOYEES ===

  async getEmployees() {
    return prisma.employee.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getEmployeeById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
    });
  }

  async createEmployee(data: any, createdBy: string) {
    return prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
        baseSalary: data.baseSalary,
        currency: data.currency || 'PKR',
        paymentSchedule: data.paymentSchedule,
        isActive: data.isActive ?? true,
        createdBy,
      },
    });
  }

  async updateEmployee(id: string, data: any) {
    return prisma.employee.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
        baseSalary: data.baseSalary,
        currency: data.currency,
        paymentSchedule: data.paymentSchedule,
        isActive: data.isActive,
      },
    });
  }

  async deleteEmployee(id: string) {
    return prisma.employee.delete({
      where: { id },
    });
  }

  // === PAYROLL PERIODS ===

  async getPayrollPeriods(filters?: { employeeId?: string; status?: string }) {
    return prisma.payrollPeriod.findMany({
      where: filters,
      include: {
        employee: true,
        commissions: true,
      },
      orderBy: { periodStart: 'desc' },
    });
  }

  async getPayrollPeriodById(id: string) {
    return prisma.payrollPeriod.findUnique({
      where: { id },
      include: {
        employee: true,
        commissions: true,
      },
    });
  }

  async createPayrollPeriod(data: any, createdBy: string) {
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    
    // Fetch unassigned commissions in this period
    const commissions = await prisma.commission.findMany({
      where: {
        employeeId: data.employeeId,
        date: { gte: new Date(data.periodStart), lte: new Date(data.periodEnd) },
        payrollPeriodId: null
      }
    });
    
    const commissionTotal = commissions.reduce((sum, comm) => sum + Number(comm.amount || 0), 0);

    // Basic net salary calculation
    const grossSalary = data.grossSalary !== undefined ? data.grossSalary : (employee?.baseSalary || 0);
    const explicitDeductions: number = data.deductions ? Number(Object.values(data.deductions).reduce((acc: any, val: any) => acc + Number(val), 0)) : 0;
    const deductionsTotal = explicitDeductions + commissionTotal;
    
    // If the frontend explicitly passed a netSalary, respect it, otherwise calculate it
    const netSalary = data.netSalary !== undefined && data.netSalary !== null 
      ? data.netSalary 
      : (Number(grossSalary) - Number(deductionsTotal));

    const period = await prisma.payrollPeriod.create({
      data: {
        employeeId: data.employeeId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        grossSalary: grossSalary,
        deductions: data.deductions || { commissions: commissionTotal },
        netSalary: netSalary,
        status: data.status || 'PENDING',
        paidAt: data.status === 'PAID' ? new Date() : null,
        createdBy,
      },
      include: {
        employee: true,
      }
    });

    // Link commissions to this period
    if (commissions.length > 0) {
      await prisma.commission.updateMany({
        where: { id: { in: commissions.map(c => c.id) } },
        data: { payrollPeriodId: period.id }
      });
    }

    return period;
  }

  async updatePayrollPeriod(id: string, data: any) {
    let updateData: any = {
      grossSalary: data.grossSalary,
      deductions: data.deductions,
      status: data.status,
    };

    if (data.status === 'PAID') {
      updateData.paidAt = new Date();
    } else if (data.status === 'PENDING') {
      updateData.paidAt = null;
    }

    if (data.netSalary !== undefined && data.netSalary !== null) {
      updateData.netSalary = data.netSalary;
    } else if (data.grossSalary !== undefined || data.deductions !== undefined) {
      // Re-calculate net
      const period = await prisma.payrollPeriod.findUnique({ where: { id } });
      const gross = data.grossSalary !== undefined ? data.grossSalary : period?.grossSalary;
      const deds = data.deductions !== undefined ? data.deductions : period?.deductions;
      
      const deductionsTotal = deds ? Object.values(deds as Record<string,any>).reduce((acc: any, val: any) => acc + Number(val), 0) : 0;
      updateData.netSalary = Number(gross || 0) - Number(deductionsTotal);
    }

    return prisma.payrollPeriod.update({
      where: { id },
      data: updateData,
      include: {
        employee: true,
      }
    });
  }

  async deletePayrollPeriod(id: string) {
    return prisma.payrollPeriod.delete({ where: { id } });
  }

  // === COMMISSIONS ===

  async getCommissions(filters?: { employeeId?: string }) {
    return prisma.commission.findMany({
      where: filters,
      include: {
        employee: true,
        payrollPeriod: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async createCommission(data: any, createdBy: string) {
    return prisma.commission.create({
      data: {
        employeeId: data.employeeId,
        amount: data.amount,
        reason: data.reason,
        date: data.date ? new Date(data.date) : new Date(),
        payrollPeriodId: data.payrollPeriodId,
        createdBy,
      },
    });
  }

  async updateCommission(id: string, data: any) {
    return prisma.commission.update({
      where: { id },
      data: {
        amount: data.amount,
        reason: data.reason,
        date: data.date ? new Date(data.date) : undefined,
        payrollPeriodId: data.payrollPeriodId,
      },
    });
  }

  async deleteCommission(id: string) {
    return prisma.commission.delete({ where: { id } });
  }

  // === DASHBOARD ===

  async getDashboardStats() {
    // Get total employees
    const employeeCount = await prisma.employee.count({ where: { isActive: true } });
    
    // Get total paid this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const paidThisMonth = await prisma.payrollPeriod.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: startOfMonth }
      },
      _sum: {
        netSalary: true
      }
    });

    const pendingPayroll = await prisma.payrollPeriod.aggregate({
      where: {
        status: 'PENDING'
      },
      _sum: {
        netSalary: true
      }
    });

    return {
      activeEmployees: employeeCount,
      paidThisMonth: Number(paidThisMonth._sum.netSalary || 0),
      pendingPayroll: Number(pendingPayroll._sum.netSalary || 0),
    };
  }
}

export const payrollService = new PayrollService();
