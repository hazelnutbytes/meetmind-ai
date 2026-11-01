import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { processTranscriptWithGemini } from '../services/gemini.js';
import { validateGeneralMeetingOutput } from '../services/validation.js';
import { triggerMeetingCompletionAutomation } from '../services/automation.js';
import { ActionItem, MeetingMinutes, PromptVersion } from '../types/index.js';

export const meetingsRouter = Router();

// POST /api/meetings - Submit transcript & process through 4 stages
meetingsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const { title, meeting_date, transcript, prompt_version } = req.body;

  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    res.status(400).json({ error: 'Transcript is required and cannot be empty.' });
    return;
  }

  const meetingTitle = title && title.trim().length > 0 ? title.trim() : 'Untitled Meeting';
  const meetingDate = meeting_date || new Date().toISOString().split('T')[0];
  const version: PromptVersion = ['v1', 'v2', 'v3'].includes(prompt_version) ? prompt_version : 'v3';

  const meetingId = uuidv4();

  try {
    // STAGE 1: Transcript Processing & Storage
    console.log(`[Stage 1] Saving transcript for meeting: ${meetingTitle} (${meetingId})`);
    const meeting = await db.createMeeting({
      id: meetingId,
      title: meetingTitle,
      meeting_date: meetingDate,
      transcript: transcript.trim(),
      processing_status: 'processing'
    });

    // STAGE 2: AI Analysis & Extraction
    console.log(`[Stage 2] Calling Gemini AI extraction with prompt ${version}...`);
    let aiOutput;
    try {
      aiOutput = await processTranscriptWithGemini(
        meeting.transcript,
        meeting.title,
        meeting.meeting_date,
        version
      );
    } catch (aiErr: any) {
      console.error('[Stage 2 Error] AI extraction failed:', aiErr.message);
      await db.updateMeetingStatus(meetingId, 'failed');
      res.status(502).json({
        error: `AI Extraction Failed: ${aiErr.message}`,
        stage: 'ai_extraction',
        meetingId
      });
      return;
    }

    // STAGE 3: Validation and Structuring
    console.log('[Stage 3] Validating structured output...');
    const validationResult = validateGeneralMeetingOutput(aiOutput);
    if (!validationResult.isValid) {
      console.warn('[Stage 3 Warning] Output validation issues:', validationResult.errors);
    }

    // STAGE 4: Storage & Event-Driven Automation
    console.log('[Stage 4] Storing meeting minutes and executing automation...');
    const minutesId = uuidv4();
    const minutes: MeetingMinutes = {
      id: minutesId,
      meeting_id: meetingId,
      summary: aiOutput.meeting_summary,
      key_discussion_points: aiOutput.key_discussion_points,
      decisions: aiOutput.decisions,
      missing_information: aiOutput.missing_information,
      generated_at: new Date().toISOString()
    };
    await db.saveMeetingMinutes(minutes);

    // Map extracted action items to database model
    const now = new Date().toISOString();
    const actionItems: ActionItem[] = aiOutput.action_items.map((item) => ({
      id: uuidv4(),
      meeting_id: meetingId,
      task_description: item.task,
      owner: item.owner,
      deadline: item.deadline,
      priority: item.priority,
      status: item.status || 'pending',
      source_evidence: item.source_evidence || null,
      created_at: now,
      updated_at: now
    }));

    // Mark meeting as completed
    await db.updateMeetingStatus(meetingId, 'completed');
    const updatedMeeting = (await db.getMeeting(meetingId)) || meeting;

    // Trigger genuine automation (webhook simulation/runner logging to automation_logs)
    const automationResult = await triggerMeetingCompletionAutomation(updatedMeeting, actionItems);

    res.status(201).json({
      success: true,
      message: 'Meeting processed successfully across all 4 stages.',
      meeting: updatedMeeting,
      minutes,
      action_items: actionItems,
      validation: validationResult,
      automation: automationResult
    });
  } catch (err: any) {
    console.error('Unhandled meeting processing error:', err);
    await db.updateMeetingStatus(meetingId, 'failed');
    res.status(500).json({
      error: err.message || 'Internal server error while processing meeting transcript.',
      stage: 'pipeline_execution',
      meetingId
    });
  }
});

// GET /api/meetings - Retrieve meeting history
meetingsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const meetings = await db.getAllMeetings();
    const allActions = await db.getActionItems();

    const enriched = await Promise.all(
      meetings.map(async (m) => {
        const minutes = await db.getMeetingMinutes(m.id);
        const meetingActions = allActions.filter((a) => a.meeting_id === m.id);
        return {
          ...m,
          summary: minutes ? minutes.summary : undefined,
          action_count: meetingActions.length,
          pending_action_count: meetingActions.filter((a) => a.status === 'pending').length
        };
      })
    );

    res.json({ meetings: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meetings/:id - Retrieve meeting detail
meetingsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
    const meeting = await db.getMeeting(id);
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    const minutes = await db.getMeetingMinutes(meeting.id);
    const actionItems = await db.getActionItems(meeting.id);
    const automationLogs = await db.getAutomationLogs(meeting.id);

    res.json({
      meeting,
      minutes,
      action_items: actionItems,
      automation_logs: automationLogs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meetings/:id - Human-in-the-loop review and correction
meetingsRouter.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
    const { summary, key_discussion_points, decisions, missing_information } = req.body;

    const existingMinutes = await db.getMeetingMinutes(meetingId);
    if (!existingMinutes) {
      res.status(404).json({ error: 'Meeting minutes not found to update.' });
      return;
    }

    const updatedMinutes: MeetingMinutes = {
      ...existingMinutes,
      summary: summary !== undefined ? summary : existingMinutes.summary,
      key_discussion_points: key_discussion_points || existingMinutes.key_discussion_points,
      decisions: decisions || existingMinutes.decisions,
      missing_information: missing_information || existingMinutes.missing_information,
      generated_at: new Date().toISOString()
    };

    const saved = await db.saveMeetingMinutes(updatedMinutes);
    res.json({ success: true, minutes: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/meetings/:id
meetingsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
    const success = await db.deleteMeeting(id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
