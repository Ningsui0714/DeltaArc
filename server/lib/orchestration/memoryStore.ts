import type { ProjectSnapshot } from '../../../shared/domain';
import type { SandboxAnalysisResult } from '../../../shared/sandbox';

export type SandboxMemoryRecord = {
  id: string;
  projectKey: string;
  projectName: string;
  createdAt: string;
  verdict: string;
  primaryRisk: string;
  summary: string;
  blindSpots: string[];
  validationFocus: string[];
  contrarianMoves: string[];
};

export type MemoryStore = {
  loadRelevant(project: ProjectSnapshot): Promise<SandboxMemoryRecord[]>;
  persist(project: ProjectSnapshot, analysis: SandboxAnalysisResult): Promise<void>;
};
