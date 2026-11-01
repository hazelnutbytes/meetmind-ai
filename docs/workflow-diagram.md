# MeetMind AI: System Architecture & Workflow Diagram

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Frontend Layer (React 19 + TypeScript + Tailwind)"]
        UI["User Interface (MeetMind AI)"]
        Form["Transcript Submission Form"]
        Tracker["Action Tracker (List & Kanban)"]
        EvalUI["Evaluations & Rubric Dashboard"]
    end

    subgraph Backend["Backend API Layer (Node.js + Express)"]
        API["Express API Server (:5001)"]
        Pipeline["4-Stage Processing Pipeline"]
        ValEngine["Validation Engine (7-Point Rubric)"]
        AutoService["Automation Dispatcher"]
    end

    subgraph AI["Intelligence Layer (Google Gemini)"]
        Gemini["Google Gemini API (gemini-2.5-flash)"]
        Prompts["Prompt Versions (v1, v2, v3 Master)"]
    end

    subgraph Database["Persistence & Event Layer (Supabase PostgreSQL)"]
        DB[("PostgreSQL Database")]
        T_Meetings["meetings"]
        T_Minutes["meeting_minutes"]
        T_Actions["action_items"]
        T_Logs["automation_logs"]
        T_Evals["evaluations"]
        Webhook["Database Webhook (on_meeting_completed)"]
    end

    subgraph Edge["Serverless Automation Layer"]
        EdgeFunc["Supabase Edge Function (process-automation)"]
    end

    %% User Flow
    UI -->|1. Pastes Transcript| Form
    Form -->|2. POST /api/meetings| API
    API -->|Stage 1: Store Raw Transcript| T_Meetings
    API -->|Stage 2: Execute Prompt v3| Gemini
    Gemini -->|Structured JSON Output| API
    API -->|Stage 3: 7-Criteria Rubric Check| ValEngine
    ValEngine -->|Validated Minutes & Actions| T_Minutes
    API -->|Stage 4: Set Status = completed| T_Meetings

    %% Automation Flow
    T_Meetings -.->|UPDATE status = completed| Webhook
    Webhook -->|Invokes HTTP Event| EdgeFunc
    EdgeFunc -->|Idempotent Task Sync| T_Actions
    EdgeFunc -->|Write Telemetry Audit Log| T_Logs
    AutoService -.->|Local Simulation Fallback| T_Logs

    %% Query Flow
    T_Actions -->|GET /api/actions| Tracker
    T_Evals -->|GET /api/evaluations| EvalUI
    T_Logs -->|GET /api/automation/logs| UI
```

---

## 2. 4-Stage Processing Pipeline Breakdown

The application guarantees that every transcript passes through four deterministic processing stages with real backend state progression:

```
┌─────────────────────────┐
│ Stage 1: Ingestion      │ -> Validate input, assign UUID, store raw transcript in Supabase
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ Stage 2: AI Extraction  │ -> Prompt Google Gemini (Prompt v3 Master), extract decisions, tasks, citations
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ Stage 3: Validation     │ -> Verify schema, enforce zero-hallucination rules, run 7-criteria evaluation
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ Stage 4: Automation     │ -> Save minutes, mark status 'completed', trigger Webhook -> Edge Function -> Action Tracker
└─────────────────────────┘
```

---

## 3. 3-Minute College Demonstration Walkthrough

When presenting MeetMind AI to professors or examiners:

1. **Step 1: The Problem (30 seconds)**
   - Show how unorganized meeting notes lead to forgotten tasks and confused responsibilities.
   - Introduce MeetMind AI: an automated system that extracts confirmed decisions, action items, owners, and deadlines.

2. **Step 2: Processing a Transcript (60 seconds)**
   - Navigate to **"New Meeting"**.
   - Click the 1-click test case button: **"TC-01: Normal Meeting"** or **"TC-05: Ambiguous Edge Case"**.
   - Click **"Run Intelligent Extraction"**.
   - Show the **Processing Pipeline Stepper** dynamically advancing through all 4 stages.

3. **Step 3: Audit-Ready Results & Human Review (45 seconds)**
   - Show the generated **Executive Summary**, **Key Discussion Points**, and **Ratified Decisions**.
   - Highlight the extracted **Action Items**: point out the verbatim quotes in the **"Ref Evidence"** row.
   - Show how missing owners or dates are safely flagged as **"Unassigned"** or **"No Deadline"** rather than hallucinated.
   - Click **"Edit Summary (Human Review)"** to demonstrate human-in-the-loop corrections.

4. **Step 4: Action Tracker & Kanban (30 seconds)**
   - Navigate to **"Action Tracker"**.
   - Switch between **Table View** and **Kanban View**.
   - Drag or toggle a task status to **"Completed"**; note that changes instantly persist in the database.

5. **Step 5: Evaluations & Automation Evidence (35 seconds)**
   - Open **"Evaluations & Rubric"**: show the comparison between **Prompt v1 (57% accuracy)** vs **Prompt v3 (100% accuracy)** across the 5 test cases.
   - Open **"Automation & Logs"**: show the Supabase Database Webhook telemetry proving the Edge Function executed and logged its run in `automation_logs`.
