import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { settingsService } from './settings.service';

export class ExportService {
  /**
   * Generates an Excel file for orders and streams it to the given response/stream.
   * Uses exceljs for efficient server-side generation of large datasets.
   */
  static async generateOrdersExcel(orders: any[]): Promise<PassThrough> {
    const companyName = await settingsService.getSettingByKey('companyName', 'NexaCRM');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = companyName;
    workbook.title = `${companyName} - Orders Export`;
    const sheet = workbook.addWorksheet('Orders');

    // Define columns based on standard fields
    sheet.columns = [
      { header: 'Order Number', key: 'orderNumber', width: 20 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Created By', key: 'createdBy', width: 25 },
      { header: 'Delivery Date', key: 'deliveryDate', width: 15 },
      { header: 'Notes', key: 'notes', width: 40 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      // Custom fields will be appended dynamically if needed, but let's keep it simple or expand it
    ];

    // Collect all unique custom field keys to add columns dynamically
    const customFieldKeys = new Set<string>();
    orders.forEach(order => {
      if (order.customFields) {
        Object.keys(order.customFields).forEach(key => customFieldKeys.add(key));
      }
    });

    const customFieldsArray = Array.from(customFieldKeys);
    customFieldsArray.forEach(field => {
      sheet.columns = [
        ...(sheet.columns || []),
        { header: `Custom: ${field}`, key: `custom_${field}`, width: 25 }
      ];
    });

    // Make header bold
    sheet.getRow(1).font = { bold: true };

    // Add rows
    orders.forEach(order => {
      const rowData: any = {
        orderNumber: order.orderNumber,
        status: order.status?.name || '',
        createdBy: order.creator?.name || '',
        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '',
        notes: order.notes || '',
        createdAt: new Date(order.createdAt).toLocaleDateString(),
      };

      if (order.customFields) {
        customFieldsArray.forEach(field => {
          let val = order.customFields[field];
          if (typeof val === 'object') val = JSON.stringify(val);
          rowData[`custom_${field}`] = val;
        });
      }

      sheet.addRow(rowData);
    });

    const stream = new PassThrough();
    workbook.xlsx.write(stream).then(() => {
      stream.end();
    });

    return stream;
  }

  /**
   * Generates an Excel file for payroll summary and streams it.
   */
  static async generatePayrollSummaryExcel(periods: any[]): Promise<PassThrough> {
    const companyName = await settingsService.getSettingByKey('companyName', 'NexaCRM');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = companyName;
    workbook.title = `${companyName} - Payroll Summary`;
    const sheet = workbook.addWorksheet('Payroll Summary');

    sheet.columns = [
      { header: 'Employee', key: 'employee', width: 25 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'Period Start', key: 'periodStart', width: 15 },
      { header: 'Period End', key: 'periodEnd', width: 15 },
      { header: 'Gross Salary', key: 'grossSalary', width: 15, style: { numFmt: '"$"#,##0.00' } },
      { header: 'Net Salary', key: 'netSalary', width: 15, style: { numFmt: '"$"#,##0.00' } },
      { header: 'Status', key: 'status', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };

    periods.forEach(p => {
      sheet.addRow({
        employee: p.employee?.name || '',
        role: p.employee?.role || '',
        periodStart: p.periodStart ? new Date(p.periodStart).toLocaleDateString() : '',
        periodEnd: p.periodEnd ? new Date(p.periodEnd).toLocaleDateString() : '',
        grossSalary: Number(p.grossSalary || 0),
        netSalary: Number(p.netSalary || 0),
        status: p.status,
      });
    });

    const stream = new PassThrough();
    workbook.xlsx.write(stream).then(() => {
      stream.end();
    });

    return stream;
  }

  /**
   * Generates a Salary Slip PDF for a specific payroll period.
   */
  static async generateSalarySlipPdf(period: any): Promise<PassThrough> {
    const companyName = await settingsService.getSettingByKey('companyName', 'NexaCRM');
    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    doc.pipe(stream);

    doc.fontSize(20).text('Salary Slip', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(companyName, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).text(`Employee: ${period.employee?.name || ''}`);
    doc.text(`Role: ${period.employee?.role || 'N/A'}`);
    doc.text(`Period Start: ${period.periodStart ? new Date(period.periodStart).toLocaleDateString() : ''}`);
    doc.text(`Period End: ${period.periodEnd ? new Date(period.periodEnd).toLocaleDateString() : ''}`);
    doc.text(`Status: ${period.status}`);
    doc.moveDown();

    doc.text(`Gross Salary: $${Number(period.grossSalary || 0).toFixed(2)}`);
    
    const deductions = period.deductions as Record<string, any>;
    if (deductions && Object.keys(deductions).length > 0) {
      doc.text('Deductions:');
      for (const [key, val] of Object.entries(deductions)) {
        doc.text(`  - ${key}: $${Number(val).toFixed(2)}`);
      }
    }

    doc.moveDown();
    doc.fontSize(14).text(`Net Salary: $${Number(period.netSalary || 0).toFixed(2)}`, { underline: true });

    doc.end();
    return stream;
  }
}
