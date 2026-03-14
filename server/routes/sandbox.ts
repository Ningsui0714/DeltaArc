import { Router } from 'express';
import {
  getAnalyzeJob,
  getLatestAnalysisJobForWorkspace,
  getLatestPersistedAnalysis,
  getLatestRetryableAnalysisJobForWorkspace,
  postAnalyze,
  retryAnalyze,
} from './sandbox/analysisHandlers';
import {
  createImpactScan,
  getImpactScanJob,
  getLatestOpenImpactScan,
  listImpactScans,
} from './sandbox/impactScanHandlers';
import {
  clearWorkspace,
  freezeLatestBaseline,
  getBaseline,
  listBaselines,
} from './sandbox/workspaceHandlers';

const router = Router();

router.post('/analyze', postAnalyze);
router.post('/analyze/:jobId/retry', retryAnalyze);
router.get('/analyze/:jobId', getAnalyzeJob);

router.get('/workspaces/:workspaceId/latest-analysis', getLatestPersistedAnalysis);
router.get('/workspaces/:workspaceId/latest-active-job', getLatestAnalysisJobForWorkspace);
router.get(
  '/workspaces/:workspaceId/latest-retryable-job',
  getLatestRetryableAnalysisJobForWorkspace,
);

router.get('/workspaces/:workspaceId/baselines', listBaselines);
router.get('/workspaces/:workspaceId/baselines/:baselineId', getBaseline);
router.post('/workspaces/:workspaceId/baselines', freezeLatestBaseline);
router.delete('/workspaces/:workspaceId', clearWorkspace);

router.get('/workspaces/:workspaceId/impact-scans/latest-open', getLatestOpenImpactScan);
router.get('/workspaces/:workspaceId/impact-scans', listImpactScans);
router.post('/workspaces/:workspaceId/impact-scans', createImpactScan);
router.get('/workspaces/:workspaceId/impact-scans/:jobId', getImpactScanJob);

export { router as sandboxRouter };
