import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { PlusIcon, TrashIcon, Megaphone, Eye } from 'lucide-react';
import { formatZonedDateTime } from '../../utils/dateUtils';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AnnouncementReadModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

function AnnouncementReadModal({ isOpen, onClose, announcement }: AnnouncementReadModalProps) {
  if (!isOpen || !announcement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{announcement.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                announcement.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                announcement.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {announcement.priority}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Posted {formatZonedDateTime(announcement.createdAt, 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            &times;
          </button>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-base leading-relaxed">
            {announcement.content}
          </p>
        </div>
        <div className="mt-8 flex justify-end">
          <button onClick={onClose} className="rounded-md bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementModal({ isOpen, onClose, onSuccess }: AnnouncementModalProps) {
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'LOW', expiresAt: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/announcements', {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined
      });
      toast.success('Announcement created');
      setFormData({ title: '', content: '', priority: 'LOW', expiresAt: '' });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Create Announcement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input
              type="text" required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
            <textarea
              required rows={4}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expires At (Optional)</label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
            <p className="text-xs text-slate-500 mt-1">Leave empty for default 30 days expiry.</p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [readModal, setReadModal] = useState<{ open: boolean; announcement: Announcement | null }>({ open: false, announcement: null });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data.data);
    } catch (error) {
      toast.error('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const deleteAnnouncement = async () => {
    if (!deleteDialog.id) return;
    try {
      await api.delete(`/announcements/${deleteDialog.id}`);
      toast.success('Announcement deleted');
      setDeleteDialog({ open: false, id: null });
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  if (isLoading) return <div className="p-8">Loading announcements...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone size={24} className="text-primary" /> Announcements
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage system-wide announcements and alerts.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
          <PlusIcon size={16} />
          <span>Create Announcement</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Content</th>
              <th className="px-6 py-4 font-medium">Priority</th>
              <th className="px-6 py-4 font-medium">Status / Expiry</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {announcements.map((a) => {
              const isExpired = a.expiresAt ? new Date(a.expiresAt) < new Date() : false;
              return (
              <tr key={a.id} className={`transition-colors ${isExpired ? 'opacity-60 bg-slate-100 dark:bg-slate-800/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'}`}>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{a.title}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-xs">{a.content}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    a.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    a.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {a.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {isExpired && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Expired
                      </span>
                    )}
                    {!isExpired && a.expiresAt && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Expires: {formatZonedDateTime(a.expiresAt, 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => setReadModal({ open: true, announcement: a })}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                    title="View">
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => confirmDelete(a.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                    title="Delete">
                    <TrashIcon size={18} />
                  </button>
                </td>
              </tr>
              );
            })}
            {announcements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  No announcements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement?"
        onConfirm={deleteAnnouncement}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
      />

      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAnnouncements}
      />

      <AnnouncementReadModal
        isOpen={readModal.open}
        onClose={() => setReadModal({ open: false, announcement: null })}
        announcement={readModal.announcement}
      />
    </div>
  );
}
