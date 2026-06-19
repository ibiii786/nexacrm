import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface OrdersTableProps {
  orders: any[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 53,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const [before, after] =
    virtualItems.length > 0
      ? [
          virtualItems[0].start,
          rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end,
        ]
      : [0, 0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col">
      <div ref={parentRef} className="overflow-auto flex-1">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-medium">Order #</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Delivery Date</th>
              <th className="px-6 py-4 font-medium">Created By</th>
              <th className="px-6 py-4 font-medium">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {before > 0 && (
              <tr>
                <td colSpan={5} style={{ height: `${before}px` }} />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const order = orders[virtualRow.index];
              return (
                <tr 
                  key={order.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium">
                    <Link to={`/orders/${order.id}`} className="text-primary hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${order.status?.color}20`, color: order.status?.color }}
                    >
                      {order.status?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{order.creator?.name}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {after > 0 && (
              <tr>
                <td colSpan={5} style={{ height: `${after}px` }} />
              </tr>
            )}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
