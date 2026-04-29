import { Router, type RequestHandler } from 'express';
import {
  parsePreflightSimulationRequest,
  PreflightSchemaError,
} from '../../shared/preflightSimulation';
import {
  completePreflightJob,
  createPreflightJob,
  failPreflightJob,
  getPreflightJob,
  markPreflightJobRunning,
  updatePreflightJobStage,
} from '../lib/preflight/preflightJobStore';
import { runPreflightSimulation } from '../lib/preflight/runPreflightSimulation';
import { getServerErrorMessage, parseRouteToken, sendSchemaError } from './sandbox/routeUtils';

const router = Router();

const postPreflightSimulation: RequestHandler = (req, res) => {
  let request;

  try {
    request = parsePreflightSimulationRequest(req.body);
  } catch (error) {
    sendSchemaError(
      res,
      error,
      error instanceof PreflightSchemaError ? error.message : '无效的发布前模拟请求。',
    );
    return;
  }

  const job = createPreflightJob(request);
  res.status(202).json(job);
  markPreflightJobRunning(job.id);

  void runPreflightSimulation(request, {
    onProgress: (update) => {
      updatePreflightJobStage({
        jobId: job.id,
        ...update,
      });
    },
  })
    .then((result) => {
      completePreflightJob(job.id, result);
    })
    .catch((error) => {
      failPreflightJob(job.id, getServerErrorMessage(error, '发布前模拟失败。'));
    });
};

const getPreflightSimulationJob: RequestHandler = (req, res) => {
  let jobId: string;
  try {
    jobId = parseRouteToken(req.params.jobId, 'jobId');
  } catch (error) {
    sendSchemaError(res, error, '无效的发布前模拟任务 id。');
    return;
  }

  const job = getPreflightJob(jobId);

  if (!job) {
    res.status(404).json({
      error: '发布前模拟任务不存在。',
    });
    return;
  }

  res.json(job);
};

router.post('/', postPreflightSimulation);
router.get('/:jobId', getPreflightSimulationJob);

export { router as preflightSimulationRouter };
