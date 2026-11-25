import { format, addDays } from 'date-fns';

/**
 * Returns a date formatted as YYYY-MM-DD in local time.
 * Avoids the UTC toISOString() bug where 00:00 to 05:30 IST is treated as yesterday.
 */
export function getLocalDateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function getTodayString(): string {
  return getLocalDateString(new Date());
}

export function getTomorrowString(): string {
  return getLocalDateString(addDays(new Date(), 1));
}

export function getNextWeekString(): string {
  return getLocalDateString(addDays(new Date(), 7));
}
