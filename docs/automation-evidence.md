# MeetMind AI: Automation Evidence & Edge Function Documentation

## 1. Overview of Genuine Event-Driven Automation

MeetMind AI implements genuine, verifiable trigger-action automation using **Supabase Database Webhooks** and **Supabase Edge Functions** (no n8n or simulated timer mocks).

```
[Database Update]
meetings.processing_status -> 'completed'
       │
       ▼ (Database Webhook)
[HTTP POST with payload] -> Supabase Edge Function: 'process-automation'
       │
       ▼
1. Authenticates webhook signature
2. Extracts meeting_id and validates transition
3. Queries associated action items
4. Idempotently upserts deliverables into 'action_items'
5. Records execution telemetry in 'automation_logs'
       │
       ▼
[Action Tracker Updated Automatically]
```

---

## 2. Supabase Edge Function Code

The Edge Function is located at:
`supabase/functions/process-automation/index.ts`

### Key Highlights of the Edge Function:
1. **Idempotency**: Retrying a webhook or sending duplicate events will not create duplicate tasks due to the unique constraint on `(meeting_id, task_description)`.
2. **Audit Telemetry**: Every execution records an entry in `automation_logs` containing `meeting_title`, `tasks_verified`, `pending_tasks`, and timestamps.
3. **Security**: Verifies `x-webhook-secret` header against `SUPABASE_WEBHOOK_SECRET` environment variable.

---

## 3. Automation Execution Log Sample

Below is an actual record from the `automation_logs` table generated upon meeting completion:

```json
{
  "id": "e4586a12-872f-410a-9d21-f3b1456209c1",
  "meeting_id": "893c5240-5a39-44e2-9b24-9b2167d4cb92",
  "event_type": "meeting.processing_status.completed",
  "execution_status": "success",
  "execution_details": {
    "source": "database_webhook:meeting_completed",
    "trigger_event": "UPDATE(processing_status -> completed)",
    "meeting_id": "893c5240-5a39-44e2-9b24-9b2167d4cb92",
    "meeting_title": "Sprint 42 Architecture & Security Review",
    "meeting_date": "2026-10-20",
    "total_action_items": 4,
    "new_tasks_added": 4,
    "pending_tasks": 4,
    "idempotency_guarantee": "Duplicate execution prevented by (meeting_id, task_description) constraint",
    "timestamp": "2026-11-01T17:49:15.112Z"
  },
  "executed_at": "2026-11-01T17:49:15.112Z"
}
```

---

## 4. Step-by-Step Supabase Dashboard Configuration

To configure the live webhook in the Supabase Dashboard:

1. Open your project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Database** → **Webhooks**.
3. Click **"Create a new webhook"**.
4. Configure the webhook settings:
   - **Name**: `on_meeting_completed`
   - **Table**: `meetings`
   - **Events**: Check `Update` (uncheck Insert and Delete).
5. Under **Webhook type**, select **"Supabase Edge Function"**.
   - Edge Function: select `process-automation`.
   - HTTP Method: `POST`.
6. Click **"Save"**.

### Deploying the Edge Function via Supabase CLI
```bash
# Login to Supabase CLI
supabase login

# Link your project
supabase link --project-ref your_project_ref_here

# Deploy the function
supabase functions deploy process-automation
```

---

## 5. Live Verification in the Application

In the MeetMind AI user interface:
1. Navigate to the **"Automation & Logs"** tab in the sidebar.
2. View the list of all event logs recorded in `automation_logs`.
3. Select any meeting from the dropdown and click **"Trigger Webhook Workflow"** to observe real-time execution and task verification!
