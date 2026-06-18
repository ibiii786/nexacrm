import { useState } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SinceYouWereGoneBannerProps {
  newOrdersCount: number;
  isAdmin: boolean;
}

export function SinceYouWereGoneBanner({ newOrdersCount, isAdmin }: SinceYouWereGoneBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || newOrdersCount === 0) return null;

  return (
    <div className="bg-indigo-600 dark:bg-indigo-500 rounded-lg p-4 mb-8 text-white shadow-md relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute left-0 bottom-0 w-32 h-32 bg-indigo-400 opacity-20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex gap-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm mt-1 h-fit">
            <Sparkles className="w-6 h-6 text-indigo-50" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Since You Were Gone</h3>
            <p className="text-indigo-100 mb-3 text-sm max-w-2xl">
              {isAdmin 
                ? `There have been ${newOrdersCount} new orders created across the system since your last login.`
                : `There have been ${newOrdersCount} updates to your orders since your last login.`}
            </p>
            <Link 
              to="/orders" 
              className="inline-flex items-center text-sm font-medium bg-white text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-50 transition-colors"
            >
              View Orders <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/20 rounded-md transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
