import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { triggerMeetingCompletionAutomation } from '../services/automation.js';

export const automationRouter = Router();

// GET /api/automation/logs - Retrieve automation execution logs
automationRouter.get('/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.query.meeting_id ? String(req.query.meeting_id) : undefined;
    const logs = await db.getAutomationLogs(meetingId);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/automation/trigger - Webhook entrypoint or manual trigger
automationRouter.post('/trigger', async (req: Request, res: Response): Promise<void> => {
  try {
    const { meeting_id, record } = req.body;
    const targetMeetingId = meeting_id || record?.id;

    if (!targetMeetingId) {
      res.status(400).json({ error: 'meeting_id is required in trigger payload.' });
      return;
    }

    const meeting = await db.getMeeting(targetMeetingId);
    if (!meeting) {
      res.status(404).json({ error: `Meeting ${targetMeetingId} not found.` });
      return;
    }

    const existingActions = await db.getActionItems(targetMeetingId);
    const result = await triggerMeetingCompletionAutomation(meeting, existingActions);

    res.json({
      success: result.success,
      message: 'Automation webhook executed successfully.',
      result
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
