// Default statuses — seeded in Phase 1 Step 4
// From Section 9: Confirmed, Delivered, Rescheduled, Cancelled, Returned

export interface DefaultStatus {
  name: string;
  color: string;
  icon: string;
  position: number;
  isDefault: boolean;
}

export const DEFAULT_STATUSES: DefaultStatus[] = [
  {
    name: 'Undecided',
    color: '#64748B', // Neutral slate grey
    icon: 'help-circle',
    position: 0,
    isDefault: true, // New orders default to this if none specified
  },
  {
    name: 'Confirmed',
    color: '#10B981', // Success green
    icon: 'check-circle',
    position: 1,
    isDefault: false,
  },
  {
    name: 'Delivered',
    color: '#4F46E5', // Primary indigo
    icon: 'truck',
    position: 2,
    isDefault: false,
  },
  {
    name: 'Rescheduled',
    color: '#F59E0B', // Warning amber
    icon: 'calendar-clock',
    position: 3,
    isDefault: false,
  },
  {
    name: 'Cancelled',
    color: '#EF4444', // Danger red
    icon: 'x-circle',
    position: 4,
    isDefault: false,
  },
  {
    name: 'Returned',
    color: '#8B5CF6', // Purple
    icon: 'undo-2',
    position: 5,
    isDefault: false,
  },
];
