import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { XIcon, FileTextIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import toast from 'react-hot-toast';
import { STANDARD_FIELDS } from '../../shared';
import { useAuthStore } from '../../stores/authStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { formatZonedDate, parseZonedDateInput } from '../../utils/dateUtils';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  order?: any; // If provided, modal is in edit mode
}

export function OrderModal({ isOpen, onClose, onOrderCreated, order }: OrderModalProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!order;
  
  // Form State
  const [statusId, setStatusId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [finalPaidAmount, setFinalPaidAmount] = useState('');
  
  // Confirmation Dialog State
  const [showPriceConfirm, setShowPriceConfirm] = useState(false);
  const [updatePriceChecked, setUpdatePriceChecked] = useState(true);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  
  // Metadata
  const [statuses, setStatuses] = useState<any[]>([]);
  const [statusFields, setStatusFields] = useState<any[]>([]); // Fields for selected status

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
      if (order) {
        setStatusId(order.statusId);
        if (order.deliveryDate) {
          setDeliveryDate(formatZonedDate(order.deliveryDate, 'yyyy-MM-dd'));
        } else {
          setDeliveryDate('');
        }
        setNotes(order.notes || '');
        if (order.finalPaidAmount) {
          setFinalPaidAmount(order.finalPaidAmount.toString());
        } else {
          setFinalPaidAmount('');
        }
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
          } else {
             // Retain existing form values when changing status, and populate any overlapping fields from the original order
             setCustomFields((prev: any) => {
               const next = { ...prev };
               if (order && order.customFields) {
                 res.data.data.forEach((f: any) => {
                   if (next[f.id] === undefined && order.customFields[f.name] !== undefined) {
                     next[f.id] = order.customFields[f.name];
                   }
                 });
               }
               return next;
             });
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
    setFinalPaidAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        statusId,
        deliveryDate: parseZonedDateInput(deliveryDate),
        notes: notes !== undefined ? notes : undefined,
        customFields: { ...(order?.customFields || {}), ...customFields },
        finalPaidAmount: finalPaidAmount ? parseFloat(finalPaidAmount) : undefined,
      };

      const priceField = statusFields.find(f => f.name === 'price');
      if (priceField && finalPaidAmount) {
        const oldFinalPaid = order?.finalPaidAmount?.toString();
        
        if (finalPaidAmount !== oldFinalPaid) {
          setPendingPayload(payload);
          setShowPriceConfirm(true);
          return;
        }
      }

      await executeSubmit(payload);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to prepare order submission');
      setIsSubmitting(false);
    }
  };

  const executeSubmit = async (payload: any) => {
    try {
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
      setShowPriceConfirm(false);
      setPendingPayload(null);
    }
  };

  const handleConfirmPriceUpdate = async () => {
    if (!pendingPayload) return;
    
    if (updatePriceChecked) {
      const priceField = statusFields.find(f => f.name === 'price');
      if (priceField && pendingPayload.finalPaidAmount) {
        pendingPayload.customFields[priceField.id] = pendingPayload.finalPaidAmount;
      }
    }
    
    await executeSubmit(pendingPayload);
  };

  const handleCancelPriceUpdate = () => {
    setShowPriceConfirm(false);
    setPendingPayload(null);
    setIsSubmitting(false);
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
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || (user as any)?.effectivePermissions?.includes('orders:manage_status')) && (
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
            )}

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
            {[...statusFields]
              .sort((a, b) => a.position - b.position)
              .filter(field => !['orderStatus', 'deliveryDate', 'notes', 'finalPaidAmount'].includes(field.name))
              .map(field => {
                const standardDef = STANDARD_FIELDS.find(sf => sf.name === field.name);
                const isSystem = standardDef?.isSystem;

                let displayValue = customFields[field.id] || '';
                if (isSystem) {
                  if (field.name === 'createdBy') {
                    displayValue = isEditMode ? order?.creator?.name : user?.name || '';
                  } else if (field.name === 'orderNumber') {
                    displayValue = isEditMode ? order?.orderNumber : 'Auto-generated';
                  } else if (field.name === 'orderDate') {
                    displayValue = isEditMode && order?.createdAt 
                      ? formatZonedDate(order.createdAt) 
                      : 'Auto-generated';
                  }
                }

                return (
                  <React.Fragment key={field.id}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {field.label} {field.isRequired && !isSystem && '*'}
                      </label>
                      <input
                        type="text"
                        value={displayValue}
                        onChange={e => {
                          if (!isSystem) {
                            setCustomFields({ ...customFields, [field.id]: e.target.value });
                          }
                        }}
                        required={field.isRequired && !isSystem}
                        disabled={isSystem}
                        className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white ${
                          isSystem 
                            ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      />
                    </div>
                    {field.name === 'price' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 text-red-600 dark:text-red-400">Final Paid Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={finalPaidAmount}
                          onChange={e => setFinalPaidAmount(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

            {!statusFields.some(f => f.name === 'price') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 text-red-600 dark:text-red-400">Final Paid Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={finalPaidAmount}
                  onChange={e => setFinalPaidAmount(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>
            )}

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

      <ConfirmDialog
        open={showPriceConfirm}
        onOpenChange={(open) => !open && handleCancelPriceUpdate()}
        title="Update Total Price?"
        description="You have entered a Final Paid Amount. Do you want to update the original Price to match this actual paid price?"
        confirmText="Yes, Save Order"
        cancelText="Cancel"
        onConfirm={handleConfirmPriceUpdate}
        onCancel={handleCancelPriceUpdate}
        isDestructive={false}
      >
        <div className="mt-4 flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <input
            type="checkbox"
            id="updatePrice"
            checked={updatePriceChecked}
            onChange={(e) => setUpdatePriceChecked(e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="updatePrice" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            Update original price to match final paid amount
          </label>
        </div>
      </ConfirmDialog>
    </div>
  );
}
