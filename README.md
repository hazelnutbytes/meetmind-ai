# MeetMind AI – Intelligent Meeting Minutes and Action Tracker

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![AI Engine](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-orange.svg)](https://ai.google.dev/)

---

## 1. Project Title and Overview

**Project Name:** MeetMind AI  
**Project Title:** Intelligent Meeting Minutes and Action Tracker  
**Category:** Professional Productivity & AI Workflow Automation  

**MeetMind AI** is an intelligent web application designed to turn messy, unstructured conversation transcripts from meetings (Zoom, Microsoft Teams, Google Meet, in-person recordings) into clean, audit-ready meeting minutes and an interactive action tracker. 

Instead of requiring someone to spend hours taking notes, MeetMind AI processes transcripts through a structured 4-stage pipeline, extracts ratified decisions, identifies actionable deliverables, attributes tasks to the correct owners, schedules target deadlines, and triggers automated database updates.

---

## 2. Problem Statement

> **Assigned Practical Task:**  
> *"Extract decisions, action items, owners and deadlines from a transcript."*  
>  
> **Expected Output:**  
> *"Meeting minutes and action tracker."*

In modern software teams, meetings often result in lost details:
- Suggestions are confused with agreed decisions.
- Tasks are discussed, but nobody remembers who volunteered or when it is due.
- General-purpose chatbots hallucinate fake owners or arbitrary deadlines when information is missing.

MeetMind AI solves this with strict anti-hallucination rules, verbatim transcript evidence citations, null-safe missing-data handling, and human-in-the-loop review.

---

## 3. Main Features

- **Executive Meeting Summaries**: Concise, objective synthesis of discussion context and outcomes.
- **Ratified Decision Extraction**: Isolates decisions explicitly agreed upon by participants while discarding unconfirmed brainstorming suggestions.
- **Action Item Tracker**: Structured tasks with assigned owners, ISO deadlines, priorities, and verbatim citation quotes.
- **Zero Hallucination Safeguards**: Explicitly sets unassigned owners and unspecified dates to `null` instead of inventing names or dates.
- **Human-in-the-Loop Corrections**: Review and edit generated minutes and action items directly in the UI.
- **Dual Table & Kanban Views**: Manage tasks in a responsive table or drag/toggle tasks across Pending, In Progress, and Completed columns.
- **Prompt Engineering Lab**: Compare 3 distinct prompt versions (v1 Basic, v2 Structured, v3 Master Evidence).
- **Automated 7-Point Evaluation Rubric**: Scores outputs on a 0–14 scale across 5 test scenarios.
- **Event-Driven Database Automation**: Supabase Database Webhook triggers an Edge Function when a meeting is completed.
- **Dual Persistence Architecture**: Works out of the box with Supabase PostgreSQL, and seamlessly falls back to a file-backed store if remote credentials are not yet entered.

---

## 4. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6 | Modern, component-based user interface |
| **Styling** | Tailwind CSS, Lucide React Icons | Approved "MeetMind AI Intelligent Workspace" editorial design |
| **Typography** | DM Serif Display & Inter | Editorial headings and clean, readable UI text |
| **Backend API** | Node.js, Express, TypeScript, TSX | REST API routes, validation, and pipeline coordination |
| **AI / LLM** | Google Gemini API (`@google/generative-ai`) | Structured transcript analysis and extraction |
| **Database** | Supabase (PostgreSQL 15) | Persistent relational storage with RLS policies |
| **Automation** | Supabase Database Webhooks + Edge Functions | Event-driven task verification and telemetry logging |

---

## 5. Application Architecture

```
meetmind/
├── client/                     # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Sidebar, Header, ProcessingStepper
│   │   ├── pages/              # Dashboard, NewMeeting, MeetingDetail, ActionTracker,
│   │   │                       # MeetingHistory, Evaluations, AutomationLogs, Settings
│   │   ├── services/           # Typed API client
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── App.tsx             # Root application view orchestrator
│   │   └── main.tsx            # React entrypoint
│   └── vite.config.ts          # Vite bundler configuration with API proxy
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # Environment configuration & secret checks
│   │   ├── db/                 # Supabase client + persistent fallback store
│   │   ├── evaluations/        # Test runner and rubric scoring engine
│   │   ├── routes/             # API routes (meetings, actions, dashboard, etc.)
│   │   ├── services/           # Gemini API caller, validation, automation runner
│   │   └── index.ts            # Express server entrypoint
├── supabase/
│   ├── migrations/             # SQL schema (001_initial_schema.sql)
│   └── functions/
│       └── process-automation/ # Deno/TypeScript Supabase Edge Function
├── prompts/                    # Master prompt and tested prompt versions (v1, v2, v3)
├── tests/
│   └── test-cases/             # 5 test case transcripts and ground truth JSON
├── docs/                       # Workflow diagram, test evidence, automation evidence
├── .env.example                # Template for environment variables
└── README.md                   # Complete documentation
```

---

## 6. Workflow Explanation

1. **User Submits Transcript**: The user enters a title, date, and transcript (or clicks a 1-click test case).
2. **Backend Pipeline Executes**: The backend coordinates the 4 processing stages.
3. **Gemini Extracts Structured JSON**: Using Prompt v3, Gemini generates clean, parseable JSON with quotes and null-handling.
4. **Validation & Quality Scoring**: The output is validated against schema constraints and scored using the 7 criteria.
5. **Storage & Webhook Event**: Meeting minutes and action items are saved to Supabase. Meeting status is marked `completed`.
6. **Edge Function Execution**: The database webhook invokes the Edge Function, which verifies task counts and logs execution into `automation_logs`.
7. **Action Tracker Display**: The user can immediately view, filter, edit, or complete tasks in the Action Tracker.

---

## 7. Four-Stage Minimum Processing Pipeline

MeetMind AI implements a deterministic 4-stage pipeline that updates the UI in real time:

- **Stage 1: Transcript Processing & Storage**: Accepts the raw conversation, validates non-empty input, creates the meeting record in Supabase, and sets status to `processing`.
- **Stage 2: AI Analysis & Extraction**: Invokes the Google Gemini API with the designated prompt version, generating structured JSON with decisions and action items.
- **Stage 3: Validation & Structuring**: Inspects the generated output, verifies schema conformity, checks for unassigned tasks or missing deadlines, and records warnings.
- **Stage 4: Storage & Automation**: Saves meeting minutes, inserts action items, updates meeting status to `completed`, and fires the database webhook automation.

---

## 8. Google Gemini API Integration

MeetMind AI integrates the official Google Gemini SDK (`@google/generative-ai`):
- **Model**: `gemini-2.5-flash` (or `gemini-1.5-flash` fallback).
- **Structured JSON Mode**: Configured with `responseMimeType: "application/json"`.
- **Security**: The `GEMINI_API_KEY` is kept strictly server-side and never exposed to browser client code.
- **Zero Hallucination Rules**:
  - Never guess or invent a name if none is explicitly mentioned.
  - Never guess a date; use `null` if unstated.
  - Differentiate explicit decisions from suggestions.

---

## 9. Prompt Engineering Approach

Three distinct prompt versions were engineered and benchmarked:

1. **Prompt Version 1 (Basic Extraction)**:
   - A standard prompt asking for summary, decisions, and action items.
   - *Limitation*: Tends to invent owners (e.g. assigning tasks to whoever spoke last) and fills dates with text like `"end of week"` instead of `null`.
2. **Prompt Version 2 (Structured Extraction)**:
   - Adds negative constraints: explicitly requires `null` for unassigned items, separates suggestions from decisions, and enforces JSON output.
   - *Limitation*: Sometimes struggles with subtle contradictions or debate debates.
3. **Prompt Version 3 (Evidence-Based Master)**:
   - **Production Engine**: Mandates verbatim quotes from the transcript (`source_evidence`) for every decision and action item.
   - Resolves conflicting statements by setting ambiguous fields to `null` and logging notes in `missing_information`.
   - Achieves **14/14 points (100% pass rate)** on the evaluation benchmark.

---

## 10. Database Schema Explanation

The Supabase PostgreSQL database contains five interconnected relational tables:

1. **`meetings`**: Stores meeting metadata (`id`, `title`, `meeting_date`, `transcript`, `processing_status`, timestamps).
2. **`meeting_minutes`**: Stores the generated minutes (`id`, `meeting_id`, `summary`, `key_discussion_points`, `decisions`, `missing_information`).
3. **`action_items`**: Stores actionable deliverables (`id`, `meeting_id`, `task_description`, `owner`, `deadline`, `priority`, `status`, `source_evidence`). Protected by a UNIQUE constraint on `(meeting_id, task_description)` to guarantee idempotency.
4. **`evaluations`**: Stores prompt evaluation records (`id`, `prompt_version`, `test_case_name`, `expected_result`, `actual_result`, `evaluation_score`, `evaluation_status`, `evaluation_details`).
5. **`automation_logs`**: Stores event-driven automation logs (`id`, `meeting_id`, `event_type`, `execution_status`, `execution_details`, `executed_at`).

---

## 11. Supabase Automation Workflow

When a meeting is processed:
1. `meetings.processing_status` is updated to `'completed'`.
2. A **Supabase Database Webhook** detects this `UPDATE` event and dispatches an HTTP POST payload to the **Supabase Edge Function** (`process-automation`).
3. The Edge Function verifies the meeting, idempotently synchronizes action items, and writes an audit log to `automation_logs`.
4. If running locally without remote Supabase webhooks active, the backend's automation dispatcher runs the exact same idempotent workflow and writes to `automation_logs`.

---

## 12. Output Validation & Evaluation Rubric

Every evaluation is scored on a **0–2 scale across 7 criteria** (Maximum 14 points):

1. **Summary Accuracy (0–2)**: Captures purpose, context, and core takeaways.
2. **Decision Extraction Accuracy (0–2)**: Correctly identifies ratified decisions without including rejected ideas.
3. **Action-Item Completeness (0–2)**: Extracts all genuine deliverables.
4. **Owner Identification Accuracy (0–2)**: Correctly attributes tasks and enforces `null` for unassigned items.
5. **Deadline Accuracy (0–2)**: Resolves ISO dates and enforces `null` when no date was agreed upon.
6. **Evidence & Factual Consistency (0–2)**: Requires verbatim citations from the transcript.
7. **Handling of Missing Information (0–2)**: Flags unassigned tasks, missing deadlines, or unresolved conflicts.

---

## 13. Five Test Cases and Results

| ID | Name | Core Test Scenario | Prompt v1 | Prompt v3 | Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **TC-01** | Normal Meeting | Clear consensus, assigned deliverables, explicit dates | 12/14 | **14/14** | PASS |
| **TC-02** | Multiple Action Items | 4 tasks distributed across 4 different team members | 12/14 | **14/14** | PASS |
| **TC-03** | Missing Owner | Urgent task scheduled, but nobody has root keys (unassigned) | 8/14 | **14/14** | PASS |
| **TC-04** | Missing Deadline | Owner takes task, but explicitly states no deadline set yet | 8/14 | **14/14** | PASS |
| **TC-05** | Edge Case: Ambiguity | CRM migration rejected; 2 conflicting deadlines debated | 6/14 | **14/14** | PASS |

---

## 14. Installation Instructions

### Prerequisites
- **Node.js**: Version 20.x or higher installed (`node -v`).
- **NPM**: Version 10.x or higher installed (`npm -v`).
- (Optional) **Git** and a **Supabase account**.

### Clone and Install
```bash
# Clone or navigate to the repository
cd /Users/macbook/Desktop/meetmind

# Install dependencies across all workspaces
npm install
```

---

## 15. Environment Variable Configuration

Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Open `.env` and fill in your keys:
```env
PORT=5001
NODE_ENV=development

# Enter your Gemini API Key from https://aistudio.google.com/
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# (Optional) Supabase credentials for remote database persistence
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_WEBHOOK_SECRET=your_secret_here
```

> **Note:** If you run without Supabase credentials, MeetMind AI operates seamlessly using its persistent local file store (`server/data/store.json`), allowing you to test all features immediately!

---

## 16. Database Setup (Supabase PostgreSQL)

If using Supabase:
1. Log in to [Supabase](https://supabase.com/).
2. Create a new project.
3. Open the **SQL Editor** in the left sidebar.
4. Open the migration file: `supabase/migrations/001_initial_schema.sql`.
5. Paste the entire SQL script and click **"Run"**.
6. The 5 tables (`meetings`, `meeting_minutes`, `action_items`, `evaluations`, `automation_logs`) and RLS policies are now active.

---

## 17. Supabase Edge Function Deployment

To deploy the Edge Function:
```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login and link to your project
supabase login
supabase link --project-ref your_supabase_project_ref

# Deploy the function
supabase functions deploy process-automation
```

---

## 18. Database Webhook Configuration

1. In Supabase Dashboard, go to **Database** → **Webhooks**.
2. Click **"Create a new webhook"**.
3. Name: `on_meeting_completed`.
4. Table: `meetings`.
5. Events: Check `Update`.
6. Webhook Type: `Supabase Edge Function` → Select `process-automation`.
7. Click **"Save"**.

---

## 19. How to Run the Frontend

```bash
# Run the Vite React frontend in development mode
npm --workspace=client run dev
```
The frontend starts at: `http://localhost:3000`

---

## 20. How to Run the Backend

```bash
# Run the Express API server in development mode
npm --workspace=server run dev
```
The backend server starts at: `http://localhost:5001`

### Running Both Frontend and Backend Concurrently
You can start both simultaneously with one command from the project root:
```bash
npm run dev
```

---

## 21. How to Test the Application

### 1. Run the Evaluation Benchmark Suite (CLI)
```bash
npm test:eval
```
This tests all 3 prompt versions across the 5 test cases and logs the score breakdown.

### 2. Run Interactive Tests in the Browser
1. Open `http://localhost:3000`.
2. Go to **"New Meeting"** → Click any test case button (e.g. `TC-01: Normal Meeting`) → Click **"Run Intelligent Extraction"**.
3. Go to **"Action Tracker"** to update task statuses or switch to Kanban view.
4. Go to **"Evaluations & Rubric"** and click **"Run Benchmark (V3)"** to inspect real-time pass/fail indicators and rubric points.
5. Go to **"Automation & Logs"** to view database webhook execution telemetry.

---

## 22. Known Limitations

1. **Audio/Video Transcriptions**: MeetMind AI is specialized for text transcript analysis. Pre-recorded audio files must first be converted to text transcripts before submission.
2. **Relative Dates without Reference Date**: If a meeting transcript mentions "in three days" but no meeting date is provided, the system defaults to the current day as the reference date.
3. **Complex Non-Consensus Votes**: In meetings where a vote ends in a tie without an authoritative chair decision, the topic is correctly flagged as missing/unresolved rather than ratified.
