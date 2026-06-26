import { Router } from 'express';
import { payrollController } from '../controllers/payroll.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// We can protect all payroll routes with the PAYROLL_ACCESS permission if applicable,
// or just require authentication and rely on module toggle checks in the frontend.
// Assuming SUPER_ADMIN or specific PAYROLL_ACCESS role should have access.
router.use(authenticate);

// Dashboard
router.get('/dashboard', payrollController.getDashboardStats.bind(payrollController));

// Employees
router.get('/employees', payrollController.getEmployees.bind(payrollController));
router.get('/employees/:id', payrollController.getEmployeeById.bind(payrollController));
router.post('/employees', payrollController.createEmployee.bind(payrollController));
router.put('/employees/:id', payrollController.updateEmployee.bind(payrollController));
router.delete('/employees/:id', payrollController.deleteEmployee.bind(payrollController));

// Periods
router.get('/periods', payrollController.getPayrollPeriods.bind(payrollController));
router.post('/periods', payrollController.createPayrollPeriod.bind(payrollController));
router.put('/periods/:id', payrollController.updatePayrollPeriod.bind(payrollController));
router.delete('/periods/:id', payrollController.deletePayrollPeriod.bind(payrollController));
router.get('/periods/:id/pdf', payrollController.exportSalarySlipPdf.bind(payrollController));

// Commissions
router.get('/commissions', payrollController.getCommissions.bind(payrollController));
router.post('/commissions', payrollController.createCommission.bind(payrollController));
router.put('/commissions/:id', payrollController.updateCommission.bind(payrollController));
router.delete('/commissions/:id', payrollController.deleteCommission.bind(payrollController));

// Exports
router.get('/export/excel', payrollController.exportPayrollSummaryExcel.bind(payrollController));

export default router;
