# Prompt Version 1 – Basic Extraction

## Description
A straightforward baseline prompt that requests a meeting summary, decisions, action items, owners, and deadlines. It relies primarily on the LLM's default behavior without strict formatting or anti-hallucination guardrails.

## Prompt Template
```text
You are an AI meeting assistant.
Please read the following meeting transcript and extract:
1. A summary of the meeting.
2. The key discussion points.
3. Decisions made in the meeting.
4. Action items with the owner and deadline for each.

Meeting Transcript:
{{TRANSCRIPT}}

Provide your response in JSON format:
{
  "meeting_summary": "string",
  "key_discussion_points": ["string"],
  "decisions": [
    {
      "decision": "string",
      "context": "string"
    }
  ],
  "action_items": [
    {
      "task": "string",
      "owner": "string",
      "deadline": "string",
      "priority": "string",
      "status": "pending",
      "source_evidence": "string"
    }
  ],
  "missing_information": ["string"]
}
```

## Known Limitations of Version 1
- When an owner is not mentioned, the LLM may infer or fabricate a name based on whoever was speaking previously.
- When no deadline is given, the model might assign "End of week" or "TBD" as strings instead of returning `null`.
- Casual suggestions are occasionally classified as ratified decisions.
