export const logger = {
  error(context: Record<string, unknown>): void {
    // TODO: Call the logging service here

    // Log all errors on dev
    if (import.meta.env.DEV) {
      console.error(context.error);
    }
  },
};
