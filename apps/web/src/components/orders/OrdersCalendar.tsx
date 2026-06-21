import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  addDays 
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatZonedDate, isSameZonedDay, getZonedToday } from '../../utils/dateUtils';

interface OrdersCalendarProps {
  orders: any[];
  statuses: any[];
  currentDate: Date;
  onNextMonth: () => void;
  onPrevMonth: () => void;
  onToday: () => void;
}

export function OrdersCalendar({ orders, statuses, currentDate, onNextMonth, onPrevMonth, onToday }: OrdersCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const navigate = useNavigate();

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];

  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Find orders for this day
      const dayOrders = orders.filter(o => o.deliveryDate && isSameZonedDay(o.deliveryDate, cloneDay));

      days.push(
        <div 
          key={day.toISOString()} 
          onClick={() => {
            if (dayOrders.length > 0) setSelectedDay(cloneDay);
          }}
          title={dayOrders.length > 0 ? `${dayOrders.length} order${dayOrders.length === 1 ? '' : 's'}` : undefined}
          className={`min-h-[120px] p-2 border-r border-b border-slate-200 dark:border-slate-800 transition-colors ${
            !isSameMonth(day, monthStart)
              ? "bg-slate-50 dark:bg-slate-900/50 text-slate-400"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          } ${dayOrders.length > 0 ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" : ""}`}
        >
          <div className="flex justify-end">
            <span className={`text-sm font-medium ${isSameZonedDay(day, getZonedToday()) ? 'bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full' : ''}`}>
              {formattedDate}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {dayOrders.map(order => {
              const status = statuses.find(s => s.id === order.statusId);
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-1 text-xs rounded truncate text-white hover:opacity-90 transition-opacity block"
                  style={{ backgroundColor: status?.color || '#94a3b8' }}
                  title={`${order.orderNumber} - ${status?.name}`}
                >
                  {order.orderNumber}
                </Link>
              );
            })}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toISOString()}>
        {days}
      </div>
    );
    days = [];
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
          {formatZonedDate(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={onPrevMonth}
            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <ChevronLeftIcon size={20} />
          </button>
          <button 
            onClick={onToday}
            className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium"
          >
            Today
          </button>
          <button 
            onClick={onNextMonth}
            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <ChevronRightIcon size={20} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        {daysOfWeek.map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {rows}
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4" onClick={() => setSelectedDay(null)}>
          <div 
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Orders for {formatZonedDate(selectedDay)}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {orders.filter(o => o.deliveryDate && isSameZonedDay(o.deliveryDate, selectedDay)).map(order => {
                const status = statuses.find(s => s.id === order.statusId);
                const customFields = order.customFields || {};
                const customerName = customFields.customerName || 'Unknown Customer';
                const price = customFields.price ? Number(customFields.price).toFixed(2) : '0.00';
                
                return (
                  <button
                    key={order.id}
                    onClick={() => {
                      setSelectedDay(null);
                      navigate(`/orders/${order.id}`);
                    }}
                    className="w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {order.orderNumber}
                          </p>
                          <span 
                            className="px-2 py-0.5 text-xs rounded-full text-white"
                            style={{ backgroundColor: status?.color || '#94a3b8' }}
                          >
                            {status?.name || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          ${price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                        Customer: {customerName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
