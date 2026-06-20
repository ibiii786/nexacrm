import { OrderSequenceService } from '../../services/orderSequence.service';
import prisma from '../../config/database';

jest.mock('../../config/database', () => ({
  orderSequence: {
    upsert: jest.fn(),
  },
}));

describe('OrderSequenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateNextOrderNumber', () => {
    it('should generate first order number for the year correctly', async () => {
      const currentYear = new Date().getFullYear();
      (prisma.orderSequence.upsert as jest.Mock).mockResolvedValue({
        year: currentYear,
        lastNumber: 1,
      });

      const orderNumber = await OrderSequenceService.generateNextOrderNumber();

      expect(orderNumber).toBe(`NX-${currentYear}-00001`);
      expect(prisma.orderSequence.upsert).toHaveBeenCalledWith({
        where: { year: currentYear },
        update: { lastNumber: { increment: 1 } },
        create: { year: currentYear, lastNumber: 1 },
      });
    });

    it('should pad the sequence number with zeros', async () => {
      const currentYear = new Date().getFullYear();
      (prisma.orderSequence.upsert as jest.Mock).mockResolvedValue({
        year: currentYear,
        lastNumber: 42,
      });

      const orderNumber = await OrderSequenceService.generateNextOrderNumber();

      expect(orderNumber).toBe(`NX-${currentYear}-00042`);
    });

    it('should handle large numbers beyond 5 digits without truncating', async () => {
      const currentYear = new Date().getFullYear();
      (prisma.orderSequence.upsert as jest.Mock).mockResolvedValue({
        year: currentYear,
        lastNumber: 123456,
      });

      const orderNumber = await OrderSequenceService.generateNextOrderNumber();

      expect(orderNumber).toBe(`NX-${currentYear}-123456`);
    });
  });
});
