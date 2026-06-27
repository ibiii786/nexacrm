import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { getFieldValue } from '../../utils/formatters';

interface MyRecentOrdersWidgetProps {
  orders: any[];
}

export function MyRecentOrdersWidget({ orders }: MyRecentOrdersWidgetProps) {
  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          My Recent Orders
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            {orders?.length || 0} recent
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!orders || orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't created any orders yet.</p>
            <Link to="/orders" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
              Create Your First Order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-medium">Order #</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">Product</th>
                  <th className="px-6 py-3 font-medium hidden lg:table-cell">Delivery</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                      <Link to={`/orders?search=${order.orderNumber}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-indigo-200 underline-offset-2">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {getFieldValue(order, 'customerName') || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-slate-600 dark:text-slate-400">
                      {getFieldValue(order, 'productsOrdered') || '-'}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-slate-600 dark:text-slate-400">
                      {getFieldValue(order, 'deliveryDate') || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge style={{ backgroundColor: order.status.color, color: '#fff' }}>
                        {order.status.name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
