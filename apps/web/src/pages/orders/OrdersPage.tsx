import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { PlusIcon, SearchIcon, KanbanIcon, ListIcon, DownloadIcon, CalendarIcon } from 'lucide-react';
import { OrdersTable } from './OrdersTable';
import { OrderPasteParser } from '../../components/orders/OrderPasteParser';
import { OrdersKanban } from '../../components/orders/OrdersKanban';
import { OrdersCalendar } from '../../components/orders/OrdersCalendar';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [isParserOpen, setIsParserOpen] = useState(false);

  useEffect(() => {
    fetchStatuses();
    fetchOrders();
  }, [search]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders', { params: { search } });
      setOrders(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleExport = () => {
    // Generate URL and trigger download
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    // In a real app, you might want to use a token if needed, but since it's a direct download URL,
    // often cookies are used or a short-lived token. For now, we will just open the URL.
    // If auth is via Bearer token, we need to fetch it as a blob and download.
    const exportUrl = `${api.defaults.baseURL}/orders/export/excel?${params.toString()}`;
    
    api.get(`/orders/export/excel?${params.toString()}`, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'orders_export.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(error => {
        console.error('Export failed:', error);
      });
  };

  const fetchStatuses = async () => {
    try {
      const { data } = await api.get('/statuses');
      setStatuses(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Group orders by status for board view
  const boardColumns = statuses.map(status => ({
    ...status,
    orders: orders.filter(o => o.statusId === status.id)
  }));

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Orders</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage all production orders and pipelines.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search order number..."
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="List View"
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Kanban View"
            >
              <KanbanIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Calendar View"
            >
              <CalendarIcon size={18} />
            </button>
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm font-medium"
          >
            <DownloadIcon size={16} />
            <span>Export</span>
          </button>

          <button 
            onClick={() => setIsParserOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm font-medium"
          >
            <PlusIcon size={16} />
            <span>New Order</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {viewMode === 'list' && (
          <OrdersTable orders={orders} />
        )}
        {viewMode === 'board' && (
          <OrdersKanban orders={orders} statuses={statuses} onOrderUpdated={fetchOrders} />
        )}
        {viewMode === 'calendar' && (
          <OrdersCalendar orders={orders} statuses={statuses} />
        )}
      </div>

      <OrderPasteParser 
        isOpen={isParserOpen} 
        onClose={() => setIsParserOpen(false)} 
        onOrderCreated={() => {
          fetchOrders();
        }} 
      />
    </div>
  );
}
