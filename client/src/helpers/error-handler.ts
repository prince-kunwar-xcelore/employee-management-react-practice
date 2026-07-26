import { FetchError } from 'ofetch';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export class AssertionError extends Error {
  public data: unknown = undefined;

  constructor(message: string, data?: unknown) {
    super(message);
    this.name = 'AssertionError';
    this.data = data;
  }
}

// Nuxt re-bundles h3, so `instanceof H3Error` against the h3 package
// import can fail (different constructor identity). Match by name instead.
function isH3Error(error: unknown): error is Error & { cause?: unknown } {
  return error instanceof Error && error.constructor?.name === 'H3Error';
}

const parseFetchErrorMessage = (error: FetchError) => {
  if (!error.statusCode) {
    // No status code = no response received (offline / DNS failure / request aborted)
    return 'No internet connection. Please check your network.';
  } else if (error.statusCode >= 500) {
    // Server error — thrown by fetcher onResponse hook
    return 'Server error. Please try again later.';
  } else if (error.statusCode === 401) {
    return 'Unauthorized. Please sign in again.';
  } else {
    // Other fetch failure (e.g. parse error)
    return 'Request failed. Please try again.';
  }
};

export function parseError(error: unknown) {
  // Errors thrown inside useAsyncData/useFetch callbacks are wrapped
  // by Nuxt's createError — unwrap to recover the original cause.
  if (isH3Error(error) && error.cause !== undefined) {
    return parseError(error.cause);
  }

  if (error instanceof FetchError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      error: error,
      displayMessage: parseFetchErrorMessage(error),
    };
  }

  if (error instanceof AssertionError) {
    return { message: error.message, error: error, data: error.data };
  }

  if (error instanceof Error) {
    return { message: error.message, error: error };
  }

  return { message: 'Unknown error', error: error };
}

export function handleError(error: unknown) {
  const errorInfo = parseError(error);
  if (!errorInfo) return;

  if (errorInfo.statusCode === 401) {
    toast.error('Unauthorized. Please sign in again.');
    return;
  }

  toast.error(errorInfo.displayMessage ?? 'Something went wrong');
  logger.error(errorInfo);
}
