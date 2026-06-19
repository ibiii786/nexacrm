import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays 
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface OrdersCalendarProps {
  orders: any[];
  statuses: any[];
}

export function OrdersCalendar({ orders, statuses }: OrdersCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

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
      const dayOrders = orders.filter(o => o.deliveryDate && isSameDay(new Date(o.deliveryDate), cloneDay));

      days.push(
        <div 
          key={day.toISOString()} 
          className={`min-h-[120px] p-2 border-r border-b border-slate-200 dark:border-slate-800 ${
            !isSameMonth(day, monthStart)
              ? "bg-slate-50 dark:bg-slate-900/50 text-slate-400"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          }`}
        >
          <div className="flex justify-end">
            <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full' : ''}`}>
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
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <ChevronLeftIcon size={20} />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium"
          >
            Today
          </button>
          <button 
            onClick={nextMonth}
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
    </div>
  );
}
