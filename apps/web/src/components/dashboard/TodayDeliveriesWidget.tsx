import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';

interface TodayDeliveriesWidgetProps {
  deliveries: any[];
}

export function TodayDeliveriesWidget({ deliveries }: TodayDeliveriesWidgetProps) {
  return (
    <Card className="col-span-1 h-full flex flex-col">
      <CardHeader className="bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30">
        <CardTitle className="text-lg font-semibold flex items-center justify-between text-emerald-800 dark:text-emerald-500">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Today's Deliveries
          </div>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
            {deliveries?.length || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {!deliveries || deliveries.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No deliveries scheduled for today.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {deliveries.map((order) => (
              <div key={order.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center">
                <div>
                  <Link to={`/orders?search=${order.orderNumber}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    {order.orderNumber}
                  </Link>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">
                    {order.customFields?.['Customer Name'] || 'Unknown'}
                  </p>
                  {order.customFields?.['Delivery Address'] && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[200px]" title={order.customFields['Delivery Address']}>
                      {order.customFields['Delivery Address']}
                    </p>
                  )}
                </div>
                <div>
                  <Badge style={{ backgroundColor: order.status.color, color: '#fff' }}>
                    {order.status.name}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
