import { formatISO, parseISO, format, subDays } from 'date-fns';

// CRITICAL: Always use UTC to avoid timezone issues
export function getTodayUTC(): string {
  return formatISO(new Date(), { representation: 'date' }); // YYYY-MM-DD
}

export function formatDateUTC(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatISO(dateObj, { representation: 'date' });
}

export function getLast7Days(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(formatDateUTC(subDays(new Date(), i)));
  }
  return dates;
}

export function getLast30Days(): string[] {
  const dates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    dates.push(formatDateUTC(subDays(new Date(), i)));
  }
  return dates;
}

export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dates.push(formatDateUTC(subDays(new Date(), i)));
  }
  return dates;
}

export function displayDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}
