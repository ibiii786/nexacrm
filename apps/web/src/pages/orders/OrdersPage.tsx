import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';

import { PlusIcon, SearchIcon, KanbanIcon, ListIcon, DownloadIcon, CalendarIcon } from 'lucide-react';
import { OrdersTable } from './OrdersTable';
import { OrderPasteParser } from '../../components/orders/OrderPasteParser';
import { OrdersKanban } from '../../components/orders/OrdersKanban';
import { OrdersCalendar } from '../../components/orders/OrdersCalendar';
import { getZonedToday, getZonedStartOfDayISO, getZonedEndOfDayISO } from '../../utils/dateUtils';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list');
  const [filterMode, setFilterMode] = useState<'createdToday' | 'deliveryToday' | 'custom'>('createdToday');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isParserOpen, setIsParserOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(getZonedToday());

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsParserOpen(true);
      // Optional: remove it from URL so it doesn't reopen on refresh
      setSearchParams(prev => {
        prev.delete('create');
        return prev;
      });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate, viewMode]);

  useEffect(() => {
    fetchOrders();
  }, [search, startDate, endDate, filterMode, page, viewMode, calendarDate]);

  const fetchOrders = async () => {
    try {
      let currentStartDate: string | undefined;
      let currentEndDate: string | undefined;
      let dateFilterType: 'createdAt' | 'deliveryDate' = 'createdAt';
      let currentLimit = 50;
      let currentPage = page;

      const todayIso = getZonedToday().toISOString().split('T')[0];

      if (filterMode === 'createdToday') {
        currentStartDate = getZonedStartOfDayISO(todayIso);
        currentEndDate = getZonedEndOfDayISO(todayIso);
        dateFilterType = 'createdAt';
      } else if (filterMode === 'deliveryToday') {
        currentStartDate = getZonedStartOfDayISO(todayIso);
        currentEndDate = getZonedEndOfDayISO(todayIso);
        dateFilterType = 'deliveryDate';
      } else {
        currentStartDate = startDate ? getZonedStartOfDayISO(startDate) : undefined;
        currentEndDate = endDate ? getZonedEndOfDayISO(endDate) : undefined;
        dateFilterType = 'createdAt';
      }

      if (viewMode === 'calendar') {
        const monthStart = startOfMonth(calendarDate);
        const monthEnd = endOfMonth(calendarDate);
        currentStartDate = startOfWeek(monthStart).toISOString().split('T')[0];
        currentEndDate = endOfWeek(monthEnd).toISOString().split('T')[0];
        currentLimit = 1000;
        currentPage = 1;
      } else if (viewMode === 'board') {
        currentLimit = 1000;
        currentPage = 1;
      }

      const { data } = await api.get('/orders', { 
        params: { 
          search, 
          startDate: currentStartDate, 
          endDate: currentEndDate, 
          dateFilterType,
          page: currentPage, 
          limit: currentLimit 
        } 
      });
      setOrders(data.data);
      if (data.meta) {
        setTotalPages(data.meta.totalPages || 1);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleExport = () => {
    // Generate URL and trigger download
    const params = new URLSearchParams();
    const todayIso = getZonedToday().toISOString().split('T')[0];
    
    if (search) params.append('search', search);

    if (filterMode === 'createdToday' || filterMode === 'deliveryToday') {
      const isDelivery = filterMode === 'deliveryToday';
      const start = getZonedStartOfDayISO(todayIso);
      const end = getZonedEndOfDayISO(todayIso);
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      params.append('dateFilterType', isDelivery ? 'deliveryDate' : 'createdAt');
    } else {
      if (startDate) {
        const start = getZonedStartOfDayISO(startDate);
        if (start) params.append('startDate', start);
      }
      if (endDate) {
        const end = getZonedEndOfDayISO(endDate);
        if (end) params.append('endDate', end);
      }
      params.append('dateFilterType', 'createdAt');
    }
    
    // In a real app, you might want to use a token if needed, but since it's a direct download URL,
    // often cookies are used or a short-lived token. For now, we will just open the URL.
    // If auth is via Bearer token, we need to fetch it as a blob and download.
    
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

  const fetchMetadata = async () => {
    try {
      const [statusesRes, fieldsRes] = await Promise.all([
        api.get('/statuses'),
        api.get('/fields')
      ]);
      setStatuses(statusesRes.data.data);
      const visibleFields = fieldsRes.data.data.filter((f: any) => 
        f.isVisible && 
        !f.isArchived && 
        !['orderStatus', 'deliveryDate', 'notes', 'orderNumber', 'orderDate', 'createdBy'].includes(f.name)
      );
      setFields(visibleFields);
    } catch (error) {
      console.error(error);
    }
  };


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
              data-testid="orders-search-input"
              placeholder="Search order number..."
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 mr-2 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-md">
              <button
                onClick={() => {
                  setFilterMode('createdToday');
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${filterMode === 'createdToday' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                Created Today
              </button>
              <button
                onClick={() => {
                  setFilterMode('deliveryToday');
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${filterMode === 'deliveryToday' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                Delivery Today
              </button>
            </div>

            <div className="hidden sm:block w-px h-6 bg-slate-300 dark:bg-slate-700"></div>

            <div className="flex gap-2 items-center pr-2">
              <input 
                type="date"
                data-testid="orders-start-date"
                className={`px-3 py-1.5 bg-white dark:bg-slate-800 border ${filterMode === 'custom' ? 'border-primary dark:border-primary' : 'border-slate-200 dark:border-slate-700'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white transition-colors`}
                value={startDate}
                onChange={e => {
                  setFilterMode('custom');
                  setStartDate(e.target.value);
                }}
              />
              <span className="text-slate-400 text-sm font-medium">to</span>
              <input 
                type="date"
                data-testid="orders-end-date"
                className={`px-3 py-1.5 bg-white dark:bg-slate-800 border ${filterMode === 'custom' ? 'border-primary dark:border-primary' : 'border-slate-200 dark:border-slate-700'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white transition-colors`}
                value={endDate}
                onChange={e => {
                  setFilterMode('custom');
                  setEndDate(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
            <button 
              data-testid="orders-view-list"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="List View"
            >
              <ListIcon size={18} />
            </button>
            <button 
              data-testid="orders-view-kanban"
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Kanban View"
            >
              <KanbanIcon size={18} />
            </button>
            <button 
              data-testid="orders-view-calendar"
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Calendar View"
            >
              <CalendarIcon size={18} />
            </button>
          </div>

          <button 
            data-testid="orders-export-button"
            onClick={handleExport}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm font-medium"
          >
            <DownloadIcon size={16} />
            <span>Export</span>
          </button>

          <button 
            data-testid="orders-new-order-button"
            onClick={() => setIsParserOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm font-medium"
          >
            <PlusIcon size={16} />
            <span>New Order</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {viewMode === 'list' && (
          <>
            <div className="flex-1 min-h-0">
              {orders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No orders found</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-sm">
                    {filterMode === 'createdToday' || filterMode === 'deliveryToday' 
                      ? "No orders found for today." 
                      : "No orders match your current filters or search terms."}
                  </p>
                </div>
              ) : (
                <OrdersTable orders={orders} statuses={statuses} fields={fields} onOrderUpdated={fetchOrders} />
              )}
            </div>
            {(page > 1 || page < totalPages) && (
              <div className="p-4 flex justify-between items-center bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
        {viewMode === 'board' && (
          <OrdersKanban orders={orders} statuses={statuses} fields={fields} onOrderUpdated={fetchOrders} />
        )}
        {viewMode === 'calendar' && (
          <OrdersCalendar 
            orders={orders} 
            statuses={statuses} 
            fields={fields}
            currentDate={calendarDate}
            onNextMonth={() => setCalendarDate(addMonths(calendarDate, 1))}
            onPrevMonth={() => setCalendarDate(subMonths(calendarDate, 1))}
            onToday={() => setCalendarDate(getZonedToday())}
          />
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
