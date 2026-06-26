import request from 'supertest';
import app from '../../app';
import { OrdersService } from '../../services/orders.service';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

import { PERMISSIONS } from '../../shared';

jest.mock('../../services/orders.service');


jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000', isActive: true, deletedAt: null }),
    },
    userPermission: { 
      findMany: jest.fn().mockResolvedValue([
        { permission: { name: 'orders:create' } },
        { permission: { name: 'orders:edit_own' } },
        { permission: { name: 'orders:delete_own' } }
      ]) 
    },
    order: { findMany: jest.fn(), create: jest.fn() },
    status: { findFirst: jest.fn().mockResolvedValue({ id: 's1', name: 'New' }) }
  }
}));

describe('Orders Routes', () => {
  let token: string;
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(() => {
    token = jwt.sign({ userId: validUuid, role: 'USER' }, env.JWT_ACCESS_SECRET as string);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/orders', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/orders');
      expect(response.status).toBe(401);
    });

    it('should return 200 with token', async () => {
      (OrdersService.getOrders as jest.Mock).mockResolvedValue({ orders: [], total: 0 });

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/orders', () => {
    it('should return 201 on successful creation', async () => {
      (OrdersService.createOrder as jest.Mock).mockResolvedValue({ id: 'o1', orderNumber: '2026-00001' });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ statusId: 's1', customFields: {} });

      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe('o1');
    });


  });
});
