import { GoogleGenAI } from '@google/genai';
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
      const match = content.match(/```text([\s\S]*?)```/);
      if (match && match[1]) {
        return match[1].trim();
      }
      return content;
    }
  } catch (err) {
    console.warn(`Could not load prompt file for ${version}, using built-in template:`, err);
  }

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

// Check if error is transient and retryable (503, 429, 500, network/demand spikes)
export function isTransientError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.statusCode || err.code;

  if (status === 503 || status === 429 || status === 500 || status === 'UNAVAILABLE') {
    return true;
  }

  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('500') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('fetch failed') ||
    msg.includes('overloaded') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  const promptTemplate = loadPromptFile(version);
  const prompt = promptTemplate
    .replace(/{{MEETING_TITLE}}/g, title)
    .replace(/{{MEETING_DATE}}/g, meetingDate)
    .replace(/{{TRANSCRIPT}}/g, transcript);

  // Model hierarchy: configured primary first, then supported flash fallbacks
  const rawCandidates = [
    config.geminiModel,
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash'
  ];
  // Deduplicate candidates preserving order
  const modelCandidates = Array.from(new Set(rawCandidates.filter(Boolean)));

  const MAX_RETRIES = 3;
  const INITIAL_BACKOFF_MS = 2000; // 2s, 4s, 8s
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);

  let lastError: any = null;

  for (const modelName of modelCandidates) {
    console.log(`[Gemini Extraction] Attempting model candidate: "${modelName}" (Prompt ${version.toUpperCase()})`);

    let delayMs = INITIAL_BACKOFF_MS;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Attempt via @google/genai first
        let responseText: string | null = null;
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: version === 'v3' ? 0.1 : 0.4
            }
          });
          if (response && response.text) {
            responseText = response.text;
          }
        } catch (sdk1Err: any) {
          // If @google/genai threw, try fallback SDK @google/generative-ai
          if (!isTransientError(sdk1Err)) {
            throw sdk1Err; // Non-retryable error (e.g. invalid arg)
          }
          console.warn(`[Gemini] ${modelName} via @google/genai attempt ${attempt} failed: ${sdk1Err.message}. Trying @google/generative-ai...`);
          
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: version === 'v3' ? 0.1 : 0.4
            }
          });
          const result = await model.generateContent(prompt);
          responseText = result.response.text();
        }

        if (responseText) {
          const cleaned = responseText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();

          const parsed: StructuredMeetingOutput = JSON.parse(cleaned);
          console.log(`✅ [Gemini Extraction Success] Processed successfully using model "${modelName}" on attempt ${attempt}.`);
          return sanitizeStructuredOutput(parsed);
        }
      } catch (err: any) {
        lastError = err;
        const transient = isTransientError(err);

        if (transient && attempt < MAX_RETRIES) {
          console.warn(
            `⚠️ [Gemini Transient Error] Model "${modelName}" attempt ${attempt}/${MAX_RETRIES} failed (${err.message}). ` +
            `Applying exponential backoff: retrying in ${delayMs / 1000}s...`
          );
          await sleep(delayMs);
          delayMs *= 2; // 2s -> 4s -> 8s
        } else {
          console.warn(
            `❌ [Gemini Model Failed] Model "${modelName}" attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}. ` +
            `${attempt >= MAX_RETRIES ? 'Max retries reached for this model.' : 'Non-retryable error.'} Falling back to next candidate if available.`
          );
          break; // Break retry loop to try next model candidate
        }
      }
    }
  }

  // All candidates and retries exhausted
  const is503 = isTransientError(lastError);
  console.error(`🛑 [Gemini Service Exhausted] All models and retries failed. Final error: ${lastError?.message}`);

  const userFacingMessage = is503
    ? 'Gemini is temporarily unavailable. Please try again.'
    : `AI Extraction Failed: ${lastError?.message || 'Unable to generate response'}`;

  const failureError: any = new Error(userFacingMessage);
  failureError.statusCode = is503 ? 503 : 502;
  failureError.isRetryable = true;
  failureError.originalError = lastError?.message;
  throw failureError;
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
