import { prisma } from '../config/database';
import { User } from '@prisma/client';

export class SearchService {
  async globalSearch(query: string, user: User) {
    if (!query || query.trim().length < 2) {
      return { orders: [], users: [], statuses: [], announcements: [] };
    }

    const searchTerm = `%${query}%`;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    // 1. Search Orders
    // We search order_number, notes, and also customer name inside custom_fields JSONB.
    // However, Prisma doesn't support ILIKE on JSONB fields natively in a simple way.
    // Let's rely on raw SQL for orders to do a case-insensitive search on the customer name.
    
    // Using Prisma raw query for Orders:
    const ordersRaw = await prisma.$queryRaw<any[]>`
      SELECT id, order_number as "orderNumber", custom_fields as "customFields", status_id as "statusId"
      FROM orders
      WHERE 
        deleted_at IS NULL AND
        (
          order_number ILIKE ${searchTerm} OR
          notes ILIKE ${searchTerm} OR
          custom_fields::text ILIKE ${searchTerm}
        )
      LIMIT 10
    `;

    // 2. Search Announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: { id: true, title: true },
      take: 5
    });

    // 3. Search Users (Admin only)
    let users: any[] = [];
    if (isAdmin) {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: { id: true, name: true, email: true },
        take: 5
      });
    }

    // 4. Search Statuses (Admin only)
    let statuses: any[] = [];
    let fbAccounts: any[] = [];
    if (isAdmin) {
      statuses = await prisma.status.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          isArchived: false
        },
        select: { id: true, name: true, color: true },
        take: 5
      });
      
      fbAccounts = await prisma.fbAccount.findMany({
        where: {
          OR: [
            { displayName: { contains: query, mode: 'insensitive' } },
            { linkedEmail: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: { id: true, displayName: true, linkedEmail: true, status: true },
        take: 5
      });
    }

    return {
      orders: ordersRaw.map((o: any) => ({
        id: o.id,
        title: o.orderNumber,
        subtitle: o.customFields?.['Customer Name'] || o.customFields?.['Client Name'] || 'Unknown Customer'
      })),
      announcements: announcements.map((a: any) => ({
        id: a.id,
        title: a.title,
        subtitle: 'Announcement'
      })),
      users: users.map((u: any) => ({
        id: u.id,
        title: u.name,
        subtitle: u.email
      })),
      statuses: statuses.map((s: any) => ({
        id: s.id,
        title: s.name,
        subtitle: 'Status'
      })),
      fbAccounts: fbAccounts.map((fb: any) => ({
        id: fb.id,
        title: fb.displayName,
        subtitle: `FB Account - ${fb.linkedEmail || 'No Email'}`
      }))
    };
  }
}

export const searchService = new SearchService();
