import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { isSameDay as dateFnsIsSameDay, format as dateFnsFormat } from 'date-fns';
/**
 * Gets the globally configured timezone from settings, defaulting to local timezone
 */
export const getGlobalTimezone = (): string => {
  // Hardcoded to Canadian Eastern Time (Toronto) as requested
  return 'America/Toronto';
};

export const formatZonedDate = (date: Date | string | number, formatStr: string = 'MMM d, yyyy'): string => {
  if (!date) return '';
  const tz = getGlobalTimezone();
  return formatInTimeZone(new Date(date), tz, formatStr);
};

/**
 * Formats a strict calendar date from the database (e.g. deliveryDate) ignoring any timezone shifts.
 * This prevents a UTC midnight timestamp (2026-06-27T00:00:00Z) from shifting to the previous day in America/Toronto.
 */
export const formatPureDate = (date: Date | string | number | null | undefined, formatStr: string = 'MMM d, yyyy'): string => {
  if (!date) return '-';
  // Ensure we extract just the YYYY-MM-DD part from the UTC ISO string
  const iso = typeof date === 'string' && date.includes('T') ? date : new Date(date).toISOString();
  const [y, m, d] = iso.split('T')[0].split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  // dateObj is now instantiated at local midnight of that date, so format() won't shift it
  return dateFnsFormat(dateObj, formatStr);
};

/**
 * Formats a date with time strictly according to the global CRM timezone.
 */
export const formatZonedDateTime = (date: Date | string | number, formatStr: string = 'MMM d, yyyy h:mm a'): string => {
  if (!date) return '';
  const tz = getGlobalTimezone();
  return formatInTimeZone(new Date(date), tz, formatStr);
};

/**
 * Returns true if two dates fall on the same day within the global timezone.
 */
export const isSameZonedDay = (dateLeft: Date | string | number, dateRight: Date | string | number): boolean => {
  const tz = getGlobalTimezone();
  const d1 = toZonedTime(new Date(dateLeft), tz);
  const d2 = toZonedTime(new Date(dateRight), tz);
  return dateFnsIsSameDay(d1, d2);
};

/**
 * Returns a new Date object representing the current moment, but shifted into the global timezone.
 * Useful for grid generators.
 */
export const getZonedToday = (): Date => {
  const tz = getGlobalTimezone();
  return toZonedTime(new Date(), tz);
};

/**
 * Converts a UTC/Local Date into a zoned Date for grid calculations.
 */
export const getZonedTime = (date: Date | string | number): Date => {
  const tz = getGlobalTimezone();
  return toZonedTime(new Date(date), tz);
};

/**
 * Parses a date input string (YYYY-MM-DD) into an ISO string representing Noon in the global timezone.
 */
export const parseZonedDateInput = (dateStr: string): string | undefined => {
  if (!dateStr) return undefined;
  const tz = getGlobalTimezone();
  const localDate = new Date(`${dateStr}T12:00:00`);
  return fromZonedTime(localDate, tz).toISOString();
};

/**
 * Returns the UTC ISO string for the very beginning of the given date string in the global timezone.
 */
export const getZonedStartOfDayISO = (dateStr: string): string | undefined => {
  if (!dateStr) return undefined;
  const tz = getGlobalTimezone();
  return fromZonedTime(new Date(`${dateStr}T00:00:00`), tz).toISOString();
};

/**
 * Returns the UTC ISO string for the very end of the given date string in the global timezone.
 */
export const getZonedEndOfDayISO = (dateStr: string): string | undefined => {
  if (!dateStr) return undefined;
  const tz = getGlobalTimezone();
  return fromZonedTime(new Date(`${dateStr}T23:59:59.999`), tz).toISOString();
};

