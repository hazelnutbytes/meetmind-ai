import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import {
  runAllEvaluations,
  loadTestCases,
  runEvaluationTestCase
} from '../evaluations/runner.js';
import { PromptVersion } from '../types/index.js';

export const evaluationsRouter = Router();

// GET /api/evaluations - Get all evaluation records
evaluationsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const evaluations = await db.getEvaluations();
    res.json({ evaluations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/evaluations/test-cases - Get the 5 predefined test cases
evaluationsRouter.get('/test-cases', (_req: Request, res: Response): void => {
  try {
    const testCases = loadTestCases();
    res.json({ test_cases: testCases });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/evaluations/run - Run evaluations
evaluationsRouter.post('/run', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt_version, test_case_id, force_live_ai } = req.body;
    const version: PromptVersion = ['v1', 'v2', 'v3'].includes(prompt_version) ? prompt_version : 'v3';
    const forceLive = Boolean(force_live_ai);

    if (test_case_id) {
      const testCases = loadTestCases();
      const tc = testCases.find((t) => t.id === test_case_id);
      if (!tc) {
        res.status(404).json({ error: `Test case ${test_case_id} not found.` });
        return;
      }
      const result = await runEvaluationTestCase(tc, version, forceLive);
      res.json({ success: true, evaluation: result });
      return;
    }

    const results = await runAllEvaluations(version, forceLive);
    res.json({
      success: true,
      prompt_version: version,
      total_evaluated: results.length,
      passed_count: results.filter((r) => r.evaluation_status === 'pass').length,
      average_score: (
        results.reduce((sum, r) => sum + r.evaluation_score, 0) / results.length
      ).toFixed(1),
      evaluations: results
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
