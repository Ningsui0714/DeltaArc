import type { RequestHandler } from 'express';
import { parseVariableImpactScanRequest } from '../../../shared/schema';
import type { FrozenBaseline } from '../../../shared/variableSandbox';
import {
  buildPersistedVariableImpactScanJob,
  completeVariableImpactScanJob,
  createVariableImpactScanJob,
  failVariableImpactScanJob,
  getLatestOpenVariableImpactScanJob,
  getVariableImpactScanJob,
  hasVariableImpactScanJob,
  markVariableImpactScanJobRunning,
  updateVariableImpactScanStage,
} from '../../lib/impactScanJobStore';
import { projectTruthStore } from '../../lib/projectTruthStore';
import { runVariableImpactScan } from '../../lib/variableImpactScan';
import { getServerErrorMessage, parseRouteToken, sendSchemaError } from './routeUtils';

type ParsedVariableImpactScanRequest = ReturnType<typeof parseVariableImpactScanRequest>;

function startImpactScanJob(options: {
  workspaceId: string;
  baseline: FrozenBaseline;
  jobId: string;
  request: ParsedVariableImpactScanRequest;
}) {
  markVariableImpactScanJobRunning(options.jobId);

  void (async () => {
    try {
      updateVariableImpactScanStage({
        jobId: options.jobId,
        key: 'baseline_read',
        label: 'Read Baseline',
        detail: 'Frozen baseline loaded.',
        status: 'completed',
      });
      updateVariableImpactScanStage({
        jobId: options.jobId,
        key: 'impact_scan',
        label: 'Impact Scan',
        detail: 'Running remote variable reasoning and structuring direct effects.',
        status: 'running',
      });

      const result = await runVariableImpactScan({
        baseline: options.baseline,
        variable: options.request.variable,
        mode: options.request.mode,
      });

      if (!hasVariableImpactScanJob(options.jobId)) {
        return;
      }

      await projectTruthStore.persistVariable(options.workspaceId, options.request.variable);
      await projectTruthStore.persistImpactScan({
        workspaceId: options.workspaceId,
        scanId: options.jobId,
        baselineId: options.request.baselineId,
        mode: options.request.mode,
        variable: options.request.variable,
        result,
      });

      updateVariableImpactScanStage({
        jobId: options.jobId,
        key: 'impact_scan',
        label: 'Impact Scan',
        detail: 'Remote impact scan finished and the structured result is ready.',
        status: 'completed',
      });
      completeVariableImpactScanJob(options.jobId, result);
    } catch (error) {
      if (!hasVariableImpactScanJob(options.jobId)) {
        return;
      }

      failVariableImpactScanJob(
        options.jobId,
        error instanceof Error ? error.message : 'Impact scan failed.',
      );
    }
  })();
}

export const getLatestOpenImpactScan: RequestHandler = (req, res) => {
  let workspaceId: string;
  let baselineId: string;
  try {
    workspaceId = parseRouteToken(req.params.workspaceId, 'workspaceId');
    baselineId = parseRouteToken(String(req.query.baselineId ?? ''), 'baselineId');
  } catch (error) {
    sendSchemaError(res, error, 'Invalid workspace or baseline id.');
    return;
  }

  res.json({
    latestOpenJob: getLatestOpenVariableImpactScanJob(workspaceId, baselineId),
  });
};

export const listImpactScans: RequestHandler = async (req, res) => {
  let workspaceId: string;
  let baselineId: string | undefined;
  try {
    workspaceId = parseRouteToken(req.params.workspaceId, 'workspaceId');
    if (typeof req.query.baselineId === 'string') {
      baselineId = parseRouteToken(req.query.baselineId, 'baselineId');
    }
  } catch (error) {
    sendSchemaError(res, error, 'Invalid workspace or baseline id.');
    return;
  }

  try {
    const scans = await projectTruthStore.listImpactScanResults(workspaceId, {
      baselineId,
    });
    res.json({
      scans: scans.map((scan) => buildPersistedVariableImpactScanJob(scan)),
    });
  } catch (error) {
    res.status(500).json({
      error: getServerErrorMessage(error, 'Loading impact scans failed.'),
    });
  }
};

export const createImpactScan: RequestHandler = async (req, res) => {
  let workspaceId: string;
  let request: ParsedVariableImpactScanRequest;
  try {
    workspaceId = parseRouteToken(req.params.workspaceId, 'workspaceId');
    request = parseVariableImpactScanRequest(req.body);
  } catch (error) {
    sendSchemaError(res, error, 'Invalid impact scan request.');
    return;
  }

  try {
    const baseline = await projectTruthStore.loadBaseline(workspaceId, request.baselineId);

    if (!baseline) {
      res.status(404).json({ error: 'Baseline not found.' });
      return;
    }

    const job = createVariableImpactScanJob(workspaceId, request);
    res.status(202).json(job);

    startImpactScanJob({
      workspaceId,
      baseline,
      jobId: job.id,
      request,
    });
  } catch (error) {
    res.status(500).json({
      error: getServerErrorMessage(error, 'Loading baseline failed.'),
    });
  }
};

export const getImpactScanJob: RequestHandler = async (req, res) => {
  let workspaceId: string;
  let jobId: string;
  try {
    workspaceId = parseRouteToken(req.params.workspaceId, 'workspaceId');
    jobId = parseRouteToken(req.params.jobId, 'jobId');
  } catch (error) {
    sendSchemaError(res, error, 'Invalid workspace or job id.');
    return;
  }

  const job = getVariableImpactScanJob(jobId);

  if (job?.workspaceId === workspaceId) {
    res.json(job);
    return;
  }

  try {
    const persistedResult = await projectTruthStore.loadImpactScanResult(workspaceId, jobId);

    if (!persistedResult) {
      res.status(404).json({ error: 'Impact scan job not found.' });
      return;
    }

    res.json(buildPersistedVariableImpactScanJob(persistedResult));
  } catch (error) {
    res.status(500).json({
      error: getServerErrorMessage(error, 'Loading impact scan failed.'),
    });
  }
};
