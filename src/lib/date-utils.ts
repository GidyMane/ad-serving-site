/**
 * Utility functions for consistent date formatting across the application
 */

/**
 * Format date for chart X-axis labels (short format)
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string (e.g., "Aug 15" or "8/15")
 */
export function formatChartDate(date: string | Date | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(d);
}

/**
 * Format date for chart tooltips (longer format)
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string (e.g., "August 15, 2023")
 */
export function formatTooltipDate(date: string | Date | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
}

/**
 * Format date for table displays (short format)
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string (e.g., "8/15/2023")
 */
export function formatTableDate(date: string | Date | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).format(d);
}

/**
 * Format time for table displays
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTableTime(date: string | Date | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

/**
 * Format date and time for detailed displays
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date and time string (e.g., "Aug 15, 2023 at 2:30 PM")
 */
export function formatDateTime(date: string | Date | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

/**
 * Format relative time (e.g., "2 days ago", "3 hours ago")
 * @param date - Date string, Date object, or timestamp
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | number): string {
  const d = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  } else if (diffInDays < 7) {
    return diffInDays === 1 ? 'Yesterday' : `${diffInDays} days ago`;
  } else {
    return formatTableDate(d);
  }
}
