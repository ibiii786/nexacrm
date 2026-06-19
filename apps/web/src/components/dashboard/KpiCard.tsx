import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export function KpiCard({ title, value, description, icon: Icon, trend }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </CardTitle>
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
          <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div data-testid={`kpi-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            {trend && (
              <span className={trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
            )}
            {trend ? trend.label : description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
