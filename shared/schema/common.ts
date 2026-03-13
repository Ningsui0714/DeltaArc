export type JsonRecord = Record<string, unknown>;

export class SchemaError extends Error {
  issues: string[];

  constructor(message: string | string[]) {
    const issues = Array.isArray(message) ? message : [message];
    super(issues[0] ?? 'Schema validation failed.');
    this.name = 'SchemaError';
    this.issues = issues;
  }
}

export function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function ensureString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

export function ensureStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const nextValues = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  return nextValues.length > 0 ? nextValues : fallback;
}

export function ensureRecord(value: unknown, fallback: JsonRecord = {}) {
  return isRecord(value) ? value : fallback;
}

export function ensureRecordArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is JsonRecord => isRecord(item)) : [];
}

export function clampPercent(value: unknown, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

export function requireRecord(value: unknown, name: string): JsonRecord {
  if (!isRecord(value)) {
    throw new SchemaError(`${name} 必须是对象。`);
  }

  return value;
}

export function requireArray(value: unknown, name: string) {
  if (!Array.isArray(value)) {
    throw new SchemaError(`${name} 必须是数组。`);
  }

  return value;
}

export function requireString(value: unknown, name: string) {
  const nextValue = ensureString(value);
  if (!nextValue) {
    throw new SchemaError(`${name} 必须是非空字符串。`);
  }

  return nextValue;
}

export function requireStringArray(value: unknown, name: string) {
  const items = requireArray(value, name);

  return items.map((item, index) => requireString(item, `${name}[${index}]`));
}

export function requireNumber(value: unknown, name: string) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new SchemaError(`${name} 必须是数字。`);
  }

  return value;
}

export function requirePercent(value: unknown, name: string) {
  const numericValue = requireNumber(value, name);
  if (numericValue < 0 || numericValue > 100) {
    throw new SchemaError(`${name} 必须在 0 到 100 之间。`);
  }

  return Math.round(numericValue);
}

export function requireOneOf<T extends string>(value: unknown, allowed: readonly T[], name: string) {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T;
  }

  throw new SchemaError(`${name} 必须是 ${allowed.join(' / ')}。`);
}
