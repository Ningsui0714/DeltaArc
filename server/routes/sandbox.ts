import { Router } from 'express';
import { SchemaError } from '../../shared/schema';
import { parseSandboxAnalysisRequest, parseSandboxAnalysisResult } from '../../shared/schema';
import {
  completeAnalysisJob,
  createAnalysisJob,
  failAnalysisJob,
  getAnalysisJob,
  markJobRunning,
  updateAnalysisJobStage,
} from '../lib/analysisJobStore';
import { runDeepseekSandboxAnalysis } from '../lib/deepseekClient';

const router = Router();

router.post('/analyze', async (req, res) => {
  let request;
  try {
    request = parseSandboxAnalysisRequest(req.body);
  } catch (error) {
    const message = error instanceof SchemaError ? error.message : 'Invalid analysis request.';
    res.status(400).json({
      error: message,
    });
    return;
  }

  const job = createAnalysisJob(request.mode);
  res.status(202).json(job);
  markJobRunning(job.id);

  void runDeepseekSandboxAnalysis(request, {
    onProgress: (update) => {
      updateAnalysisJobStage({
        jobId: job.id,
        ...update,
      });
    },
  })
    .then((result) => {
      completeAnalysisJob(job.id, parseSandboxAnalysisResult(result));
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : 'Analysis failed.';
      failAnalysisJob(job.id, message);
    });
});

router.get('/analyze/:jobId', (req, res) => {
  const job = getAnalysisJob(req.params.jobId);

  if (!job) {
    res.status(404).json({
      error: 'Analysis job not found.',
    });
    return;
  }

  res.json(job);
});

export { router as sandboxRouter };
