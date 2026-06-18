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
    name: 'Confirmed',
    color: '#10B981', // Success green
    icon: 'check-circle',
    position: 0,
    isDefault: true, // New orders default to this
  },
  {
    name: 'Delivered',
    color: '#4F46E5', // Primary indigo
    icon: 'truck',
    position: 1,
    isDefault: false,
  },
  {
    name: 'Rescheduled',
    color: '#F59E0B', // Warning amber
    icon: 'calendar-clock',
    position: 2,
    isDefault: false,
  },
  {
    name: 'Cancelled',
    color: '#EF4444', // Danger red
    icon: 'x-circle',
    position: 3,
    isDefault: false,
  },
  {
    name: 'Returned',
    color: '#8B5CF6', // Purple
    icon: 'undo-2',
    position: 4,
    isDefault: false,
  },
];
