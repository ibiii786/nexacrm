import request from 'supertest';
import express, { Request, Response } from 'express';
import { authorize } from '../../middleware/authorize';
import { authenticate } from '../../middleware/authenticate';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { PERMISSIONS } from '../../shared';



jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn().mockImplementation((args) => {
        let role = 'USER';
        if (args.where.id === '44444444-4444-4444-4444-444444444444') role = 'SUPER_ADMIN';
        return Promise.resolve({ id: args.where.id, isActive: true, deletedAt: null, role });
      }),
    },
    userPermission: { 
      findMany: jest.fn().mockImplementation((args) => {
        if (args.where.userId === '11111111-1111-1111-1111-111111111111') {
          return Promise.resolve([
            { permission: { name: PERMISSIONS.ORDERS_EDIT_OWN } },
            { permission: { name: PERMISSIONS.ORDERS_CREATE } }
          ]);
        }
        if (args.where.userId === '22222222-2222-2222-2222-222222222222') {
          return Promise.resolve([
            { permission: { name: PERMISSIONS.ORDERS_EDIT_OWN } }
          ]);
        }
        return Promise.resolve([]);
      })
    }
  }
}));

const app = express();
app.use(express.json());
app.use(authenticate);

app.get('/write', authorize([PERMISSIONS.ORDERS_CREATE]), (req: Request, res: Response) => {
  res.status(200).json({ success: true });
});

describe('Permissions Middleware', () => {
  it('should allow access if user has permission', async () => {
    const token = jwt.sign({ userId: '11111111-1111-1111-1111-111111111111', role: 'USER' }, env.JWT_ACCESS_SECRET as string);

    const response = await request(app)
      .get('/write')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should deny access if user lacks permission', async () => {
    const token = jwt.sign({ userId: '22222222-2222-2222-2222-222222222222', role: 'USER' }, env.JWT_ACCESS_SECRET as string);

    const response = await request(app)
      .get('/write')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('should bypass permissions for SUPER_ADMIN', async () => {
    const token = jwt.sign({ userId: '44444444-4444-4444-4444-444444444444', role: 'SUPER_ADMIN' }, env.JWT_ACCESS_SECRET as string);

    const response = await request(app)
      .get('/write')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
