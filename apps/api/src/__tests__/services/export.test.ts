import { ExportService } from '../../services/export.service';
import { PassThrough } from 'stream';

describe('Export Service', () => {
  it('should generate an orders Excel file for 500 rows without hanging', async () => {
    const orders = Array.from({ length: 500 }, (_, i) => ({
      orderNumber: `NX-${i}`,
      status: { name: 'Confirmed' },
      creator: { name: 'Admin' },
      deliveryDate: new Date(),
      notes: `Note for order ${i}`,
      createdAt: new Date(),
      customFields: {
        'Customer Name': `Customer ${i}`,
        'Phone': '4165550123'
      }
    }));

    const stream = await ExportService.generateOrdersExcel(orders);
    
    expect(stream).toBeInstanceOf(PassThrough);
    
    // Read the stream to ensure it produces data
    let size = 0;
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => {
        size += chunk.length;
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('error', reject);
    });

    // The excel file should have some substantial size
    expect(size).toBeGreaterThan(1000);
  });

  it('should generate a payroll summary Excel file', async () => {
    const periods = Array.from({ length: 50 }, (_, i) => ({
      employee: { name: `Employee ${i}`, role: 'Staff' },
      periodStart: new Date(),
      periodEnd: new Date(),
      grossSalary: 5000,
      netSalary: 4500,
      status: 'PAID'
    }));

    const stream = await ExportService.generatePayrollSummaryExcel(periods);
    
    let size = 0;
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => {
        size += chunk.length;
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('error', reject);
    });

    expect(size).toBeGreaterThan(1000);
  });
});
