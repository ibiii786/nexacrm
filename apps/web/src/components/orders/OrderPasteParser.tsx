import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { XIcon, FileTextIcon, CheckIcon, AlertCircleIcon, Loader2Icon } from 'lucide-react';

interface OrderPasteParserProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export function OrderPasteParser({ isOpen, onClose, onOrderCreated }: OrderPasteParserProps) {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [statusId, setStatusId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  
  // Parsed Data State
  const [unknownFields, setUnknownFields] = useState<Array<{candidateName: string, candidateValue: string}>>([]);
  const [selectedUnknowns, setSelectedUnknowns] = useState<Set<string>>(new Set());

  // Metadata
  const [statuses, setStatuses] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [statusFields, setStatusFields] = useState<any[]>([]); // Fields for selected status
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    // When status changes, figure out which fields are allowed
    if (statusId) {
      api.get(`/statuses/${statusId}/fields`)
        .then(res => setStatusFields(res.data.data))
        .catch(err => console.error('Failed to load status fields', err));
    } else {
      setStatusFields([]);
    }
  }, [statusId]);

  const fetchMetadata = async () => {
    try {
      const [statusesRes, fieldsRes] = await Promise.all([
        api.get('/statuses'),
        api.get('/fields')
      ]);
      setStatuses(statusesRes.data.data);
      setFields(fieldsRes.data.data);
      if (statusesRes.data.data.length > 0) {
        setStatusId(statusesRes.data.data[0].id); // Select first status by default
      }
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  const resetForm = () => {
    setRawText('');
    setCustomFields({});
    setDeliveryDate('');
    setNotes('');
    setUnknownFields([]);
    setSelectedUnknowns(new Set());
    setError('');
  };

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    setError('');
    
    try {
      const { data } = await api.post('/orders/parse-paste', { rawText });
      const parsed = data.data;
      
      setCustomFields(parsed.mappedFields);
      setNotes(parsed.notes);
      setUnknownFields(parsed.unknownFields);
      setSelectedUnknowns(new Set(parsed.unknownFields.map((u: any) => u.candidateName)));
      
      // If any of the mapped fields was a delivery date, set it
      // In the backend, parsePaste maps to field IDs. We don't automatically know which is the real deliveryDate unless it maps to a reserved field.
      // The backend pasteParser actually maps 'Delivery Date' to a custom field ID if it exists. But order has a native deliveryDate column!
      // We will let the user fill native deliveryDate manually, or if they mapped it to a custom field, it goes there.
      
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to parse text');
    } finally {
      setIsParsing(false);
    }
  };

  const toggleUnknown = (candidateName: string) => {
    const next = new Set(selectedUnknowns);
    if (next.has(candidateName)) {
      next.delete(candidateName);
    } else {
      next.add(candidateName);
    }
    setSelectedUnknowns(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const finalCustomFields = { ...customFields };

      // 1. Create selected unknown fields
      for (const unknown of unknownFields) {
        if (selectedUnknowns.has(unknown.candidateName)) {
          // Create new field
          const res = await api.post('/fields', {
            name: unknown.candidateName.replace(/\s+/g, '').toLowerCase(),
            label: unknown.candidateName,
            type: 'TEXT',
            isRequired: false,
            isVisible: true,
            isGlobal: true, // Make it global so it works for all statuses
            position: fields.length + 1
          });
          
          const newFieldId = res.data.data.id;
          finalCustomFields[newFieldId] = unknown.candidateValue;
        }
      }

      // 2. Create Order
      await api.post('/orders', {
        statusId,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        notes,
        customFields: finalCustomFields
      });

      onOrderCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileTextIcon size={20} className="text-primary" />
            Smart Paste Order Creation
          </h2>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <XIcon size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col md:flex-row gap-6">
          {/* Left Column: Paste Area */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Paste Raw Text (WhatsApp / FB)
              </label>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Name: John Smith\nPhone: 416-555-0123\nProduct: Mattress"
                className="w-full h-64 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleParse}
              disabled={isParsing || !rawText.trim()}
              className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-md hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isParsing ? <Loader2Icon size={16} className="animate-spin" /> : 'Parse Text'}
            </button>
            
            {unknownFields.length > 0 && (
              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-500 mb-3 flex items-center gap-2">
                  <AlertCircleIcon size={16} />
                  Unrecognized Fields Found
                </h4>
                <div className="space-y-2">
                  {unknownFields.map((uf, i) => (
                    <label key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUnknowns.has(uf.candidateName)}
                        onChange={() => toggleUnknown(uf.candidateName)}
                        className="mt-1 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                      <span>
                        We found <strong>'{uf.candidateName}'</strong> (<em>{uf.candidateValue}</em>) — add as new field?
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Pre-filled Form */}
          <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-6 md:pt-0 md:pl-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Order Details</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md border border-red-200 dark:border-red-800/50">
                {error}
              </div>
            )}

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
              {statusFields.map(field => (
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
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
}
