import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { XIcon, FileTextIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  order?: any; // If provided, modal is in edit mode
}

export function OrderModal({ isOpen, onClose, onOrderCreated, order }: OrderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!order;
  
  // Form State
  const [statusId, setStatusId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  
  // Metadata
  const [statuses, setStatuses] = useState<any[]>([]);
  const [statusFields, setStatusFields] = useState<any[]>([]); // Fields for selected status

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
      if (order) {
        setStatusId(order.statusId);
        setDeliveryDate(order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '');
        setNotes(order.notes || '');
        // For custom fields, map existing keys to field IDs if possible, or just pass them as is.
        // Actually, order.customFields uses field NAMES.
        // We'll populate it below once statusFields are loaded.
        setCustomFields(order.customFields || {});
      } else {
        resetForm();
      }
    }
  }, [isOpen, order]);

  useEffect(() => {
    // When status changes, figure out which fields are allowed
    if (statusId) {
      api.get(`/statuses/${statusId}/fields`)
        .then((res: any) => {
          setStatusFields(res.data.data);
          if (order && order.statusId === statusId) {
             // Map customFields names to IDs for the form
             const mapped: any = {};
             res.data.data.forEach((f: any) => {
               if (order.customFields && order.customFields[f.name] !== undefined) {
                 mapped[f.id] = order.customFields[f.name];
               }
             });
             setCustomFields(mapped);
          } else if (!order || order.statusId !== statusId) {
             setCustomFields({}); // clear custom fields if changing status
          }
        })
        .catch((err: any) => console.error('Failed to load status fields', err));
    } else {
      setStatusFields([]);
    }
  }, [statusId, order]);

  const fetchMetadata = async () => {
    try {
      const statusesRes = await api.get('/statuses');
      setStatuses(statusesRes.data.data);
      if (statusesRes.data.data.length > 0 && !order) {
        setStatusId(statusesRes.data.data[0].id); // Select first status by default if not editing
      }
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  const resetForm = () => {
    setCustomFields({});
    setDeliveryDate('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        statusId,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        notes,
        customFields
      };

      if (isEditMode) {
        await api.put(`/orders/${order.id}`, payload);
        toast.success('Order updated successfully');
      } else {
        await api.post('/orders', payload);
        toast.success('Order created successfully');
      }
      
      onOrderCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileTextIcon size={20} className="text-primary" />
            {isEditMode ? 'Edit Order' : 'Create New Order'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <XIcon size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="order-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status *</label>
              <select
                value={statusId}
                onChange={e => setStatusId(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                required
              >
                <option value="" disabled>Select a status</option>
                {statuses.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              />
            </div>

            {/* Dynamic Fields for the selected status */}
            {statusFields
              .filter(field => !['orderStatus', 'deliveryDate', 'notes'].includes(field.name))
              .map(field => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {field.label} {field.isRequired && '*'}
                </label>
                <input
                  type="text"
                  value={customFields[field.id] || ''}
                  onChange={e => setCustomFields({ ...customFields, [field.id]: e.target.value })}
                  required={field.isRequired}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] dark:text-white"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="order-form"
            disabled={isSubmitting || !statusId}
            className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2Icon size={16} className="animate-spin" /> : <CheckIcon size={16} />}
            {isEditMode ? 'Save Changes' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
