export function trimCopy(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : fallback;
}
