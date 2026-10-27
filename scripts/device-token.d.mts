export function withSavedToken<T>(
  output: string,
  record: unknown,
  activate: () => T | Promise<T>,
): Promise<T>;
