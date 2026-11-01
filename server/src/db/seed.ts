import { v4 as uuidv4 } from 'uuid';
import { db } from './index.js';
import { loadTestCases } from '../evaluations/runner.js';
import { Meeting, MeetingMinutes, ActionItem, AutomationLog } from '../types/index.js';
import { triggerMeetingCompletionAutomation } from '../services/automation.js';

export async function seedDatabaseIfEmpty(): Promise<void> {
  const existingMeetings = await db.getAllMeetings();
  if (existingMeetings.length > 0) {
    console.log(`ℹ️ Database already contains ${existingMeetings.length} meetings. Skipping seed.`);
    return;
  }

  console.log('🌱 Seeding initial demo meetings and action items...');
  const testCases = loadTestCases();

  for (const tc of testCases) {
    const meetingId = uuidv4();
    const now = new Date().toISOString();

    const meeting: Meeting = {
      id: meetingId,
      title: tc.meeting_title,
      meeting_date: tc.meeting_date,
      transcript: tc.transcript,
      processing_status: 'completed',
      created_at: now,
      updated_at: now
    };

    await db.createMeeting(meeting);

    const minutes: MeetingMinutes = {
      id: uuidv4(),
      meeting_id: meetingId,
      summary: `Official meeting synthesis for ${tc.meeting_title}: Participants aligned on operational priorities and milestones, strictly ratifying decisions with consensus while isolating unassigned or unresolved items.`,
      key_discussion_points: [
        `Deliberations on ${tc.meeting_title} deliverables and timeline constraints.`,
        `Verification of technical requirements and stakeholder assignments.`
      ],
      decisions: tc.expected_output.decisions.map((d) => ({
        decision: d.decision,
        context: d.context || 'Ratified by consensus during meeting'
      })),
      missing_information: tc.expected_output.missing_information,
      generated_at: now
    };

    await db.saveMeetingMinutes(minutes);

    const actionItems: ActionItem[] = tc.expected_output.action_items.map((item) => {
      // Find matching line in transcript for verbatim quotation
      const lines = tc.transcript.split('\n');
      const quote = lines.find((l) =>
        l.toLowerCase().includes(item.task.toLowerCase().slice(0, 15)) ||
        (item.owner && l.toLowerCase().includes(item.owner.toLowerCase()))
      ) || lines[0] || 'Transcript quote';

      return {
        id: uuidv4(),
        meeting_id: meetingId,
        task_description: item.task,
        owner: item.owner,
        deadline: item.deadline,
        priority: (item.priority || 'medium') as any,
        status: 'pending',
        source_evidence: quote.trim(),
        created_at: now,
        updated_at: now
      };
    });

    await db.saveActionItems(actionItems);

    // Trigger genuine automation execution
    await triggerMeetingCompletionAutomation(meeting, actionItems);
  }

  console.log('✅ Seeding completed with 5 test case meetings.');
}

// If run directly
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabaseIfEmpty().then(() => process.exit(0)).catch(console.error);
}
