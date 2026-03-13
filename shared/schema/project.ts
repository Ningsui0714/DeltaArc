import type { GameProjectMode, ProjectSnapshot } from '../domain';
import { ensureString, ensureStringArray, requireRecord, SchemaError } from './common';

const projectModes: GameProjectMode[] = ['Concept', 'Validation', 'Live'];

function normalizeProjectMode(value: unknown): GameProjectMode {
  const raw = ensureString(value);

  if (projectModes.includes(raw as GameProjectMode)) {
    return raw as GameProjectMode;
  }

  const lowered = raw.toLowerCase();

  if (lowered === 'validation' || lowered === 'prototype') {
    return 'Validation';
  }

  if (lowered === 'live' || lowered === 'launch' || lowered === 'operate') {
    return 'Live';
  }

  return 'Concept';
}

function normalizeStringList(value: unknown) {
  if (typeof value === 'string') {
    return value
      .split(/[，,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return ensureStringArray(value);
}

function buildProjectSnapshot(source: Record<string, unknown>): ProjectSnapshot {
  return {
    name: ensureString(source.name, '未命名项目'),
    mode: normalizeProjectMode(source.mode),
    genre: ensureString(source.genre),
    platforms: normalizeStringList(source.platforms),
    targetPlayers: normalizeStringList(source.targetPlayers ?? source.audience),
    coreFantasy: ensureString(source.coreFantasy ?? source.corePromise),
    ideaSummary: ensureString(source.ideaSummary),
    coreLoop: ensureString(source.coreLoop),
    sessionLength: ensureString(source.sessionLength ?? source.expectedSessionLength),
    differentiators: ensureString(source.differentiators ?? source.marketAngle),
    progressionHook: ensureString(source.progressionHook ?? source.progression),
    socialHook: ensureString(source.socialHook ?? source.socialLoop),
    monetization: ensureString(source.monetization ?? source.monetizationPlan),
    referenceGames: normalizeStringList(source.referenceGames ?? source.references),
    validationGoal: ensureString(source.validationGoal ?? source.validationFocus),
    productionConstraints: ensureString(source.productionConstraints ?? source.constraints),
    currentStatus: ensureString(source.currentStatus ?? source.mainConcern),
  };
}

export function normalizeProjectSnapshot(input: unknown): ProjectSnapshot | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  return buildProjectSnapshot(input as Record<string, unknown>);
}

export function parseProjectSnapshot(input: unknown): ProjectSnapshot {
  try {
    return buildProjectSnapshot(requireRecord(input, 'project'));
  } catch (error) {
    if (error instanceof SchemaError) {
      throw new SchemaError(`project 无法解析：${error.message}`);
    }

    throw error;
  }
}
