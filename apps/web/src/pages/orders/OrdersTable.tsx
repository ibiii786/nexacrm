import { useAuthStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { TrashIcon } from 'lucide-react';
import { formatZonedDateTime } from '../../utils/dateUtils';
import { formatCustomField, getFieldValue } from '../../utils/formatters';

interface OrdersTableProps {
  orders: any[];
  statuses?: any[];
  fields?: any[];
  onOrderUpdated?: () => void;
}

export function OrdersTable({ orders, statuses = [], fields = [], onOrderUpdated }: OrdersTableProps) {
  const { user } = useAuthStore();
  const parentRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Task 4: Row Height Control
  const [rowHeight, setRowHeight] = useState<'compact' | 'default' | 'comfortable'>(() => {
    return (localStorage.getItem('orders_row_height') as any) || 'default';
  });

  const handleRowHeightChange = (val: 'compact' | 'default' | 'comfortable') => {
    setRowHeight(val);
    localStorage.setItem('orders_row_height', val);
  };

  const paddingClass = 
    rowHeight === 'compact' ? 'py-2 px-4' : 
    rowHeight === 'comfortable' ? 'py-6 px-6' : 
    'py-4 px-6';

  const cellHeight = 
    rowHeight === 'compact' ? 41 : 
    rowHeight === 'comfortable' ? 73 : 53;

  // Task 4: Column Resizing
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('orders_col_widths') || '{}');
    } catch { return {}; }
  });
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = (e: React.MouseEvent, colId: string, currentWidth: number) => {
    e.preventDefault();
    setResizingCol(colId);
    setStartX(e.clientX);
    setStartWidth(currentWidth);
  };

  useEffect(() => {
    if (!resizingCol) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      setColWidths(prev => {
        const next = { ...prev, [resizingCol]: Math.max(50, startWidth + diff) };
        localStorage.setItem('orders_col_widths', JSON.stringify(next));
        return next;
      });
    };

    const handleMouseUp = () => {
      setResizingCol(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, startX, startWidth]);

  const getColWidth = (id: string, defaultWidth: number) => colWidths[id] || defaultWidth;

  const renderHeader = (id: string, label: string, defaultWidth: number) => {
    const width = getColWidth(id, defaultWidth);
    return (
      <th 
        key={id} 
        className={`font-medium relative group ${paddingClass}`}
        style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
      >
        <div className="truncate pr-2">{label}</div>
        <div 
          onMouseDown={(e) => handleMouseDown(e, id, width)}
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-20 hover:bg-primary transition-colors ${resizingCol === id ? 'bg-primary' : 'bg-transparent group-hover:bg-slate-300 dark:group-hover:bg-slate-600'}`}
        />
      </th>
    );
  };

  const rowVirtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => cellHeight,
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

  const handleStatusChange = async (orderId: string, statusId: string) => {
    setIsProcessing(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { statusId });
      toast.success('Status updated');
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || (user as any)?.effectivePermissions?.includes('orders:edit_own') || (user as any)?.effectivePermissions?.includes('orders:edit_any');
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || (user as any)?.effectivePermissions?.includes('orders:delete_own') || (user as any)?.effectivePermissions?.includes('orders:delete_any');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col">
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800 p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            {selectedIds.size} order(s) selected
          </span>
          <div className="flex gap-2 items-center">

            {canDelete && (
              <button
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors"
              >
                <TrashIcon size={14} /> Delete Selected
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Task 4: Row Height Control Segmented Button */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Layout Options
        </div>
        <div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg">
          <button 
            onClick={() => handleRowHeightChange('compact')} 
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${rowHeight === 'compact' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Compact
          </button>
          <button 
            onClick={() => handleRowHeightChange('default')} 
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${rowHeight === 'default' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Default
          </button>
          <button 
            onClick={() => handleRowHeightChange('comfortable')} 
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${rowHeight === 'comfortable' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Comfortable
          </button>
        </div>
      </div>
      <div ref={parentRef} className="overflow-auto flex-1">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 sticky top-0 z-10 shadow-sm select-none">
            <tr>
              <th className={`font-medium w-10 ${paddingClass}`}>
                <input 
                  type="checkbox" 
                  checked={orders.length > 0 && selectedIds.size === orders.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
              </th>
              {renderHeader('orderNumber', 'Order #', 120)}
              {fields.map(f => renderHeader(`field_${f.id}`, f.label, 150))}
              {renderHeader('status', 'Status', 120)}
              {renderHeader('createdBy', 'Created By', 150)}
              {renderHeader('createdAt', 'Created At', 150)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {before > 0 && (
              <tr>
                <td colSpan={fields.length + 5} style={{ height: `${before}px` }} />
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
                  <td className={`${paddingClass}`} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(order.id)}
                      onChange={(e) => handleSelectOne(order.id, e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className={`${paddingClass} font-medium truncate`} style={{ maxWidth: getColWidth('orderNumber', 120) }}>
                    <Link to={`/orders/${order.id}`} data-testid={`order-link-${order.orderNumber}`} className="text-primary hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  {fields.map(f => {
                    const val = getFieldValue(order, f.name);
                    const cellW = getColWidth(`field_${f.id}`, 150);
                    return (
                      <td key={f.id} className={`${paddingClass} text-slate-600 dark:text-slate-400`} style={{ maxWidth: cellW }}>
                        <div className="truncate" title={String(val || '')}>
                          {formatCustomField(f.name, val)}
                        </div>
                      </td>
                    );
                  })}
                  <td className={`${paddingClass} truncate`} style={{ maxWidth: getColWidth('status', 120) }}>
                    {canEdit ? (
                      <select
                        value={order.statusId}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={isProcessing}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                        style={{ backgroundColor: `${order.status?.color}20`, color: order.status?.color, maxWidth: '100%' }}
                      >
                        {statuses.map(s => (
                          <option key={s.id} value={s.id} style={{ color: 'initial' }}>{s.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${order.status?.color}20`, color: order.status?.color }}
                      >
                        {order.status?.name}
                      </span>
                    )}
                  </td>
                  <td className={`${paddingClass} text-slate-600 dark:text-slate-400 truncate`} style={{ maxWidth: getColWidth('createdBy', 150) }}>{order.creator?.name}</td>
                  <td className={`${paddingClass} text-slate-500 dark:text-slate-400 truncate`} style={{ maxWidth: getColWidth('createdAt', 150) }}>
                    {formatZonedDateTime(order.createdAt, 'MMM d, yyyy h:mm a')}
                  </td>
                </tr>
              );
            })}
            {after > 0 && (
              <tr>
                <td colSpan={fields.length + 5} style={{ height: `${after}px` }} />
              </tr>
            )}
            {orders.length === 0 && (
              <tr>
                <td colSpan={fields.length + 5} className="px-6 py-12 text-center text-slate-500">
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
