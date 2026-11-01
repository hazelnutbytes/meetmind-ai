import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { ActionItem } from '../types/index.js';

export const actionsRouter = Router();

// GET /api/actions - List action items with filters
actionsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, owner, meeting_id, priority, q } = req.query;

    let items = await db.getActionItems(meeting_id ? String(meeting_id) : undefined);

    if (status && typeof status === 'string') {
      items = items.filter((i) => i.status.toLowerCase() === status.toLowerCase());
    }

    if (owner && typeof owner === 'string') {
      if (owner === 'unassigned') {
        items = items.filter((i) => i.owner === null);
      } else {
        items = items.filter((i) => i.owner && i.owner.toLowerCase().includes(owner.toLowerCase()));
      }
    }

    if (priority && typeof priority === 'string') {
      items = items.filter((i) => i.priority.toLowerCase() === priority.toLowerCase());
    }

    if (q && typeof q === 'string') {
      const search = q.toLowerCase();
      items = items.filter(
        (i) =>
          i.task_description.toLowerCase().includes(search) ||
          (i.owner && i.owner.toLowerCase().includes(search))
      );
    }

    // Attach meeting title for convenience
    const meetings = await db.getAllMeetings();
    const meetingMap = new Map(meetings.map((m) => [m.id, m.title]));

    const enriched = items.map((item) => ({
      ...item,
      meeting_title: meetingMap.get(item.meeting_id) || 'Unknown Meeting'
    }));

    res.json({ action_items: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/actions - Manually create action item
actionsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { meeting_id, task_description, owner, deadline, priority, status } = req.body;

    if (!meeting_id || !task_description) {
      res.status(400).json({ error: 'meeting_id and task_description are required.' });
      return;
    }

    const now = new Date().toISOString();
    const newItem: ActionItem = {
      id: uuidv4(),
      meeting_id,
      task_description: task_description.trim(),
      owner: owner && owner.trim() ? owner.trim() : null,
      deadline: deadline && deadline.trim() ? deadline.trim() : null,
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      status: ['pending', 'in_progress', 'completed'].includes(status) ? status : 'pending',
      source_evidence: 'Manually added by user',
      created_at: now,
      updated_at: now
    };

    const saved = await db.saveActionItems([newItem]);
    res.status(201).json({ success: true, action_item: saved[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/actions/:id - Update action item
actionsRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
    const { task_description, owner, deadline, priority, status } = req.body;

    const updates: any = {};
    if (task_description !== undefined) updates.task_description = task_description;
    if (owner !== undefined) updates.owner = owner;
    if (deadline !== undefined) updates.deadline = deadline;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;

    const updated = await db.updateActionItem(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Action item not found.' });
      return;
    }

    res.json({ success: true, action_item: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/actions/:id - Delete action item
actionsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
    const success = await db.deleteActionItem(id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
