export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type PromptVersion = 'v1' | 'v2' | 'v3';

export interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  transcript: string;
  processing_status: ProcessingStatus;
  created_at: string;
  updated_at: string;
}

export interface DecisionItem {
  decision: string;
  context: string;
}

export interface ActionItemExtract {
  task: string;
  owner: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  source_evidence?: string;
}

export interface StructuredMeetingOutput {
  meeting_summary: string;
  key_discussion_points: string[];
  decisions: DecisionItem[];
  action_items: ActionItemExtract[];
  missing_information: string[];
}

export interface MeetingMinutes {
  id: string;
  meeting_id: string;
  summary: string;
  key_discussion_points: string[];
  decisions: DecisionItem[];
  missing_information: string[];
  generated_at: string;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  task_description: string;
  owner: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  source_evidence: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvaluationCriterion {
  criterion: string;
  score: number; // 0, 1, or 2
  max_score: 2;
  feedback: string;
}

export interface EvaluationRecord {
  id: string;
  meeting_id: string | null;
  prompt_version: PromptVersion;
  test_case_name: string;
  expected_result: any;
  actual_result: any;
  evaluation_score: number; // 0 - 14
  evaluation_status: 'pass' | 'fail';
  evaluation_details: {
    criteria_scores: EvaluationCriterion[];
    total_score: number;
    max_score: number;
    percentage: number;
    hallucination_detected: boolean;
    missing_info_accuracy: boolean;
  };
  created_at: string;
}

export interface AutomationLog {
  id: string;
  meeting_id: string;
  event_type: string;
  execution_status: 'success' | 'failure' | 'skipped';
  execution_details: any;
  executed_at: string;
}

export interface DashboardStats {
  totalMeetings: number;
  totalActions: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  recentMeetings: Array<{
    id: string;
    title: string;
    meeting_date: string;
    processing_status: ProcessingStatus;
    summary?: string;
    action_count: number;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    task_description: string;
    owner: string | null;
    deadline: string;
    priority: TaskPriority;
    meeting_title: string;
  }>;
}
