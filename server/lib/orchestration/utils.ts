export function isAbortError(error: unknown) {
  return error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));
}

export function dedupeBy<T>(items: T[], keyOf: (item: T) => string, maxItems = items.length) {
  const seen = new Set<string>();
  const nextItems: T[] = [];

  for (const item of items) {
    const key = keyOf(item).trim();
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    nextItems.push(item);

    if (nextItems.length >= maxItems) {
      break;
    }
  }

  return nextItems;
}
