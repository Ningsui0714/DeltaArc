import type { SandboxAnalysisMode, SandboxAnalysisRequest } from '../sandbox';
import { requireOneOf, requireRecord, requireString, SchemaError } from './common';
import { parseEvidenceList } from './evidence';
import { parseProjectSnapshot } from './project';

const analysisModes: SandboxAnalysisMode[] = ['balanced', 'reasoning'];

export function parseSandboxAnalysisRequest(input: unknown): SandboxAnalysisRequest {
  const source = requireRecord(input, 'sandbox request');
  const workspaceId = requireString(source.workspaceId, 'workspaceId');

  if (!/^[A-Za-z0-9_-]+$/.test(workspaceId)) {
    throw new SchemaError('workspaceId 只能包含字母、数字、下划线或中划线。');
  }

  return {
    workspaceId,
    mode: requireOneOf(source.mode, analysisModes, 'mode'),
    project: parseProjectSnapshot(source.project),
    evidenceItems: parseEvidenceList(source.evidenceItems),
  };
}
