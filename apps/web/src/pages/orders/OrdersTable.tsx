import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { TrashIcon } from 'lucide-react';

interface OrdersTableProps {
  orders: any[];
  statuses?: any[];
  onOrderUpdated?: () => void;
}

export function OrdersTable({ orders, statuses = [], onOrderUpdated }: OrdersTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(orders.map(o => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} orders?`)) return;
    setIsProcessing(true);
    try {
      const res = await api.delete('/orders/bulk/delete', { data: { ids: Array.from(selectedIds) } });
      const data = res.data.data;
      if (data.successful.length > 0) {
        toast.success(`Deleted ${data.successful.length} orders`);
      }
      if (data.failed.length > 0) {
        toast.error(`${data.failed.length} orders could not be deleted (Admin only past edit window)`);
      }
      setSelectedIds(new Set());
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Some orders could not be deleted');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkStatusChange = async (statusId: string) => {
    setIsProcessing(true);
    try {
      const res = await api.put('/orders/bulk/status', { ids: Array.from(selectedIds), statusId });
      const data = res.data.data;
      if (data.successful.length > 0) {
        toast.success(`Updated ${data.successful.length} orders`);
      }
      if (data.failed.length > 0) {
        toast.error(`Failed to update ${data.failed.length} orders due to required fields or edit window limit`);
      }
      setSelectedIds(new Set());
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update orders');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col">
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800 p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            {selectedIds.size} order(s) selected
          </span>
          <div className="flex gap-2 items-center">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value);
                  e.target.value = '';
                }
              }}
              disabled={isProcessing}
              className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
            >
              <option value="">Move to status...</option>
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors"
            >
              <TrashIcon size={14} /> Delete Selected
            </button>
          </div>
        </div>
      )}
      <div ref={parentRef} className="overflow-auto flex-1">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-medium w-10">
                <input 
                  type="checkbox" 
                  checked={orders.length > 0 && selectedIds.size === orders.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
              </th>
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
                <td colSpan={6} style={{ height: `${before}px` }} />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const order = orders[virtualRow.index];
              return (
                <tr 
                  key={order.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className={`transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/20 ${selectedIds.has(order.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(order.id)}
                      onChange={(e) => handleSelectOne(order.id, e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <Link to={`/orders/${order.id}`} data-testid={`order-link-${order.orderNumber}`} className="text-primary hover:underline">
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
                <td colSpan={6} style={{ height: `${after}px` }} />
              </tr>
            )}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
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
