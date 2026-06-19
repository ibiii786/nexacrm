import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  ShoppingCart, Calendar, TrendingUp, UserCheck 
} from 'lucide-react';
import { KpiCard } from '../components/dashboard/KpiCard';
import { SinceYouWereGoneBanner } from '../components/dashboard/SinceYouWereGoneBanner';
import { NewEntriesWidget } from '../components/dashboard/NewEntriesWidget';
import { OrdersByStatusChart } from '../components/dashboard/OrdersByStatusChart';
import { OrdersTrendChart } from '../components/dashboard/OrdersTrendChart';
import { AnnouncementsWidget } from '../components/dashboard/AnnouncementsWidget';
import { TodayDeliveriesWidget } from '../components/dashboard/TodayDeliveriesWidget';
import { MyRecentOrdersWidget } from '../components/dashboard/MyRecentOrdersWidget';
import { Skeleton } from '../components/ui/skeleton';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
        const endpoint = isAdmin ? '/dashboard/admin' : '/dashboard/user';
        const res = await api.get(endpoint);
        setData(res.data.data);
        
        if (!isAdmin) {
          // fetch announcements separately for users
          const annRes = await api.get('/announcements?activeOnly=true');
          setData((prev: any) => ({ ...prev, announcements: annRes.data.data }));
        }
      } catch (error) {
        console.error('Failed to load dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 pb-20">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full lg:col-span-2" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Welcome back, {user?.name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/orders"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              <Plus size={18} />
              Quick Add Order
            </Link>
          </div>
        </div>

        <SinceYouWereGoneBanner 
          newOrdersCount={data?.newEntriesSinceLastLogin?.length || 0} 
          isAdmin={isAdmin}
        />

        {isAdmin ? (
          <>
            {/* Admin Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KpiCard title="Orders Today" value={data?.kpi?.ordersToday || 0} icon={ShoppingCart} />
              <KpiCard title="Orders This Week" value={data?.kpi?.ordersThisWeek || 0} icon={TrendingUp} />
              <KpiCard title="Orders This Month" value={data?.kpi?.ordersThisMonth || 0} icon={Calendar} 
                trend={{ 
                  value: Math.round(((data?.kpi?.ordersThisMonth || 0) / (data?.kpi?.ordersLastMonth || 1)) * 100 - 100), 
                  label: 'vs last month', 
                  isPositive: ((data?.kpi?.ordersThisMonth || 0) >= (data?.kpi?.ordersLastMonth || 0)) 
                }} 
              />
              <KpiCard title="Active Users Today" value={data?.kpi?.activeUsersToday || 0} icon={UserCheck} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <NewEntriesWidget entries={data?.newEntriesSinceLastLogin || []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <OrdersByStatusChart data={data?.ordersByStatus || []} />
              <OrdersTrendChart data={data?.ordersTrend || []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TodayDeliveriesWidget deliveries={data?.todayDeliveries || []} />
              <div className="col-span-1 lg:col-span-2">
                {/* We put announcements here for now since RecentActivity isn't ready */}
                <AnnouncementsWidget announcements={data?.announcements || []} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* User Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <KpiCard title="My Orders Today" value={data?.kpi?.ordersToday || 0} icon={ShoppingCart} />
              <KpiCard title="My Orders This Week" value={data?.kpi?.ordersThisWeek || 0} icon={TrendingUp} />
              <KpiCard title="My Orders This Month" value={data?.kpi?.ordersThisMonth || 0} icon={Calendar} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <MyRecentOrdersWidget orders={data?.myRecentOrders || []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TodayDeliveriesWidget deliveries={data?.todayDeliveries || []} />
              <AnnouncementsWidget announcements={data?.announcements || []} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
