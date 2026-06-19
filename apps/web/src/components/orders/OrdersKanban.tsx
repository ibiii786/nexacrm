import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface OrdersKanbanProps {
  orders: any[];
  statuses: any[];
  onOrderUpdated: () => void;
}

export function OrdersKanban({ orders, statuses, onOrderUpdated }: OrdersKanbanProps) {
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  const boardColumns = statuses.map(status => ({
    ...status,
    orders: orders.filter(o => o.statusId === status.id)
  }));

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    if (!draggedOrderId) return;
    
    // Find if the status changed
    const order = orders.find(o => o.id === draggedOrderId);
    if (order && order.statusId !== statusId) {
      try {
        await api.put(`/orders/${draggedOrderId}`, {
          statusId
        });
        onOrderUpdated();
      } catch (error) {
        console.error('Failed to update order status', error);
      }
    }
    setDraggedOrderId(null);
  };

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar">
      {boardColumns.map(column => (
        <div 
          key={column.id} 
          className="w-80 shrink-0 flex flex-col bg-slate-50/50 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-800"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }}></span>
              {column.name}
            </h3>
            <span className="text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
              {column.orders.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar min-h-[100px]">
            {column.orders.map((order: any) => (
              <div 
                key={order.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, order.id)}
                className={`block bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${draggedOrderId === order.id ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Link to={`/orders/${order.id}`} className="font-bold text-slate-900 dark:text-white text-sm hover:underline">
                    {order.orderNumber}
                  </Link>
                  {order.deliveryDate && (
                    <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">
                      Due {new Date(order.deliveryDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">
                  {order.notes || 'No notes provided'}
                </div>
              </div>
            ))}
            {column.orders.length === 0 && (
              <div className="h-20 flex items-center justify-center text-sm text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                Drop here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
