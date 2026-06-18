import prisma from '../config/database';
import { startOfDay, startOfWeek, startOfMonth, subDays, endOfDay, subMonths } from 'date-fns';

export class DashboardService {
  static async getAdminDashboardStats(previousLoginAt?: string) {
    const today = startOfDay(new Date());
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const monthStart = startOfMonth(new Date());
    const thirtyDaysAgo = subDays(new Date(), 30);
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfDay(subDays(monthStart, 1));

    // KPI Cards
    const ordersToday = await prisma.order.count({ where: { createdAt: { gte: today } } });
    const ordersThisWeek = await prisma.order.count({ where: { createdAt: { gte: weekStart } } });
    const ordersThisMonth = await prisma.order.count({ where: { createdAt: { gte: monthStart } } });
    const ordersLastMonth = await prisma.order.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    });

    const activeUsersToday = await prisma.user.count({
      where: { lastLogin: { gte: today } }
    });

    // Orders by status
    const statuses = await prisma.status.findMany();
    const statusCounts = await prisma.order.groupBy({
      by: ['statusId'],
      _count: { id: true },
    });
    
    const ordersByStatus = statuses.map(status => {
      const count = statusCounts.find(s => s.statusId === status.id)?._count.id || 0;
      return { status: status.name, color: status.color, count };
    });

    // Orders trend (last 30 days) - using raw SQL for date grouping is easier in Postgres
    const ordersTrendRaw = await prisma.$queryRaw<any[]>`
      SELECT DATE(created_at) as date, COUNT(id) as count
      FROM orders
      WHERE created_at >= ${thirtyDaysAgo} AND deleted_at IS NULL
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;
    const ordersTrend = ordersTrendRaw.map(row => ({
      date: new Date(row.date).toISOString().split('T')[0],
      count: Number(row.count)
    }));

    // Top performer this week
    const userPerformanceRaw = await prisma.$queryRaw<any[]>`
      SELECT created_by as "userId", COUNT(id) as count
      FROM orders
      WHERE created_at >= ${weekStart} AND deleted_at IS NULL
      GROUP BY created_by
      ORDER BY COUNT(id) DESC
      LIMIT 1
    `;
    
    let topPerformer = null;
    if (userPerformanceRaw.length > 0) {
      const user = await prisma.user.findUnique({ where: { id: userPerformanceRaw[0].userId } });
      if (user) {
        topPerformer = { name: user.name, count: Number(userPerformanceRaw[0].count) };
      }
    }

    // Today's deliveries
    const todayDeliveries = await prisma.order.findMany({
      where: { deliveryDate: today },
      include: { status: true },
      orderBy: { createdAt: 'desc' }
    });

    // Since you were gone (new entries since last login)
    let newEntriesSinceLastLogin: any[] = [];
    if (previousLoginAt) {
      newEntriesSinceLastLogin = await prisma.order.findMany({
        where: { createdAt: { gt: new Date(previousLoginAt) } },
        include: { status: true, creator: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit to avoid massive payloads
      });
    }

    return {
      kpi: {
        ordersToday,
        ordersThisWeek,
        ordersThisMonth,
        ordersLastMonth,
        activeUsersToday
      },
      ordersByStatus,
      ordersTrend,
      topPerformer,
      todayDeliveries,
      newEntriesSinceLastLogin
    };
  }

  static async getUserDashboardStats(userId: string, previousLoginAt?: string) {
    const today = startOfDay(new Date());
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const monthStart = startOfMonth(new Date());

    // KPI Cards (own orders)
    const ordersToday = await prisma.order.count({ where: { createdBy: userId, createdAt: { gte: today } } });
    const ordersThisWeek = await prisma.order.count({ where: { createdBy: userId, createdAt: { gte: weekStart } } });
    const ordersThisMonth = await prisma.order.count({ where: { createdBy: userId, createdAt: { gte: monthStart } } });

    // My recent orders
    const myRecentOrders = await prisma.order.findMany({
      where: { createdBy: userId },
      include: { status: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Today's deliveries (system-wide)
    const todayDeliveries = await prisma.order.findMany({
      where: { deliveryDate: today },
      include: { status: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Since you were gone (own orders scope) - typically we would show updates to own orders, but let's just do new entries to be simple
    let newEntriesSinceLastLogin: any[] = [];
    if (previousLoginAt) {
      newEntriesSinceLastLogin = await prisma.order.findMany({
        where: { createdBy: userId, createdAt: { gt: new Date(previousLoginAt) } },
        include: { status: true },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
    }

    return {
      kpi: {
        ordersToday,
        ordersThisWeek,
        ordersThisMonth
      },
      myRecentOrders,
      todayDeliveries,
      newEntriesSinceLastLogin
    };
  }
}
