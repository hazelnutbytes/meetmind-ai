import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import { StructuredMeetingOutput, PromptVersion } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load prompt files
function loadPromptFile(version: PromptVersion): string {
  try {
    const filename = version === 'v1' ? 'prompt-v1.md' : version === 'v2' ? 'prompt-v2.md' : 'prompt-v3.md';
    const filePath = path.resolve(__dirname, `../../../prompts/${filename}`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Extract codeblock between ```text and ``` if present, or return full content
      const match = content.match(/```text([\s\S]*?)```/);
      if (match && match[1]) {
        return match[1].trim();
      }
      return content;
    }
  } catch (err) {
    console.warn(`Could not load prompt file for ${version}, using built-in template:`, err);
  }

  // Fallback prompt strings
  if (version === 'v1') {
    return `You are an AI meeting assistant.
Please read the following meeting transcript and extract:
1. A summary of the meeting.
2. The key discussion points.
3. Decisions made in the meeting.
4. Action items with the owner and deadline for each.

Meeting Transcript:
{{TRANSCRIPT}}

Provide your response in JSON format matching:
{
  "meeting_summary": "string",
  "key_discussion_points": ["string"],
  "decisions": [{ "decision": "string", "context": "string" }],
  "action_items": [{ "task": "string", "owner": "string", "deadline": "string", "priority": "low|medium|high", "status": "pending", "source_evidence": "string" }],
  "missing_information": ["string"]
}`;
  }

  if (version === 'v2') {
    return `You are MeetMind AI, a specialized meeting intelligence agent.
Analyze the provided meeting transcript and extract structured meeting minutes according to strict criteria.

Guidelines:
1. Executive Summary: Objective 2-4 sentence summary.
2. Key Discussion Points: 3-6 distinct bullet points.
3. Decisions: Extract ONLY decisions explicitly agreed upon. Do NOT convert suggestions into decisions.
4. Action Items: For 'owner', return exact name or null if unassigned. For 'deadline', return YYYY-MM-DD or null. Priority 'low'|'medium'|'high'. Status 'pending'.
5. Missing Information: Explicitly list any action items lacking owner or deadline.

Meeting Date: {{MEETING_DATE}}
Meeting Transcript:
{{TRANSCRIPT}}

Return ONLY valid JSON.`;
  }

  // v3 (master prompt)
  return `You are MeetMind AI's Master Extraction Engine.
Your objective is to generate 100% faithful, audit-ready meeting minutes and an action tracker from the conversation transcript below.

CRITICAL INTEGRITY & ACCURACY RULES:
1. ZERO HALLUCINATION POLICY: NEVER fabricate task owners, deadlines, or decisions. If a task has no owner, 'owner' MUST be null. If no deadline was specified, 'deadline' MUST be null.
2. DECISIONS VS SUGGESTIONS: Extract a decision ONLY if participants reached consensus. If an idea was proposed but debated, objected to, or postponed, do NOT list it as a decision.
3. EVIDENCE & CITATIONS: Every action item and decision must cite 'source_evidence' — a direct quote or close paraphrase from the transcript.
4. DEADLINE RESOLUTION: When relative dates are stated with certainty relative to {{MEETING_DATE}}, resolve to ISO YYYY-MM-DD. If ambiguous or conflicting, use null.

Meeting Metadata:
- Title: {{MEETING_TITLE}}
- Date: {{MEETING_DATE}}

Meeting Transcript:
"""
{{TRANSCRIPT}}
"""

OUTPUT REQUIREMENTS: Return valid JSON with keys: meeting_summary, key_discussion_points, decisions, action_items, missing_information.`;
}

export async function processTranscriptWithGemini(
  transcript: string,
  title: string = 'Untitled Meeting',
  meetingDate: string = new Date().toISOString().split('T')[0],
  version: PromptVersion = 'v3'
): Promise<StructuredMeetingOutput> {
  if (!config.hasGeminiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env file.');
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);

  // Use configured model or fallbacks
  const modelNames = [config.geminiModel, 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];
  let promptTemplate = loadPromptFile(version);

  // Substitute variables
  const prompt = promptTemplate
    .replace(/{{MEETING_TITLE}}/g, title)
    .replace(/{{MEETING_DATE}}/g, meetingDate)
    .replace(/{{TRANSCRIPT}}/g, transcript);

  let lastError: any = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: version === 'v3' ? 0.1 : 0.4
        }
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Clean text if wrapped in markdown code blocks
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const parsed: StructuredMeetingOutput = JSON.parse(cleaned);
      return sanitizeStructuredOutput(parsed);
    } catch (err: any) {
      console.warn(`Failed with model ${modelName}:`, err.message);
      lastError = err;
      // If error is JSON parse error or rate limit, proceed to next model
    }
  }

  throw new Error(`Gemini processing failed: ${lastError?.message || 'Unknown error'}`);
}

function sanitizeStructuredOutput(output: any): StructuredMeetingOutput {
  return {
    meeting_summary: typeof output.meeting_summary === 'string' ? output.meeting_summary : 'No summary provided',
    key_discussion_points: Array.isArray(output.key_discussion_points) ? output.key_discussion_points : [],
    decisions: Array.isArray(output.decisions)
      ? output.decisions.map((d: any) => ({
          decision: String(d.decision || ''),
          context: String(d.context || '')
        }))
      : [],
    action_items: Array.isArray(output.action_items)
      ? output.action_items.map((a: any) => ({
          task: String(a.task || a.task_description || 'Untitled Task'),
          owner: a.owner === 'null' || a.owner === 'TBD' || a.owner === 'Unassigned' || !a.owner ? null : String(a.owner),
          deadline: a.deadline === 'null' || a.deadline === 'TBD' || !a.deadline ? null : String(a.deadline),
          priority: ['low', 'medium', 'high'].includes(a.priority?.toLowerCase()) ? a.priority.toLowerCase() : 'medium',
          status: 'pending',
          source_evidence: a.source_evidence ? String(a.source_evidence) : undefined
        }))
      : [],
    missing_information: Array.isArray(output.missing_information) ? output.missing_information : []
  };
}
