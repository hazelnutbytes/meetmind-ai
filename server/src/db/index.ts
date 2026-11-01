import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import {
  Meeting,
  MeetingMinutes,
  ActionItem,
  EvaluationRecord,
  AutomationLog,
  ProcessingStatus
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage file for local fallback
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface LocalStore {
  meetings: Meeting[];
  meeting_minutes: MeetingMinutes[];
  action_items: ActionItem[];
  evaluations: EvaluationRecord[];
  automation_logs: AutomationLog[];
}

const initialStore: LocalStore = {
  meetings: [],
  meeting_minutes: [],
  action_items: [],
  evaluations: [],
  automation_logs: []
};

let supabase: SupabaseClient | null = null;

if (config.hasSupabase) {
  try {
    const key = config.supabaseServiceRoleKey || config.supabaseAnonKey;
    supabase = createClient(config.supabaseUrl, key, {
      auth: { persistSession: false }
    });
    console.log('✅ Supabase client initialized with endpoint:', config.supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Failed to initialize Supabase client, using local store fallback:', err);
  }
} else {
  console.log('ℹ️ No Supabase credentials detected. Operating in persistent local store mode.');
}

// Local storage helper
function getLocalStore(): LocalStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialStore, null, 2), 'utf-8');
      return { ...initialStore };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local store:', e);
    return { ...initialStore };
  }
}

function saveLocalStore(store: LocalStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving local store:', e);
  }
}

export const db = {
  isSupabaseConnected(): boolean {
    return Boolean(supabase);
  },

  // 1. MEETINGS
  async createMeeting(meeting: Omit<Meeting, 'created_at' | 'updated_at'>): Promise<Meeting> {
    const now = new Date().toISOString();
    const fullMeeting: Meeting = {
      ...meeting,
      created_at: now,
      updated_at: now
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          id: fullMeeting.id,
          title: fullMeeting.title,
          meeting_date: fullMeeting.meeting_date,
          transcript: fullMeeting.transcript,
          processing_status: fullMeeting.processing_status,
          created_at: fullMeeting.created_at,
          updated_at: fullMeeting.updated_at
        })
        .select()
        .single();

      if (!error && data) {
        return data as Meeting;
      }
      console.warn('Supabase createMeeting error, saving to local store fallback:', error?.message);
    }

    const store = getLocalStore();
    store.meetings.unshift(fullMeeting);
    saveLocalStore(store);
    return fullMeeting;
  },

  async updateMeetingStatus(id: string, status: ProcessingStatus): Promise<Meeting | null> {
    const now = new Date().toISOString();

    if (supabase) {
      const { data, error } = await supabase
        .from('meetings')
        .update({ processing_status: status, updated_at: now })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as Meeting;
      }
    }

    const store = getLocalStore();
    const idx = store.meetings.findIndex((m) => m.id === id);
    if (idx !== -1) {
      store.meetings[idx].processing_status = status;
      store.meetings[idx].updated_at = now;
      saveLocalStore(store);
      return store.meetings[idx];
    }
    return null;
  },

  async getMeeting(id: string): Promise<Meeting | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) return data as Meeting;
    }

    const store = getLocalStore();
    return store.meetings.find((m) => m.id === id) || null;
  },

  async getAllMeetings(): Promise<Meeting[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return data as Meeting[];
    }

    const store = getLocalStore();
    return [...store.meetings].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async deleteMeeting(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('meetings').delete().eq('id', id);
      if (!error) return true;
    }

    const store = getLocalStore();
    store.meetings = store.meetings.filter((m) => m.id !== id);
    store.meeting_minutes = store.meeting_minutes.filter((mm) => mm.meeting_id !== id);
    store.action_items = store.action_items.filter((ai) => ai.meeting_id !== id);
    store.automation_logs = store.automation_logs.filter((al) => al.meeting_id !== id);
    saveLocalStore(store);
    return true;
  },

  // 2. MEETING MINUTES
  async saveMeetingMinutes(minutes: MeetingMinutes): Promise<MeetingMinutes> {
    if (supabase) {
      const { data, error } = await supabase
        .from('meeting_minutes')
        .upsert({
          id: minutes.id,
          meeting_id: minutes.meeting_id,
          summary: minutes.summary,
          key_discussion_points: minutes.key_discussion_points,
          decisions: minutes.decisions,
          missing_information: minutes.missing_information,
          generated_at: minutes.generated_at
        })
        .select()
        .single();

      if (!error && data) return data as MeetingMinutes;
    }

    const store = getLocalStore();
    const existingIndex = store.meeting_minutes.findIndex(
      (m) => m.meeting_id === minutes.meeting_id
    );
    if (existingIndex >= 0) {
      store.meeting_minutes[existingIndex] = minutes;
    } else {
      store.meeting_minutes.push(minutes);
    }
    saveLocalStore(store);
    return minutes;
  },

  async getMeetingMinutes(meetingId: string): Promise<MeetingMinutes | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('meeting_minutes')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) return data as MeetingMinutes;
    }

    const store = getLocalStore();
    return store.meeting_minutes.find((m) => m.meeting_id === meetingId) || null;
  },

  // 3. ACTION ITEMS (Idempotent insert/upsert)
  async saveActionItems(items: ActionItem[]): Promise<ActionItem[]> {
    if (items.length === 0) return [];

    if (supabase) {
      const payload = items.map((i) => ({
        id: i.id,
        meeting_id: i.meeting_id,
        task_description: i.task_description,
        owner: i.owner,
        deadline: i.deadline,
        priority: i.priority,
        status: i.status,
        source_evidence: i.source_evidence,
        created_at: i.created_at,
        updated_at: i.updated_at
      }));

      const { data, error } = await supabase
        .from('action_items')
        .upsert(payload, { onConflict: 'meeting_id, task_description' })
        .select();

      if (!error && data) return data as ActionItem[];
    }

    const store = getLocalStore();
    for (const item of items) {
      const idx = store.action_items.findIndex(
        (a) =>
          a.meeting_id === item.meeting_id &&
          a.task_description.toLowerCase().trim() === item.task_description.toLowerCase().trim()
      );
      if (idx >= 0) {
        store.action_items[idx] = item;
      } else {
        store.action_items.push(item);
      }
    }
    saveLocalStore(store);
    return items;
  },

  async getActionItems(meetingId?: string): Promise<ActionItem[]> {
    if (supabase) {
      let query = supabase.from('action_items').select('*');
      if (meetingId) {
        query = query.eq('meeting_id', meetingId);
      }
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (!error && data) return data as ActionItem[];
    }

    const store = getLocalStore();
    if (meetingId) {
      return store.action_items.filter((a) => a.meeting_id === meetingId);
    }
    return [...store.action_items].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async updateActionItem(
    id: string,
    updates: Partial<Pick<ActionItem, 'task_description' | 'owner' | 'deadline' | 'priority' | 'status'>>
  ): Promise<ActionItem | null> {
    const now = new Date().toISOString();

    if (supabase) {
      const { data, error } = await supabase
        .from('action_items')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return data as ActionItem;
    }

    const store = getLocalStore();
    const idx = store.action_items.findIndex((a) => a.id === id);
    if (idx !== -1) {
      store.action_items[idx] = {
        ...store.action_items[idx],
        ...updates,
        updated_at: now
      };
      saveLocalStore(store);
      return store.action_items[idx];
    }
    return null;
  },

  async deleteActionItem(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('action_items').delete().eq('id', id);
      if (!error) return true;
    }

    const store = getLocalStore();
    store.action_items = store.action_items.filter((a) => a.id !== id);
    saveLocalStore(store);
    return true;
  },

  // 4. EVALUATIONS
  async saveEvaluation(evaluation: EvaluationRecord): Promise<EvaluationRecord> {
    if (supabase) {
      const { data, error } = await supabase
        .from('evaluations')
        .insert({
          id: evaluation.id,
          meeting_id: evaluation.meeting_id,
          prompt_version: evaluation.prompt_version,
          test_case_name: evaluation.test_case_name,
          expected_result: evaluation.expected_result,
          actual_result: evaluation.actual_result,
          evaluation_score: evaluation.evaluation_score,
          evaluation_status: evaluation.evaluation_status,
          evaluation_details: evaluation.evaluation_details,
          created_at: evaluation.created_at
        })
        .select()
        .single();

      if (!error && data) return data as EvaluationRecord;
    }

    const store = getLocalStore();
    store.evaluations.unshift(evaluation);
    saveLocalStore(store);
    return evaluation;
  },

  async getEvaluations(): Promise<EvaluationRecord[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return data as EvaluationRecord[];
    }

    const store = getLocalStore();
    return [...store.evaluations].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  // 5. AUTOMATION LOGS
  async saveAutomationLog(log: AutomationLog): Promise<AutomationLog> {
    if (supabase) {
      const { data, error } = await supabase
        .from('automation_logs')
        .insert({
          id: log.id,
          meeting_id: log.meeting_id,
          event_type: log.event_type,
          execution_status: log.execution_status,
          execution_details: log.execution_details,
          executed_at: log.executed_at
        })
        .select()
        .single();

      if (!error && data) return data as AutomationLog;
    }

    const store = getLocalStore();
    store.automation_logs.unshift(log);
    saveLocalStore(store);
    return log;
  },

  async getAutomationLogs(meetingId?: string): Promise<AutomationLog[]> {
    if (supabase) {
      let query = supabase.from('automation_logs').select('*');
      if (meetingId) {
        query = query.eq('meeting_id', meetingId);
      }
      query = query.order('executed_at', { ascending: false });
      const { data, error } = await query;
      if (!error && data) return data as AutomationLog[];
    }

    const store = getLocalStore();
    if (meetingId) {
      return store.automation_logs.filter((l) => l.meeting_id === meetingId);
    }
    return [...store.automation_logs].sort(
      (a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
    );
  }
};
