import { useState, useEffect, useRef } from 'react';
import { Search, User, FileText, ShoppingBag, CheckCircle, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'order' | 'user' | 'status' | 'announcement' | 'fbAccount';
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedIndex >= 0 && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        const data = res.data.data;
        
        const combined: SearchResult[] = [
          ...data.orders.map((o: any) => ({ ...o, type: 'order' })),
          ...(data.fbAccounts || []).map((fb: any) => ({ ...fb, type: 'fbAccount' })),
          ...data.users.map((u: any) => ({ ...u, type: 'user' })),
          ...data.announcements.map((a: any) => ({ ...a, type: 'announcement' })),
          ...data.statuses.map((s: any) => ({ ...s, type: 'status' })),
        ];
        
        setResults(combined);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          onClose(); // Parent will handle opening
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    onClose();
    switch (result.type) {
      case 'order':
        navigate(`/orders/${result.id}`);
        break;
      case 'user':
        if (isAdmin) navigate(`/admin/users`); // Optionally, add ?highlight=id
        break;
      case 'status':
        if (isAdmin) navigate(`/settings?tab=statuses`);
        break;
      case 'fbAccount':
        navigate(`/fb-accounts/${result.id}`);
        break;
      case 'announcement':
        navigate(`/dashboard`); // Could open specific announcement
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag size={18} className="text-indigo-500" />;
      case 'user': return <User size={18} className="text-green-500" />;
      case 'status': return <CheckCircle size={18} className="text-amber-500" />;
      case 'fbAccount': return <FileText size={18} className="text-blue-500" />;
      case 'announcement': return <FileText size={18} className="text-purple-500" />;
      default: return <Search size={18} className="text-slate-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="text-slate-400 mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, users, announcements..."
            className="flex-1 bg-transparent py-4 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Searching...</div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, index) => (
                <button
                  ref={selectedIndex === index ? activeItemRef : null}
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    selectedIndex === index 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`p-2 rounded-md bg-white dark:bg-slate-800 border ${selectedIndex === index ? 'border-indigo-200 dark:border-indigo-800' : 'border-slate-200 dark:border-slate-700'} mr-4 flex-shrink-0`}>
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${selectedIndex === index ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                      {result.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {result.subtitle} • <span className="capitalize">{result.type}</span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-8 text-center text-slate-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Type at least 2 characters to search
            </div>
          )}
        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px]">↑</kbd><kbd className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px]">↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px]">↵</kbd> to select</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px]">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
