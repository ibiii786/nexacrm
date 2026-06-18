import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Megaphone } from 'lucide-react';
import { format } from 'date-fns';

interface AnnouncementsWidgetProps {
  announcements: any[];
}

export function AnnouncementsWidget({ announcements }: AnnouncementsWidgetProps) {
  if (!announcements || announcements.length === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No active announcements.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 h-full flex flex-col">
      <CardHeader className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-500">
          <Megaphone className="w-5 h-5" />
          Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{announcement.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {format(new Date(announcement.createdAt), 'MMM d, yyyy')} • By {announcement.createdBy?.name || 'Admin'}
              </p>
              <div 
                className="text-sm text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
