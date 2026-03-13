import type { SandboxAnalysisMode, SandboxAnalysisRequest } from '../sandbox';
import { requireOneOf, requireRecord } from './common';
import { parseEvidenceList } from './evidence';
import { parseProjectSnapshot } from './project';

const analysisModes: SandboxAnalysisMode[] = ['balanced', 'reasoning'];

export function parseSandboxAnalysisRequest(input: unknown): SandboxAnalysisRequest {
  const source = requireRecord(input, 'sandbox request');

  return {
    mode: requireOneOf(source.mode, analysisModes, 'mode'),
    project: parseProjectSnapshot(source.project),
    evidenceItems: parseEvidenceList(source.evidenceItems),
  };
}
