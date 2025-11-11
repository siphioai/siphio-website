/**
 * Convert technical error messages to user-friendly messages.
 * Maintains technical details in console for debugging.
 */
export function getUserFriendlyError(error: any): string {
  const message = error?.message || error?.toString() || '';
  const code = error?.code || '';

  // Supabase error codes
  if (code === 'PGRST116') {
    return 'No data found. Your account may be empty.';
  }

  // Authentication errors
  if (message.includes('auth') || message.includes('unauthorized')) {
    return 'Authentication error. Please sign out and back in.';
  }

  // Network errors
  if (message.includes('fetch') || message.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Not found errors
  if (message.includes('not found') || code === '404') {
    return 'Data not found. Please try refreshing the page.';
  }

  // Database errors
  if (message.includes('column') || message.includes('table')) {
    return 'Database error. Please contact support if this persists.';
  }

  // Permission errors
  if (message.includes('permission') || message.includes('denied')) {
    return 'You don\'t have permission to perform this action.';
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Request timed out. Please try again.';
  }

  // Generic fallback
  return 'An unexpected error occurred. Please try again.';
}
