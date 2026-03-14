import type { RequestHandler } from 'express';
import { clearAnalysisJobsForWorkspace } from '../../lib/analysisJobStore';
import { clearVariableImpactScanJobsForWorkspace } from '../../lib/impactScanJobStore';
import {
  ProjectTruthStoreConflictError,
  projectTruthStore,
} from '../../lib/projectTruthStore';
import { getServerErrorMessage, parseRouteToken, sendSchemaError } from './routeUtils';

function parseWorkspaceId(
  rawWorkspaceId: string | string[] | undefined | null,
  res: Parameters<RequestHandler>[1],
) {
  try {
    return parseRouteToken(rawWorkspaceId, 'workspaceId');
  } catch (error) {
    sendSchemaError(res, error, 'Invalid workspace id.');
    return null;
  }
}

export const listBaselines: RequestHandler = async (req, res) => {
  const workspaceId = parseWorkspaceId(req.params.workspaceId, res);

  if (!workspaceId) {
    return;
  }

  try {
    const baselines = await projectTruthStore.listBaselines(workspaceId);
    res.json({ baselines });
  } catch (error) {
    res.status(500).json({
      error: getServerErrorMessage(error, 'Loading baselines failed.'),
    });
  }
};

export const getBaseline: RequestHandler = async (req, res) => {
  let workspaceId: string;
  let baselineId: string;
  try {
    workspaceId = parseRouteToken(req.params.workspaceId, 'workspaceId');
    baselineId = parseRouteToken(req.params.baselineId, 'baselineId');
  } catch (error) {
    sendSchemaError(res, error, 'Invalid workspace or baseline id.');
    return;
  }

  try {
    const baseline = await projectTruthStore.loadBaseline(workspaceId, baselineId);

    if (!baseline) {
      res.status(404).json({ error: 'Baseline not found.' });
      return;
    }

    res.json(baseline);
  } catch (error) {
    res.status(500).json({
      error: getServerErrorMessage(error, 'Loading baseline failed.'),
    });
  }
};

export const freezeLatestBaseline: RequestHandler = async (req, res) => {
  const workspaceId = parseWorkspaceId(req.params.workspaceId, res);

  if (!workspaceId) {
    return;
  }

  try {
    const baseline = await projectTruthStore.freezeLatestBaseline(workspaceId);
    res.status(201).json(baseline);
  } catch (error) {
    res
      .status(error instanceof ProjectTruthStoreConflictError ? 409 : 500)
      .json({
        error: getServerErrorMessage(error, 'Freezing the latest baseline failed.'),
      });
  }
};

export const clearWorkspace: RequestHandler = async (req, res) => {
  const workspaceId = parseWorkspaceId(req.params.workspaceId, res);

  if (!workspaceId) {
    return;
  }

  try {
    await projectTruthStore.clearWorkspace(workspaceId);
    clearAnalysisJobsForWorkspace(workspaceId);
    clearVariableImpactScanJobsForWorkspace(workspaceId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: getServerErrorMessage(error, 'Clearing the workspace failed.'),
    });
  }
};
