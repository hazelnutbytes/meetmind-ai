-- ==============================================================================
-- MeetMind AI: Intelligent Meeting Minutes and Action Tracker
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. MEETINGS TABLE
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transcript TEXT NOT NULL,
    processing_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for searching and filtering meetings
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(processing_status);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at DESC);

-- 2. MEETING MINUTES TABLE
CREATE TABLE IF NOT EXISTS meeting_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    key_discussion_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_information JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_minutes_meeting_id ON meeting_minutes(meeting_id);

-- 3. ACTION ITEMS TABLE (Action Tracker)
CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    owner TEXT NULL,
    deadline DATE NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    source_evidence TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_meeting_task UNIQUE (meeting_id, task_description)
);

CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_owner ON action_items(owner);
CREATE INDEX IF NOT EXISTS idx_action_items_deadline ON action_items(deadline);

-- 4. EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NULL REFERENCES meetings(id) ON DELETE SET NULL,
    prompt_version TEXT NOT NULL,
    test_case_name TEXT NOT NULL,
    expected_result JSONB NOT NULL,
    actual_result JSONB NOT NULL,
    evaluation_score NUMERIC(5,2) NOT NULL,
    evaluation_status TEXT NOT NULL CHECK (evaluation_status IN ('pass', 'fail')),
    evaluation_details JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_prompt_version ON evaluations(prompt_version);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);

-- 5. AUTOMATION LOGS TABLE
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NULL REFERENCES meetings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'failure', 'skipped')),
    execution_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_meeting_id ON automation_logs(meeting_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_executed_at ON automation_logs(executed_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for authenticated and anon users (controlled by API service role on server)
CREATE POLICY "Allow public read on meetings" ON meetings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on meetings" ON meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on meetings" ON meetings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on meetings" ON meetings FOR DELETE USING (true);

CREATE POLICY "Allow public read on meeting_minutes" ON meeting_minutes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on meeting_minutes" ON meeting_minutes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on meeting_minutes" ON meeting_minutes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on meeting_minutes" ON meeting_minutes FOR DELETE USING (true);

CREATE POLICY "Allow public read on action_items" ON action_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on action_items" ON action_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on action_items" ON action_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on action_items" ON action_items FOR DELETE USING (true);

CREATE POLICY "Allow public read on evaluations" ON evaluations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on evaluations" ON evaluations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on automation_logs" ON automation_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on automation_logs" ON automation_logs FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- AUTOMATION TRIGGER & WEBHOOK INSTRUCTIONS
-- ==============================================================================
-- To set up the genuine trigger-action automation in Supabase Dashboard:
-- 1. Navigate to Database -> Webhooks.
-- 2. Click "Create a new webhook".
-- 3. Name: "on_meeting_completed".
-- 4. Table: "meetings".
-- 5. Events: Check "Update".
-- 6. Type: "Supabase Edge Function" -> Select "process-automation".
-- 7. Condition: OLD.processing_status != 'completed' AND NEW.processing_status = 'completed'.
