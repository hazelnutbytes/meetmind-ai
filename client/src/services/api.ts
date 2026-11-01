import {
  Meeting,
  MeetingMinutes,
  ActionItem,
  DashboardStats,
  EvaluationRecord,
  AutomationLog,
  TestCase,
  PromptVersion
} from '../types';

const API_BASE = '/api';

export const api = {
  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    const res = await fetch(`${API_BASE}/meetings`);
    if (!res.ok) throw new Error('Failed to load meetings');
    const data = await res.json();
    return data.meetings || [];
  },

  async getMeeting(id: string): Promise<{
    meeting: Meeting;
    minutes: MeetingMinutes | null;
    action_items: ActionItem[];
    automation_logs: AutomationLog[];
  }> {
    const res = await fetch(`${API_BASE}/meetings/${id}`);
    if (!res.ok) throw new Error('Failed to load meeting details');
    return res.json();
  },

  async submitMeeting(payload: {
    title: string;
    meeting_date: string;
    transcript: string;
    prompt_version: PromptVersion;
  }): Promise<{
    success: boolean;
    meeting: Meeting;
    minutes: MeetingMinutes;
    action_items: ActionItem[];
    automation: any;
  }> {
    const res = await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit meeting transcript');
    return data;
  },

  async updateMeetingMinutes(
    meetingId: string,
    updates: Partial<MeetingMinutes>
  ): Promise<MeetingMinutes> {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update meeting minutes');
    return data.minutes;
  },

  async deleteMeeting(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/meetings/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  },

  // Actions
  async getActions(params?: {
    status?: string;
    owner?: string;
    meeting_id?: string;
    priority?: string;
    q?: string;
  }): Promise<ActionItem[]> {
    const query = new URLSearchParams();
    if (params) {
      if (params.status) query.append('status', params.status);
      if (params.owner) query.append('owner', params.owner);
      if (params.meeting_id) query.append('meeting_id', params.meeting_id);
      if (params.priority) query.append('priority', params.priority);
      if (params.q) query.append('q', params.q);
    }
    const res = await fetch(`${API_BASE}/actions?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load action items');
    const data = await res.json();
    return data.action_items || [];
  },

  async updateAction(
    id: string,
    updates: Partial<ActionItem>
  ): Promise<ActionItem> {
    const res = await fetch(`${API_BASE}/actions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update action item');
    return data.action_item;
  },

  async createAction(payload: {
    meeting_id: string;
    task_description: string;
    owner?: string | null;
    deadline?: string | null;
    priority?: string;
    status?: string;
  }): Promise<ActionItem> {
    const res = await fetch(`${API_BASE}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create action item');
    return data.action_item;
  },

  async deleteAction(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/actions/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to load dashboard statistics');
    return res.json();
  },

  // Evaluations
  async getEvaluations(): Promise<EvaluationRecord[]> {
    const res = await fetch(`${API_BASE}/evaluations`);
    if (!res.ok) throw new Error('Failed to load evaluations');
    const data = await res.json();
    return data.evaluations || [];
  },

  async getTestCases(): Promise<TestCase[]> {
    const res = await fetch(`${API_BASE}/evaluations/test-cases`);
    if (!res.ok) throw new Error('Failed to load test cases');
    const data = await res.json();
    return data.test_cases || [];
  },

  async runEvaluations(
    promptVersion: PromptVersion,
    testCaseId?: string,
    forceLiveAi?: boolean
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/evaluations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt_version: promptVersion,
        test_case_id: testCaseId,
        force_live_ai: forceLiveAi
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to run evaluations');
    return data;
  },

  // Automation Logs
  async getAutomationLogs(meetingId?: string): Promise<AutomationLog[]> {
    const url = meetingId
      ? `${API_BASE}/automation/logs?meeting_id=${meetingId}`
      : `${API_BASE}/automation/logs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load automation logs');
    const data = await res.json();
    return data.logs || [];
  },

  async triggerAutomationTest(meetingId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/automation/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id: meetingId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to trigger automation');
    return data;
  },

  // Settings
  async getSettingsStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/settings/status`);
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async testGeminiKey(apiKey?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/settings/test-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gemini test failed');
    return data;
  }
};
