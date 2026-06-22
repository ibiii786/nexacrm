/**
 * Tests for Edit Window Enforcement (Remediation 2.1)
 * 
 * The blueprint (Section 12 point 4) requires:
 * - On every order update/delete: if now() > order.createdAt + editWindowMinutes
 *   AND the user is not ADMIN/SUPER_ADMIN, reject with 403 EDIT_WINDOW_EXPIRED.
 */

// Mock dependencies before importing
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    status: {
      findUnique: jest.fn(),
    },
    setting: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock('../../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
}));

jest.mock('sanitize-html', () => ({
  __esModule: true,
  default: jest.fn((str) => str),
}));

jest.mock('../../services/orderAuditLog.service', () => ({
  OrderAuditLogService: {
    logAction: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/notifications.service', () => ({
  notificationsService: {
    createNotification: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/settings.service', () => ({
  settingsService: {
    getSettingByKey: jest.fn().mockResolvedValue('30'), // Default 30 minutes
  },
}));

jest.mock('../../services/statuses.service', () => ({
  StatusesService: {
    getFieldsForStatus: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../services/orderSequence.service', () => ({
  OrderSequenceService: {
    generateNextOrderNumber: jest.fn().mockResolvedValue('NX-2026-00001'),
  },
}));

import { OrdersService, EditWindowExpiredError } from '../../services/orders.service';

const mockPrisma = jest.requireMock('../../config/database').default;

describe('Edit Window Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeOrder = (createdMinutesAgo: number) => ({
    id: 'order-1',
    orderNumber: 'NX-2026-00001',
    statusId: 'status-1',
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - createdMinutesAgo * 60 * 1000),
    updatedAt: new Date(),
    deletedAt: null,
    deliveryDate: null,
    customFields: {},
    notes: null,
    status: { id: 'status-1', name: 'Confirmed' },
  });

  describe('updateOrder', () => {
    it('should allow USER to update within edit window (default 30 min)', async () => {
      const order = makeOrder(10); // 10 minutes ago — within window
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({ ...order, notes: 'updated' });

      const result = await OrdersService.updateOrder('order-1', {
        notes: 'updated',
        updatedBy: 'user-1',
        userRole: 'USER',
      });

      expect(result).toBeDefined();
      expect(mockPrisma.order.update).toHaveBeenCalled();
    });

    it('should reject USER update after edit window expires', async () => {
      const order = makeOrder(60); // 60 minutes ago — past 30 min window
      mockPrisma.order.findUnique.mockResolvedValue(order);

      await expect(
        OrdersService.updateOrder('order-1', {
          notes: 'should fail',
          updatedBy: 'user-1',
          userRole: 'USER',
        })
      ).rejects.toThrow(EditWindowExpiredError);

      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('should allow ADMIN to update after edit window expires', async () => {
      const order = makeOrder(60); // 60 minutes ago — past window
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({ ...order, notes: 'admin update' });

      const result = await OrdersService.updateOrder('order-1', {
        notes: 'admin update',
        updatedBy: 'admin-1',
        userRole: 'ADMIN',
      });

      expect(result).toBeDefined();
      expect(mockPrisma.order.update).toHaveBeenCalled();
    });

    it('should allow SUPER_ADMIN to update after edit window expires', async () => {
      const order = makeOrder(120); // 2 hours ago
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({ ...order, notes: 'sa update' });

      const result = await OrdersService.updateOrder('order-1', {
        notes: 'sa update',
        updatedBy: 'sa-1',
        userRole: 'SUPER_ADMIN',
      });

      expect(result).toBeDefined();
      expect(mockPrisma.order.update).toHaveBeenCalled();
    });
  });

  describe('deleteOrder', () => {
    it('should reject USER delete after edit window expires', async () => {
      const order = makeOrder(60); // Past window
      mockPrisma.order.findUnique.mockResolvedValue(order);

      await expect(
        OrdersService.deleteOrder('order-1', 'user-1', 'USER')
      ).rejects.toThrow(EditWindowExpiredError);

      expect(mockPrisma.order.delete).not.toHaveBeenCalled();
    });

    it('should allow ADMIN to delete after edit window expires', async () => {
      const order = makeOrder(60);
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.delete.mockResolvedValue(order);

      await OrdersService.deleteOrder('order-1', 'admin-1', 'ADMIN');

      expect(mockPrisma.order.delete).toHaveBeenCalled();
    });

    it('should allow USER to delete within edit window', async () => {
      const order = makeOrder(5); // 5 minutes ago
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.delete.mockResolvedValue(order);

      await OrdersService.deleteOrder('order-1', 'user-1', 'USER');

      expect(mockPrisma.order.delete).toHaveBeenCalled();
    });
  });
});
