import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeftIcon, CalendarIcon, UserIcon, ClockIcon, Paperclip, DownloadIcon, TrashIcon } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { OrderModal } from '../../components/orders/OrderModal';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { formatZonedDate, formatZonedDateTime } from '../../utils/dateUtils';
import { formatCustomField } from '../../utils/formatters';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; attachmentId: string | null }>({ open: false, attachmentId: null });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/orders/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchOrder();
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('File upload failed', error);
      toast.error(error.response?.data?.error?.message || 'Failed to upload file');
    }
  };

  const confirmDeleteAttachment = (attachmentId: string) => {
    setDeleteDialog({ open: true, attachmentId });
  };

  const deleteAttachment = async () => {
    if (!deleteDialog.attachmentId) return;
    try {
      await api.delete(`/orders/${id}/attachments/${deleteDialog.attachmentId}`);
      setDeleteDialog({ open: false, attachmentId: null });
      fetchOrder();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}/copy-text`);
      // It returns plain text, so data might just be the string, depending on axios response
      const textToCopy = typeof data === 'string' ? data : data.data || data;
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Order details copied to clipboard');
    } catch (error) {
      console.error('Failed to copy order text', error);
      toast.error('Failed to copy order details');
    }
  };

  if (isLoading) return <div className="p-8">Loading order details...</div>;
  if (!order) return <div className="p-8">Order not found</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/orders" data-testid="order-detail-back-link" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeftIcon size={16} /> Back to Orders
      </Link>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            {order.orderNumber}
            <span 
              className="text-sm px-3 py-1 rounded-full font-medium"
              style={{ backgroundColor: `${order.status.color}20`, color: order.status.color }}
            >
              {order.status.name}
            </span>
          </h1>
          <div className="flex items-center gap-6 mt-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <UserIcon size={16} /> Created by {order.creator.name}
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarIcon size={16} /> 
              {order.deliveryDate ? `Due ${formatZonedDate(order.deliveryDate)}` : 'No due date'}
            </div>
            <div className="flex items-center gap-1.5">
              <ClockIcon size={16} /> Created {formatZonedDateTime(order.createdAt)}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleCopyOrder}
            data-testid="order-detail-copy-button" 
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-500/20 font-medium"
          >
            Copy Details
          </button>

          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || (user as any)?.effectivePermissions?.includes('orders:edit_own') || (user as any)?.effectivePermissions?.includes('orders:edit_any')) && (
            <button 
              onClick={() => setIsEditModalOpen(true)}
              data-testid="order-detail-edit-button" 
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
            >
              Edit Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Custom Fields section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Order Details</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
              {Object.entries(order.customFields || {}).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white font-medium">{formatCustomField(key, value)}</dd>
                </div>
              ))}
              {Object.keys(order.customFields || {}).length === 0 && (
                <p className="text-sm text-slate-500 col-span-2">No custom fields defined for this order.</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Notes</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {order.notes || 'No notes added.'}
            </p>
          </div>

          {/* Audit Logs */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Activity History</h3>
            <div className="space-y-4">
              {order.auditLogs.map((log: any) => (
                <div key={log.id} className="flex gap-4 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                    <UserIcon size={14} />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {log.user?.name || 'System'} <span className="text-slate-500 font-normal">{log.action.replace(/_/g, ' ')}</span>
                    </p>
                    {log.fieldName && (
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        Changed <span className="font-medium">{log.fieldName}</span> from "{log.oldValue}" to "{log.newValue}"
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{formatZonedDateTime(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Files */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Paperclip size={18} /> Files
              </h3>
              <label className="text-xs text-primary cursor-pointer hover:underline font-medium">
                Upload
                <input type="file" data-testid="order-detail-upload-input" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            
            <div className="space-y-3">
              {order.attachments?.map((file: any) => {
                const fileName = file.filePath.split(/[\\/]/).pop();
                const fileUrl = `${(import.meta as any).env.VITE_API_URL?.replace('/api', '') || (import.meta as any).env.PROD ? '' : 'http://localhost:3001'}/uploads/${fileName}`;
                // Check filename and filePath for image extensions
                const isImage = file.mimeType?.startsWith('image/') || 
                                file.filename?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || 
                                file.filePath?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
                
                return (
                  <div key={file.id} className="flex flex-col p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    {isImage && (
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="block mb-3 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <img src={fileUrl} alt={file.filename} className="w-full h-auto max-h-48 object-contain" />
                      </a>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={file.filename}>{file.filename}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{(file.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                      <div className="flex gap-2">
                        <a href={fileUrl} target="_blank" rel="noreferrer" data-testid="order-detail-download-attachment" className="p-1 text-slate-400 hover:text-primary transition-colors">
                          <DownloadIcon size={16} />
                        </a>
                        <button onClick={() => confirmDeleteAttachment(file.id)} data-testid="order-detail-delete-attachment" className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!order.attachments || order.attachments.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">No files attached.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        title="Delete Attachment"
        description="Are you sure you want to delete this attachment? This action cannot be undone."
        confirmText="Delete"
        onConfirm={deleteAttachment}
        isDestructive={true}
      />

      {isEditModalOpen && (
        <OrderModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onOrderCreated={fetchOrder} 
          order={order}
        />
      )}
    </div>
  );
}
