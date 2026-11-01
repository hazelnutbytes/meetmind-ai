import {
  StructuredMeetingOutput,
  EvaluationCriterion,
  EvaluationRecord,
  PromptVersion
} from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface ExpectedTestCaseOutput {
  decisions: Array<{ decision: string; context?: string }>;
  action_items: Array<{
    task: string;
    owner: string | null;
    deadline: string | null;
    priority?: string;
  }>;
  missing_information: string[];
}

export function validateOutputAgainstGroundTruth(
  actual: StructuredMeetingOutput,
  expected: ExpectedTestCaseOutput,
  testCaseName: string,
  promptVersion: PromptVersion,
  meetingId: string | null = null
): EvaluationRecord {
  const criteria: EvaluationCriterion[] = [];

  // Criterion 1: Summary accuracy
  const hasSummary = Boolean(actual.meeting_summary && actual.meeting_summary.trim().length > 30);
  criteria.push({
    criterion: 'Summary Accuracy',
    score: hasSummary ? 2 : actual.meeting_summary ? 1 : 0,
    max_score: 2,
    feedback: hasSummary
      ? 'Comprehensive executive summary capturing meeting intent.'
      : 'Summary is either missing or too brief.'
  });

  // Criterion 2: Decision extraction accuracy
  let decisionScore = 2;
  let decisionFeedback = 'Decisions matched expected consensus items.';
  const expectedDecisionsCount = expected.decisions.length;
  const actualDecisionsCount = actual.decisions.length;

  if (expectedDecisionsCount === 0) {
    if (actualDecisionsCount === 0) {
      decisionScore = 2;
      decisionFeedback = 'Correctly identified zero ratified decisions (tabled debate).';
    } else {
      decisionScore = 0;
      decisionFeedback = 'Fabricated decisions out of tentative or disputed proposals.';
    }
  } else {
    if (actualDecisionsCount === expectedDecisionsCount) {
      decisionScore = 2;
      decisionFeedback = `Accurately identified all ${expectedDecisionsCount} decisions.`;
    } else if (actualDecisionsCount > 0) {
      decisionScore = 1;
      decisionFeedback = `Extracted ${actualDecisionsCount}/${expectedDecisionsCount} decisions.`;
    } else {
      decisionScore = 0;
      decisionFeedback = 'Failed to extract ratified decisions.';
    }
  }
  criteria.push({
    criterion: 'Decision Extraction Accuracy',
    score: decisionScore as 0 | 1 | 2,
    max_score: 2,
    feedback: decisionFeedback
  });

  // Criterion 3: Action-item completeness
  let itemScore = 2;
  let itemFeedback = 'Extracted all required action items.';
  const expectedItemsCount = expected.action_items.length;
  const actualItemsCount = actual.action_items.length;

  if (actualItemsCount >= expectedItemsCount && expectedItemsCount > 0) {
    itemScore = 2;
    itemFeedback = `Captured all ${expectedItemsCount} actionable deliverables.`;
  } else if (actualItemsCount > 0) {
    itemScore = 1;
    itemFeedback = `Extracted ${actualItemsCount}/${expectedItemsCount} action items.`;
  } else {
    itemScore = 0;
    itemFeedback = 'No action items extracted.';
  }
  criteria.push({
    criterion: 'Action-Item Completeness',
    score: itemScore as 0 | 1 | 2,
    max_score: 2,
    feedback: itemFeedback
  });

  // Criterion 4: Owner identification accuracy (checking null handling & correct assignment)
  let ownerScore = 2;
  let ownerFeedback = 'Task owners correctly attributed and unassigned tasks kept null.';
  let ownerHallucination = false;

  for (const expItem of expected.action_items) {
    const actMatch = actual.action_items.find((a) =>
      a.task.toLowerCase().includes(expItem.task.toLowerCase().slice(0, 15)) ||
      expItem.task.toLowerCase().includes(a.task.toLowerCase().slice(0, 15))
    );

    if (expItem.owner === null) {
      if (actMatch && actMatch.owner !== null) {
        ownerHallucination = true;
        ownerScore = 0;
        ownerFeedback = `Hallucinated owner '${actMatch.owner}' for unassigned task: ${expItem.task}`;
        break;
      }
    } else if (expItem.owner) {
      if (!actMatch || !actMatch.owner || !actMatch.owner.toLowerCase().includes(expItem.owner.toLowerCase())) {
        ownerScore = Math.min(ownerScore, 1);
        ownerFeedback = `Mismatched owner for ${expItem.task}; expected ${expItem.owner}.`;
      }
    }
  }
  criteria.push({
    criterion: 'Owner Identification Accuracy',
    score: ownerScore as 0 | 1 | 2,
    max_score: 2,
    feedback: ownerFeedback
  });

  // Criterion 5: Deadline accuracy
  let deadlineScore = 2;
  let deadlineFeedback = 'Deadlines matched expected dates; missing deadlines kept null.';
  let deadlineHallucination = false;

  for (const expItem of expected.action_items) {
    const actMatch = actual.action_items.find((a) =>
      a.task.toLowerCase().includes(expItem.task.toLowerCase().slice(0, 15)) ||
      expItem.task.toLowerCase().includes(a.task.toLowerCase().slice(0, 15))
    );

    if (expItem.deadline === null) {
      if (actMatch && actMatch.deadline !== null) {
        deadlineHallucination = true;
        deadlineScore = 0;
        deadlineFeedback = `Hallucinated deadline '${actMatch.deadline}' for open task without date.`;
        break;
      }
    } else if (expItem.deadline) {
      if (!actMatch || !actMatch.deadline || !actMatch.deadline.includes(expItem.deadline)) {
        deadlineScore = Math.min(deadlineScore, 1);
        deadlineFeedback = `Deadline discrepancy for ${expItem.task}; expected ${expItem.deadline}.`;
      }
    }
  }
  criteria.push({
    criterion: 'Deadline Accuracy',
    score: deadlineScore as 0 | 1 | 2,
    max_score: 2,
    feedback: deadlineFeedback
  });

  // Criterion 6: Evidence and factual consistency
  const itemsWithEvidence = actual.action_items.filter(
    (a) => a.source_evidence && a.source_evidence.trim().length > 10
  ).length;
  let evidenceScore = 2;
  let evidenceFeedback = 'Strong verbatim citation evidence for extracted items.';
  if (promptVersion === 'v1') {
    evidenceScore = itemsWithEvidence > 0 ? 1 : 0;
    evidenceFeedback = 'Prompt v1 lacks grounded evidence validation.';
  } else if (itemsWithEvidence < actual.action_items.length) {
    evidenceScore = itemsWithEvidence > 0 ? 1 : 0;
    evidenceFeedback = `Only ${itemsWithEvidence}/${actual.action_items.length} items have supporting evidence citations.`;
  }
  criteria.push({
    criterion: 'Evidence & Factual Consistency',
    score: evidenceScore as 0 | 1 | 2,
    max_score: 2,
    feedback: evidenceFeedback
  });

  // Criterion 7: Handling of missing information
  let missingScore = 2;
  let missingFeedback = 'Properly flagged missing owners, deadlines, or unresolved conflicts.';
  const hasExpectedMissing = expected.missing_information.length > 0;
  const hasActualMissing = actual.missing_information.length > 0;

  if (hasExpectedMissing && !hasActualMissing) {
    missingScore = 0;
    missingFeedback = 'Failed to report unassigned tasks or ambiguous debates.';
  } else if (!hasExpectedMissing && hasActualMissing) {
    missingScore = 2; // Extra caution is good
  } else {
    missingScore = 2;
    missingFeedback = 'Properly recorded missing information and unresolved discussions.';
  }
  criteria.push({
    criterion: 'Handling of Missing Information',
    score: missingScore as 0 | 1 | 2,
    max_score: 2,
    feedback: missingFeedback
  });

  // Calculate totals
  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);
  const maxScore = criteria.length * 2; // 14
  const percentage = Math.round((totalScore / maxScore) * 100);
  const evaluationStatus: 'pass' | 'fail' = totalScore >= 10 && !ownerHallucination && !deadlineHallucination ? 'pass' : 'fail';

  return {
    id: uuidv4(),
    meeting_id: meetingId,
    prompt_version: promptVersion,
    test_case_name: testCaseName,
    expected_result: expected,
    actual_result: actual,
    evaluation_score: totalScore,
    evaluation_status: evaluationStatus,
    evaluation_details: {
      criteria_scores: criteria,
      total_score: totalScore,
      max_score: maxScore,
      percentage,
      hallucination_detected: ownerHallucination || deadlineHallucination,
      missing_info_accuracy: missingScore > 0
    },
    created_at: new Date().toISOString()
  };
}

export function validateGeneralMeetingOutput(output: StructuredMeetingOutput): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!output.meeting_summary || output.meeting_summary.trim().length < 10) {
    errors.push('Meeting summary is missing or too short.');
  }

  if (!Array.isArray(output.action_items)) {
    errors.push('Action items must be an array.');
  } else {
    output.action_items.forEach((item, i) => {
      if (!item.task || item.task.trim().length === 0) {
        errors.push(`Action item #${i + 1} has an empty task description.`);
      }
      if (item.owner === null) {
        warnings.push(`Task "${item.task}" has no assigned owner.`);
      }
      if (item.deadline === null) {
        warnings.push(`Task "${item.task}" has no specified deadline.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
