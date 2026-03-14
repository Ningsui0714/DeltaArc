import type { Response } from 'express';
import { SchemaError } from '../../../shared/schema';

export function parseRouteToken(
  value: string | string[] | undefined | null,
  label: string,
) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (typeof rawValue !== 'string') {
    throw new SchemaError(`${label} 无效。`);
  }

  const trimmed = rawValue.trim();

  if (!trimmed || !/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    throw new SchemaError(`${label} 无效。`);
  }

  return trimmed;
}

export function getSchemaErrorMessage(error: unknown, fallback: string) {
  return error instanceof SchemaError ? error.message : fallback;
}

export function getServerErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function sendSchemaError(res: Response, error: unknown, fallback: string) {
  res.status(400).json({
    error: getSchemaErrorMessage(error, fallback),
  });
}
