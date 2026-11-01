import React, { useState, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  AlertCircle,
  HelpCircle,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { PromptVersion, TestCase } from '../types';
import { ProcessingStepper, StageInfo } from '../components/ProcessingStepper';

interface NewMeetingProps {
  onMeetingProcessed: (meetingId: string) => void;
}

export const NewMeeting: React.FC<NewMeetingProps> = ({ onMeetingProcessed }) => {
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [transcript, setTranscript] = useState('');
  const [promptVersion, setPromptVersion] = useState<PromptVersion>('v3');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedMeetingId, setFailedMeetingId] = useState<string | null>(null);

  const initialStages: StageInfo[] = [
    {
      step: 1,
      title: 'Transcript Ingestion',
      description: 'Validate input and persist raw transcript in Supabase PostgreSQL.',
      status: 'pending'
    },
    {
      step: 2,
      title: 'Gemini AI Extraction',
      description: 'Isolate verified decisions, tasks, owners, and dates via LLM prompt.',
      status: 'pending'
    },
    {
      step: 3,
      title: 'Validation & Structuring',
      description: 'Run 7-point evaluation rubric and verify schema integrity.',
      status: 'pending'
    },
    {
      step: 4,
      title: 'Storage & Automation',
      description: 'Store minutes, trigger database webhook, and log execution.',
      status: 'pending'
    }
  ];

  const [stages, setStages] = useState<StageInfo[]>(initialStages);

  useEffect(() => {
    loadTestCases();
  }, []);

  const loadTestCases = async () => {
    try {
      const cases = await api.getTestCases();
      setTestCases(cases);
    } catch (err) {
      console.warn('Failed to load sample test cases:', err);
    }
  };

  const handleSelectSample = (caseId: string) => {
    setSelectedTestCaseId(caseId);
    const tc = testCases.find((c) => c.id === caseId);
    if (tc) {
      setTitle(tc.meeting_title);
      setMeetingDate(tc.meeting_date);
      setTranscript(tc.transcript);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(txt|md|text)$/i)) {
      alert('Please upload a plain text or markdown file (.txt, .md).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTranscript(content);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    };
    reader.readAsText(file);
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const charCount = transcript.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transcript.trim()) {
      setErrorMessage('Please enter or upload a meeting transcript.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    // Stage 1 active
    setStages((prev) => [
      { ...prev[0], status: 'active' },
      { ...prev[1], status: 'pending' },
      { ...prev[2], status: 'pending' },
      { ...prev[3], status: 'pending' }
    ]);

    try {
      // Simulate real visual feedback as server runs
      setTimeout(() => {
        setStages((prev) => [
          { ...prev[0], status: 'completed' },
          { ...prev[1], status: 'active' },
          { ...prev[2], status: 'pending' },
          { ...prev[3], status: 'pending' }
        ]);
      }, 400);

      const result = await api.submitMeeting({
        title: title.trim() || 'Untitled Meeting',
        meeting_date: meetingDate,
        transcript: transcript.trim(),
        prompt_version: promptVersion
      });

      // Stages completed
      setStages([
        { ...initialStages[0], status: 'completed' },
        { ...initialStages[1], status: 'completed' },
        { ...initialStages[2], status: 'completed' },
        { ...initialStages[3], status: 'completed' }
      ]);

      setTimeout(() => {
        onMeetingProcessed(result.meeting.id);
      }, 600);
    } catch (err: any) {
      console.error('Submission error:', err);
      setFailedMeetingId(err.meetingId || null);
      setErrorMessage(err.message || 'Gemini is temporarily unavailable. Please try again.');
      setStages((prev) =>
        prev.map((s) => (s.status === 'active' ? { ...s, status: 'failed' } : s))
      );
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (!failedMeetingId) {
      handleSubmit(new Event('submit') as any);
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    // Keep stage 1 completed, stage 2 active
    setStages([
      { ...initialStages[0], status: 'completed' },
      { ...initialStages[1], status: 'active' },
      { ...initialStages[2], status: 'pending' },
      { ...initialStages[3], status: 'pending' }
    ]);

    try {
      const result = await api.retryMeeting(failedMeetingId, promptVersion);

      setStages([
        { ...initialStages[0], status: 'completed' },
        { ...initialStages[1], status: 'completed' },
        { ...initialStages[2], status: 'completed' },
        { ...initialStages[3], status: 'completed' }
      ]);

      setTimeout(() => {
        onMeetingProcessed(result.meeting.id);
      }, 600);
    } catch (err: any) {
      console.error('Retry error:', err);
      setErrorMessage(err.message || 'Gemini is temporarily unavailable. Please try again.');
      setStages((prev) =>
        prev.map((s) => (s.status === 'active' ? { ...s, status: 'failed' } : s))
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Heading */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl text-charcoal">Process Meeting Transcript</h1>
        <p className="text-sm text-charcoal/70">
          Upload or paste unstructured meeting dialogues. MeetMind AI extracts ratified decisions,
          generates an audit-ready executive summary, maps action items, and triggers database automation.
        </p>
      </div>

      {/* Stepper display during or after processing */}
      {(isProcessing || errorMessage) && (
        <ProcessingStepper
          stages={stages}
          errorMessage={errorMessage || undefined}
          onRetry={handleRetry}
          isRetrying={isProcessing}
        />
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-6">
          {/* Quick Sample Selector */}
          <div className="p-4 rounded-lg bg-ivory border border-sand space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-charcoal flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-terracotta" />
                <span>Load Predefined Test Case Transcript (1-Click Demo)</span>
              </span>
              <span className="text-[11px] text-charcoal/50">Evaluation scenarios</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {testCases.map((tc) => (
                <button
                  type="button"
                  key={tc.id}
                  onClick={() => handleSelectSample(tc.id)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    selectedTestCaseId === tc.id
                      ? 'bg-terracotta text-white border-terracotta font-medium shadow-xs'
                      : 'bg-white hover:bg-ivory text-charcoal border-sand hover:border-charcoal/30'
                  }`}
                >
                  {tc.id}: {tc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Date Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-charcoal flex items-center justify-between">
                <span>Meeting Title</span>
                <span className="text-charcoal/40 font-normal">e.g. Q3 Launch Sync</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter descriptive meeting subject..."
                className="w-full px-3.5 py-2 border border-sand rounded bg-ivory-light text-sm focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta"
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-charcoal flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-terracotta" />
                <span>Meeting Reference Date</span>
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-sand rounded bg-ivory-light text-sm focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Prompt Version Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>Select Extraction Prompt Version</span>
              </span>
              <span className="text-[11px] text-charcoal/50">Benchmark comparison available</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                onClick={() => !isProcessing && setPromptVersion('v1')}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  promptVersion === 'v1'
                    ? 'border-terracotta bg-terracotta-light/40 ring-1 ring-terracotta'
                    : 'border-sand hover:border-charcoal/30 bg-ivory-light'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-charcoal">v1 – Basic Extraction</span>
                  {promptVersion === 'v1' && <Check className="w-3.5 h-3.5 text-terracotta" />}
                </div>
                <p className="text-[11px] text-charcoal/60 leading-tight">
                  Standard baseline prompt. May occasionally hallucinate missing owners/dates.
                </p>
              </div>

              <div
                onClick={() => !isProcessing && setPromptVersion('v2')}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  promptVersion === 'v2'
                    ? 'border-terracotta bg-terracotta-light/40 ring-1 ring-terracotta'
                    : 'border-sand hover:border-charcoal/30 bg-ivory-light'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-charcoal">v2 – Structured JSON</span>
                  {promptVersion === 'v2' && <Check className="w-3.5 h-3.5 text-terracotta" />}
                </div>
                <p className="text-[11px] text-charcoal/60 leading-tight">
                  Structured prompt with negative rules for missing data; separates suggestions.
                </p>
              </div>

              <div
                onClick={() => !isProcessing && setPromptVersion('v3')}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  promptVersion === 'v3'
                    ? 'border-terracotta bg-terracotta-light/40 ring-1 ring-terracotta'
                    : 'border-sand hover:border-charcoal/30 bg-ivory-light'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-terracotta">
                    v3 – Master Evidence (Recommended)
                  </span>
                  {promptVersion === 'v3' && <Check className="w-3.5 h-3.5 text-terracotta" />}
                </div>
                <p className="text-[11px] text-charcoal/60 leading-tight">
                  Zero hallucination policy, verbatim quotes, handles contradictions (14/14 benchmark).
                </p>
              </div>
            </div>
          </div>

          {/* Transcript Input Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-charcoal flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-terracotta" />
                <span>Conversation Transcript</span>
              </label>

              <div className="flex items-center space-x-3 text-xs text-charcoal/60">
                <label className="cursor-pointer hover:text-terracotta flex items-center space-x-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .txt/.md file</span>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </label>
              </div>
            </div>

            <textarea
              rows={12}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste dialogue transcript here, for example:
Sarah: Let's finalize the launch date for Nov 10th.
Alex: I agree. I will finalize developer documentation by Nov 1st.
David: I will draft the press release by Oct 25th..."
              className="w-full p-4 border border-sand rounded bg-ivory-light text-sm font-mono leading-relaxed focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta"
              disabled={isProcessing}
            ></textarea>

            <div className="flex items-center justify-between text-[11px] text-charcoal/50">
              <span className="flex items-center space-x-2">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} characters</span>
              </span>
              <span>Supported formats: Plain text, Zoom/Teams/Meet transcripts, Markdown</span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setTranscript('');
              setTitle('');
              setSelectedTestCaseId('');
            }}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-charcoal/70 hover:text-charcoal transition-colors"
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={isProcessing || !transcript.trim()}
            className="flex items-center space-x-2 bg-terracotta hover:bg-terracotta-hover disabled:opacity-50 text-white px-6 py-2.5 rounded text-xs font-semibold shadow-sm transition-all"
          >
            {isProcessing ? (
              <span>Executing 4-Stage Pipeline...</span>
            ) : (
              <>
                <span>Run Intelligent Extraction</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
