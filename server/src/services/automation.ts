import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { AutomationLog, ActionItem, Meeting } from '../types/index.js';

export interface AutomationTriggerResult {
  success: boolean;
  meetingId: string;
  tasksVerified: number;
  newTasksCreated: number;
  details: any;
  error?: string;
}

export async function triggerMeetingCompletionAutomation(
  meeting: Meeting,
  actionItemsToVerify: ActionItem[] = []
): Promise<AutomationTriggerResult> {
  const timestamp = new Date().toISOString();
  const logId = uuidv4();

  try {
    // 1. Validate meeting
    if (!meeting || !meeting.id) {
      throw new Error('Invalid meeting record passed to automation pipeline.');
    }

    // 2. Fetch existing tasks from database to enforce idempotency
    const existingTasks = await db.getActionItems(meeting.id);
    const existingDescSet = new Set(
      existingTasks.map((t) => t.task_description.toLowerCase().trim())
    );

    let newTasksCount = 0;
    const itemsToInsert: ActionItem[] = [];

    for (const item of actionItemsToVerify) {
      if (!existingDescSet.has(item.task_description.toLowerCase().trim())) {
        itemsToInsert.push({
          ...item,
          id: item.id || uuidv4(),
          meeting_id: meeting.id,
          created_at: item.created_at || timestamp,
          updated_at: timestamp
        });
        newTasksCount++;
      }
    }

    if (itemsToInsert.length > 0) {
      await db.saveActionItems(itemsToInsert);
    }

    const allCurrentTasks = await db.getActionItems(meeting.id);

    const executionDetails = {
      source: 'database_webhook:meeting_completed',
      trigger_event: 'UPDATE(processing_status -> completed)',
      meeting_id: meeting.id,
      meeting_title: meeting.title,
      meeting_date: meeting.meeting_date,
      total_action_items: allCurrentTasks.length,
      new_tasks_added: newTasksCount,
      pending_tasks: allCurrentTasks.filter((t) => t.status === 'pending').length,
      idempotency_guarantee: 'Duplicate execution prevented by (meeting_id, task_description) constraint',
      timestamp
    };

    // 3. Persist automation log record
    const log: AutomationLog = {
      id: logId,
      meeting_id: meeting.id,
      event_type: 'meeting.processing_status.completed',
      execution_status: 'success',
      execution_details: executionDetails,
      executed_at: timestamp
    };

    await db.saveAutomationLog(log);

    return {
      success: true,
      meetingId: meeting.id,
      tasksVerified: allCurrentTasks.length,
      newTasksCreated: newTasksCount,
      details: executionDetails
    };
  } catch (err: any) {
    console.error('Automation execution failed:', err);

    const failureLog: AutomationLog = {
      id: logId,
      meeting_id: meeting.id,
      event_type: 'meeting.processing_status.completed',
      execution_status: 'failure',
      execution_details: {
        error: err.message || 'Unknown automation execution failure',
        timestamp
      },
      executed_at: timestamp
    };

    await db.saveAutomationLog(failureLog);

    return {
      success: false,
      meetingId: meeting.id,
      tasksVerified: 0,
      newTasksCreated: 0,
      details: failureLog.execution_details,
      error: err.message
    };
  }
}
