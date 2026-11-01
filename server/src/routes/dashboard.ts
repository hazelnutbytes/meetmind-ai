import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { DashboardStats } from '../types/index.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const meetings = await db.getAllMeetings();
    const actionItems = await db.getActionItems();
    const today = new Date().toISOString().split('T')[0];

    const meetingMap = new Map(meetings.map((m) => [m.id, m.title]));

    const totalMeetings = meetings.length;
    const totalActions = actionItems.length;
    const pendingTasks = actionItems.filter((i) => i.status === 'pending').length;
    const completedTasks = actionItems.filter((i) => i.status === 'completed').length;

    // Overdue tasks: deadline < today and status != completed
    const overdueTasks = actionItems.filter(
      (i) => i.deadline && i.deadline < today && i.status !== 'completed'
    ).length;

    // Recent meetings
    const recentMeetings = await Promise.all(
      meetings.slice(0, 5).map(async (m) => {
        const minutes = await db.getMeetingMinutes(m.id);
        const count = actionItems.filter((a) => a.meeting_id === m.id).length;
        return {
          id: m.id,
          title: m.title,
          meeting_date: m.meeting_date,
          processing_status: m.processing_status,
          summary: minutes ? minutes.summary : undefined,
          action_count: count
        };
      })
    );

    // Upcoming deadlines: tasks with deadline >= today and status != completed, sorted by deadline
    const upcomingDeadlines = actionItems
      .filter((i) => i.deadline && i.status !== 'completed')
      .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))
      .slice(0, 5)
      .map((i) => ({
        id: i.id,
        task_description: i.task_description,
        owner: i.owner,
        deadline: i.deadline!,
        priority: i.priority,
        meeting_title: meetingMap.get(i.meeting_id) || 'General Meeting'
      }));

    const stats: DashboardStats = {
      totalMeetings,
      totalActions,
      pendingTasks,
      completedTasks,
      overdueTasks,
      recentMeetings,
      upcomingDeadlines
    };

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
