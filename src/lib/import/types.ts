import type { EvidenceItem, ProjectSnapshot } from '../../types';

export type ImportedEvidenceMode = 'append' | 'replace' | 'none';

export type ImportedPayload = {
  evidenceMode: ImportedEvidenceMode;
  project?: ProjectSnapshot;
  evidenceItems?: EvidenceItem[];
  warnings: string[];
};
