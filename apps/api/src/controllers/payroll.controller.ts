import { Request, Response, NextFunction } from 'express';
import { payrollService } from '../services/payroll.service';
import PDFDocument from 'pdfkit';
import * as xlsx from 'xlsx';

export class PayrollController {
  
  // === EMPLOYEES ===

  async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const employees = await payrollService.getEmployees();
      res.json({ success: true, data: employees });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeById(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await payrollService.getEmployeeById(req.params.id as string);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user!.id;
      const employee = await payrollService.createEmployee(req.body, userId);
      res.status(201).json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await payrollService.updateEmployee(req.params.id as string, req.body);
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      await payrollService.deleteEmployee(req.params.id as string);
      res.json({ success: true, message: 'Employee deleted' });
    } catch (error) {
      next(error);
    }
  }

  // === PAYROLL PERIODS ===

  async getPayrollPeriods(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        employeeId: req.query.employeeId as string,
        status: req.query.status as string,
      };
      // remove undefined
      Object.keys(filters).forEach(key => (filters as any)[key] === undefined && delete (filters as any)[key]);

      const periods = await payrollService.getPayrollPeriods(filters);
      res.json({ success: true, data: periods });
    } catch (error) {
      next(error);
    }
  }

  async createPayrollPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user!.id;
      const period = await payrollService.createPayrollPeriod(req.body, userId);
      res.status(201).json({ success: true, data: period });
    } catch (error) {
      next(error);
    }
  }

  async updatePayrollPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const period = await payrollService.updatePayrollPeriod(req.params.id as string, req.body);
      res.json({ success: true, data: period });
    } catch (error) {
      next(error);
    }
  }

  async deletePayrollPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      await payrollService.deletePayrollPeriod(req.params.id as string);
      res.json({ success: true, message: 'Payroll period deleted' });
    } catch (error) {
      next(error);
    }
  }

  // === ADVANCES ===

  async getAdvances(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: any = {
        employeeId: req.query.employeeId as string,
      };
      if (!filters.employeeId) delete filters.employeeId;

      const advances = await payrollService.getAdvances(filters);
      res.json({ success: true, data: advances });
    } catch (error) {
      next(error);
    }
  }

  async createAdvance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user!.id;
      const advance = await payrollService.createAdvance(req.body, userId);
      res.status(201).json({ success: true, data: advance });
    } catch (error) {
      next(error);
    }
  }

  async updateAdvance(req: Request, res: Response, next: NextFunction) {
    try {
      const advance = await payrollService.updateAdvance(req.params.id as string, req.body);
      res.json({ success: true, data: advance });
    } catch (error) {
      next(error);
    }
  }

  async deleteAdvance(req: Request, res: Response, next: NextFunction) {
    try {
      await payrollService.deleteAdvance(req.params.id as string);
      res.json({ success: true, message: 'Advance deleted' });
    } catch (error) {
      next(error);
    }
  }

  // === DASHBOARD ===

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await payrollService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // === EXPORTS ===

  async exportSalarySlipPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const periodId = req.params.id as string;
      // Fetch period with employee
      const periods = await payrollService.getPayrollPeriods();
      const period = periods.find(p => p.id === periodId);

      if (!period) {
        return res.status(404).json({ success: false, message: 'Payroll period not found' });
      }

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=salary_slip_${period.employee.name.replace(/\s+/g, '_')}_${periodId}.pdf`);
      doc.pipe(res);

      // Simple PDF layout
      doc.fontSize(20).text('Salary Slip', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`NexaCRM`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(12).text(`Employee: ${period.employee.name}`);
      doc.text(`Role: ${period.employee.role || 'N/A'}`);
      doc.text(`Period Start: ${period.periodStart.toISOString().split('T')[0]}`);
      doc.text(`Period End: ${period.periodEnd.toISOString().split('T')[0]}`);
      doc.text(`Status: ${period.status}`);
      doc.moveDown();

      doc.text(`Gross Salary: $${Number(period.grossSalary || 0).toFixed(2)}`);
      
      const deductions = period.deductions as Record<string, any>;
      if (deductions && Object.keys(deductions).length > 0) {
        doc.text(`Deductions:`);
        for (const [key, val] of Object.entries(deductions)) {
          doc.text(`  - ${key}: $${Number(val).toFixed(2)}`);
        }
      }

      doc.moveDown();
      doc.fontSize(14).text(`Net Salary: $${Number(period.netSalary || 0).toFixed(2)}`, { underline: true });

      doc.end();
    } catch (error) {
      next(error);
    }
  }

  async exportPayrollSummaryExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const periods = await payrollService.getPayrollPeriods(); // Could add month filter
      
      const data = periods.map(p => ({
        Employee: p.employee.name,
        Role: p.employee.role,
        PeriodStart: p.periodStart.toISOString().split('T')[0],
        PeriodEnd: p.periodEnd.toISOString().split('T')[0],
        GrossSalary: Number(p.grossSalary || 0),
        NetSalary: Number(p.netSalary || 0),
        Status: p.status,
      }));

      const ws = xlsx.utils.json_to_sheet(data);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Payroll Summary");
      
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename="payroll_summary.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

}

export const payrollController = new PayrollController();
