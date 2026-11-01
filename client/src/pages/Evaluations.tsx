import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Play,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck2
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationRecord, PromptVersion, TestCase } from '../types';

export const Evaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedPromptVersion, setSelectedPromptVersion] = useState<PromptVersion>('v3');
  const [running, setRunning] = useState(false);
  const [selectedEvalDetail, setSelectedEvalDetail] = useState<EvaluationRecord | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [evals, cases] = await Promise.all([
        api.getEvaluations(),
        api.getTestCases()
      ]);
      setEvaluations(evals);
      setTestCases(cases);
    } catch (err) {
      console.error('Failed to load evaluation records:', err);
    }
  };

  const handleRunEvaluation = async (version: PromptVersion, forceLive: boolean = false) => {
    try {
      setRunning(true);
      await api.runEvaluations(version, undefined, forceLive);
      await loadData();
    } catch (err: any) {
      alert(`Evaluation run failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  // Filter evaluations for the selected prompt version tab
  const versionEvaluations = evaluations.filter(
    (e) => e.prompt_version === selectedPromptVersion
  );

  // Group by test case name to get the latest run for each test case
  const latestByTestCase = new Map<string, EvaluationRecord>();
  for (const ev of versionEvaluations) {
    if (!latestByTestCase.has(ev.test_case_name)) {
      latestByTestCase.set(ev.test_case_name, ev);
    }
  }

  const displayedRecords = Array.from(latestByTestCase.values());

  const totalScore = displayedRecords.reduce((sum, r) => sum + r.evaluation_score, 0);
  const maxPossible = displayedRecords.length * 14;
  const averagePercentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
  const passedCount = displayedRecords.filter((r) => r.evaluation_status === 'pass').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-terracotta/10 text-terracotta text-xs font-semibold mb-1">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Audit & Verification Framework</span>
          </div>
          <h1 className="font-serif text-3xl text-charcoal">
            Prompt Engineering & Output Validation
          </h1>
          <p className="text-sm text-charcoal/70">
            Evaluating 3 prompt versions across 5 mandatory test cases using a strict 7-criterion rubric (0–14 points).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleRunEvaluation(selectedPromptVersion, false)}
            disabled={running}
            className="flex items-center space-x-2 bg-white hover:bg-ivory text-charcoal border border-sand px-4 py-2 rounded text-xs font-semibold shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-terracotta" />
            <span>{running ? 'Evaluating...' : `Run Benchmark (${selectedPromptVersion.toUpperCase()})`}</span>
          </button>

          <button
            onClick={() => handleRunEvaluation(selectedPromptVersion, true)}
            disabled={running}
            className="flex items-center space-x-2 bg-terracotta hover:bg-terracotta-hover text-white px-4 py-2 rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{running ? 'Running...' : 'Run with Live Gemini API'}</span>
          </button>
        </div>
      </div>

      {/* Prompt Version Comparison Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            version: 'v1',
            title: 'Version 1 – Basic Extraction',
            description: 'Direct baseline prompt without anti-hallucination guardrails.',
            expectedGrade: 'Partial (8-12/14)',
            passRate: '40%'
          },
          {
            version: 'v2',
            title: 'Version 2 – Structured JSON',
            description: 'Explicit instructions and negative rules against inventing missing values.',
            expectedGrade: 'High (12-14/14)',
            passRate: '80%'
          },
          {
            version: 'v3',
            title: 'Version 3 – Evidence-Based Master',
            description: 'Ground-truth evidence citations, resolves conflicting dates, zero hallucination.',
            expectedGrade: 'Perfect (14/14)',
            passRate: '100%'
          }
        ].map((v) => {
          const isSelected = selectedPromptVersion === v.version;
          return (
            <div
              key={v.version}
              onClick={() => setSelectedPromptVersion(v.version as PromptVersion)}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-white border-terracotta ring-1 ring-terracotta shadow-sm'
                  : 'bg-white/70 border-sand hover:border-charcoal/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-terracotta uppercase tracking-wider">
                  {v.version.toUpperCase()}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    v.version === 'v3'
                      ? 'bg-sage-light text-sage'
                      : v.version === 'v2'
                      ? 'bg-gold-light text-gold'
                      : 'bg-sand text-charcoal'
                  }`}
                >
                  Benchmark: {v.expectedGrade}
                </span>
              </div>
              <h3 className="font-serif text-lg text-charcoal mb-1">{v.title}</h3>
              <p className="text-xs text-charcoal/70 leading-relaxed">{v.description}</p>
            </div>
          );
        })}
      </div>

      {/* Current Version Summary Card */}
      <div className="bg-white border border-sand rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-charcoal/50">
            Active Prompt Evaluation Suite: {selectedPromptVersion.toUpperCase()}
          </div>
          <div className="font-serif text-2xl text-charcoal">
            {passedCount} of {displayedRecords.length || 5} Test Scenarios Passed
          </div>
          <p className="text-xs text-charcoal/60">
            Scores evaluated across all 7 criteria (Summary, Decisions, Completeness, Owner, Deadline, Evidence, Missing Info).
          </p>
        </div>

        <div className="flex items-center space-x-8 text-center shrink-0">
          <div>
            <div className="font-serif text-3xl text-charcoal font-semibold">
              {totalScore}/{maxPossible || 70}
            </div>
            <div className="text-[10px] uppercase font-bold text-charcoal/50">Total Points</div>
          </div>
          <div className="w-px h-10 bg-sand"></div>
          <div>
            <div
              className={`font-serif text-3xl font-semibold ${
                averagePercentage >= 90
                  ? 'text-sage'
                  : averagePercentage >= 70
                  ? 'text-gold'
                  : 'text-terracotta'
              }`}
            >
              {averagePercentage}%
            </div>
            <div className="text-[10px] uppercase font-bold text-charcoal/50">
              Accuracy Rate
            </div>
          </div>
        </div>
      </div>

      {/* 5 Test Cases Detailed Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-charcoal">
            Predefined Test Case Results ({selectedPromptVersion.toUpperCase()})
          </h2>
          <span className="text-xs text-charcoal/50">
            Showing latest execution record per test case
          </span>
        </div>

        {displayedRecords.length === 0 ? (
          <div className="bg-white border border-sand rounded-xl p-12 text-center space-y-3">
            <FlaskConical className="w-8 h-8 text-terracotta mx-auto" />
            <h3 className="font-serif text-lg text-charcoal">
              No evaluation runs recorded for {selectedPromptVersion.toUpperCase()} yet
            </h3>
            <p className="text-xs text-charcoal/60 max-w-md mx-auto">
              Click "Run Benchmark ({selectedPromptVersion.toUpperCase()})" above to evaluate all 5 test scenarios.
            </p>
            <button
              onClick={() => handleRunEvaluation(selectedPromptVersion, false)}
              className="inline-flex items-center space-x-1.5 bg-terracotta text-white px-4 py-2 rounded text-xs font-semibold"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Benchmark Suite Now</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedRecords.map((r) => {
              const isExpanded = expandedId === r.id;
              const isPassed = r.evaluation_status === 'pass';
              const isEdgeCase = r.test_case_name.toLowerCase().includes('edge');

              return (
                <div
                  key={r.id}
                  className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Card Header Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-ivory/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {isPassed ? (
                          <span className="flex items-center space-x-1 text-sage font-bold text-xs bg-sage-light px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PASS</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-red-700 font-bold text-xs bg-red-100 px-2.5 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>FAIL</span>
                          </span>
                        )}

                        {isEdgeCase && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gold-light text-gold border border-gold/30">
                            Edge Case Scenario
                          </span>
                        )}

                        <span className="text-xs font-serif text-charcoal font-semibold">
                          {r.test_case_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-xs font-bold text-charcoal">
                          {r.evaluation_score} / 14 pts ({r.evaluation_details.percentage}%)
                        </div>
                        <div className="text-[10px] text-charcoal/50">
                          {r.evaluation_details.hallucination_detected ? (
                            <span className="text-red-600 font-semibold">Hallucination Flagged</span>
                          ) : (
                            <span className="text-sage">Zero Hallucinations</span>
                          )}
                        </div>
                      </div>

                      <button className="text-charcoal/50 hover:text-charcoal p-1">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="p-5 border-t border-sand bg-ivory-light space-y-6">
                      {/* 7-Criteria Rubric Grid */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal mb-3">
                          Evaluation Rubric Score Breakdown (0–2 Scale)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {r.evaluation_details.criteria_scores.map((crit, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded bg-white border border-sand space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-charcoal truncate">
                                  {crit.criterion}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    crit.score === 2
                                      ? 'bg-sage-light text-sage'
                                      : crit.score === 1
                                      ? 'bg-gold-light text-gold'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {crit.score} / 2 pts
                                </span>
                              </div>
                              <p className="text-[10px] text-charcoal/70 leading-tight">
                                {crit.feedback}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Side by Side: Expected vs Actual Output */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-white border border-sand space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-sand">
                            <span className="text-xs font-bold text-charcoal flex items-center space-x-1.5">
                              <FileCheck2 className="w-3.5 h-3.5 text-sage" />
                              <span>Expected Ground Truth</span>
                            </span>
                            <span className="text-[10px] text-charcoal/40 font-mono">Reference</span>
                          </div>
                          <pre className="text-[11px] font-mono text-charcoal/80 overflow-x-auto max-h-60 whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(r.expected_result, null, 2)}
                          </pre>
                        </div>

                        <div className="p-4 rounded-lg bg-white border border-sand space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-sand">
                            <span className="text-xs font-bold text-charcoal flex items-center space-x-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                              <span>Actual AI Extraction Output</span>
                            </span>
                            <span className="text-[10px] text-charcoal/40 font-mono">Generated</span>
                          </div>
                          <pre className="text-[11px] font-mono text-charcoal/80 overflow-x-auto max-h-60 whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(r.actual_result, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
