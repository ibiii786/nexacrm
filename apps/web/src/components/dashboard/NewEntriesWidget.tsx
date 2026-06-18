import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface NewEntriesWidgetProps {
  entries: any[];
}

export function NewEntriesWidget({ entries }: NewEntriesWidgetProps) {
  if (!entries || entries.length === 0) return null;

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          New Entries Since Last Login
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            {entries.length} recent
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium">Order #</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">Created By</th>
                <th className="px-6 py-3 font-medium text-right">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {entries.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                    <Link to={`/orders?search=${order.orderNumber}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-indigo-200 underline-offset-2">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {order.customFields?.['Customer Name'] || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge style={{ backgroundColor: order.status.color, color: '#fff' }}>
                      {order.status.name}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-slate-500 dark:text-slate-400">
                    {order.creator?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {entries.length > 5 && (
            <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <Link to="/orders" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                View all {entries.length} recent orders
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
