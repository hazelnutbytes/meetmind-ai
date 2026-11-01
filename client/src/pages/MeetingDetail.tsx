import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  Trash2,
  Quote,
  ShieldCheck,
  Zap,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Meeting, MeetingMinutes, ActionItem, AutomationLog } from '../types';

interface MeetingDetailProps {
  meetingId: string;
  onBack: () => void;
  onViewTaskInTracker: () => void;
}

export const MeetingDetail: React.FC<MeetingDetailProps> = ({
  meetingId,
  onBack,
  onViewTaskInTracker
}) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable state
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'minutes' | 'actions' | 'transcript' | 'automation'>('minutes');

  useEffect(() => {
    loadMeetingData();
  }, [meetingId]);

  const loadMeetingData = async () => {
    try {
      setLoading(true);
      const data = await api.getMeeting(meetingId);
      setMeeting(data.meeting);
      setMinutes(data.minutes);
      setActionItems(data.action_items);
      setAutomationLogs(data.automation_logs || []);
      if (data.minutes) {
        setEditedSummary(data.minutes.summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load meeting details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMinutes = async () => {
    if (!minutes) return;
    try {
      setIsSaving(true);
      const updated = await api.updateMeetingMinutes(meetingId, {
        summary: editedSummary
      });
      setMinutes(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(`Failed to save changes: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTaskStatus = async (item: ActionItem) => {
    const nextStatus =
      item.status === 'completed'
        ? 'pending'
        : item.status === 'pending'
        ? 'in_progress'
        : 'completed';

    try {
      const updated = await api.updateAction(item.id, { status: nextStatus });
      setActionItems((prev) => prev.map((a) => (a.id === item.id ? updated : a)));
    } catch (err: any) {
      alert(`Failed to update task: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-charcoal/60">Retrieving structured meeting record...</span>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error || 'Meeting not found.'}
        </div>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-terracotta"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to meeting archives</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-sand">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-charcoal/70 hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Meetings</span>
        </button>

        <div className="flex items-center space-x-3">
          {activeTab === 'minutes' && (
            <>
              {isEditing ? (
                <button
                  onClick={handleSaveMinutes}
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 bg-sage hover:bg-sage-hover text-white px-3.5 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Corrections'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1.5 bg-white hover:bg-ivory text-charcoal border border-sand px-3.5 py-1.5 rounded text-xs font-semibold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-terracotta" />
                  <span>Edit Summary (Human Review)</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={onViewTaskInTracker}
            className="flex items-center space-x-1.5 bg-terracotta hover:bg-terracotta-hover text-white px-3.5 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Open in Action Tracker</span>
          </button>
        </div>
      </div>

      {/* 1. Meeting Overview Header */}
      <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sage-light text-sage">
                {meeting.processing_status}
              </span>
              <span className="text-xs text-charcoal/50">ID: {meeting.id}</span>
            </div>
            <h1 className="font-serif text-3xl text-charcoal">{meeting.title}</h1>
          </div>

          <div className="flex items-center space-x-6 text-xs text-charcoal/70">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-terracotta" />
              <div>
                <div className="text-[10px] text-charcoal/40 uppercase">Meeting Date</div>
                <div className="font-medium text-charcoal">{meeting.meeting_date}</div>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-gold" />
              <div>
                <div className="text-[10px] text-charcoal/40 uppercase">Processed At</div>
                <div className="font-medium text-charcoal">
                  {new Date(meeting.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-6 border-t border-sand pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('minutes')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'minutes'
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-charcoal/60 hover:text-charcoal'
            }`}
          >
            Minutes & Decisions
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`pb-2 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'actions'
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-charcoal/60 hover:text-charcoal'
            }`}
          >
            <span>Extracted Action Items</span>
            <span className="px-1.5 py-0.2 bg-sand text-charcoal rounded-full text-[10px]">
              {actionItems.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'transcript'
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-charcoal/60 hover:text-charcoal'
            }`}
          >
            Original Transcript
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`pb-2 border-b-2 transition-colors flex items-center space-x-1 ${
              activeTab === 'automation'
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-charcoal/60 hover:text-charcoal'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Automation Execution ({automationLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Minutes, Decisions & Discussion Points */}
      {activeTab === 'minutes' && minutes && (
        <div className="space-y-6">
          {/* Missing Information / Ambiguity Alert Banner */}
          {minutes.missing_information && minutes.missing_information.length > 0 && (
            <div className="p-4 rounded-lg bg-gold-light border border-gold/40 text-charcoal space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-gold">
                <AlertCircle className="w-4 h-4" />
                <span>Notice: Ambiguities or Missing Information Flagged</span>
              </div>
              <ul className="list-disc list-inside text-xs text-charcoal/80 space-y-1 pl-1">
                {minutes.missing_information.map((info, idx) => (
                  <li key={idx}>{info}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. Executive Summary */}
          <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-charcoal">Executive Summary</h3>
              <span className="text-[11px] text-charcoal/50 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sage" />
                <span>Audit Verified</span>
              </span>
            </div>

            {isEditing ? (
              <textarea
                rows={4}
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="w-full p-3 border border-sand rounded bg-ivory text-sm leading-relaxed focus:outline-none focus:border-terracotta"
              />
            ) : (
              <p className="text-sm text-charcoal/80 leading-relaxed font-sans">
                {minutes.summary}
              </p>
            )}
          </div>

          {/* 3. Key Discussion Points */}
          <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-xl text-charcoal">Key Discussion Points</h3>
            <ul className="space-y-2.5">
              {minutes.key_discussion_points.map((point, index) => (
                <li key={index} className="flex items-start space-x-3 text-sm text-charcoal/80">
                  <span className="w-2 h-2 rounded-full bg-terracotta shrink-0 mt-2"></span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Confirmed Decisions */}
          <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl text-charcoal">Ratified Decisions</h3>
                <p className="text-xs text-charcoal/60">
                  Only consensus decisions accepted by participants (unconfirmed suggestions excluded)
                </p>
              </div>
              <span className="text-xs font-semibold text-sage bg-sage-light px-2.5 py-1 rounded-full">
                {minutes.decisions.length} Confirmed
              </span>
            </div>

            {minutes.decisions.length === 0 ? (
              <div className="p-4 rounded border border-sand bg-ivory text-xs text-charcoal/60 italic">
                No final decisions were ratified during this meeting session. All proposals remained open or tabled.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {minutes.decisions.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-sand bg-ivory-light space-y-2"
                  >
                    <div className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                      <h4 className="text-sm font-bold text-charcoal leading-snug">
                        {d.decision}
                      </h4>
                    </div>
                    {d.context && (
                      <p className="text-xs text-charcoal/70 pl-6 leading-relaxed">
                        <span className="font-medium text-charcoal/60">Consensus Context:</span> {d.context}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Extracted Action Items */}
      {activeTab === 'actions' && (
        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sand">
            <div>
              <h3 className="font-serif text-xl text-charcoal">Action Items & Deliverables</h3>
              <p className="text-xs text-charcoal/60">
                Tasks extracted directly with verbatim citation evidence and null-safe attributes.
              </p>
            </div>
            <button
              onClick={onViewTaskInTracker}
              className="text-xs text-terracotta font-semibold hover:underline"
            >
              Manage in Kanban View →
            </button>
          </div>

          {actionItems.length === 0 ? (
            <div className="py-12 text-center text-charcoal/50 text-sm">
              No action items extracted for this meeting.
            </div>
          ) : (
            <div className="divide-y divide-sand">
              {actionItems.map((item) => (
                <div key={item.id} className="py-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleToggleTaskStatus(item)}
                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors ${
                          item.status === 'completed'
                            ? 'bg-sage border-sage text-white'
                            : item.status === 'in_progress'
                            ? 'bg-gold-light border-gold text-gold'
                            : 'border-sand-dark hover:border-charcoal'
                        }`}
                      >
                        {item.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {item.status === 'in_progress' && <span className="w-2 h-2 rounded-full bg-gold" />}
                      </button>
                      <div>
                        <span
                          className={`text-sm font-semibold ${
                            item.status === 'completed'
                              ? 'line-through text-charcoal/50'
                              : 'text-charcoal'
                          }`}
                        >
                          {item.task_description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : item.priority === 'medium'
                            ? 'bg-gold-light text-gold'
                            : 'bg-sand text-charcoal'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === 'completed'
                            ? 'bg-sage-light text-sage'
                            : item.status === 'in_progress'
                            ? 'bg-gold-light text-gold'
                            : 'bg-ivory text-charcoal/70 border border-sand'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Attributes: Owner, Deadline & Source Evidence */}
                  <div className="pl-8 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-charcoal/70">
                    <div className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-terracotta" />
                      <span className="text-charcoal/50">Owner:</span>
                      <span
                        className={`font-medium ${
                          item.owner ? 'text-charcoal' : 'text-gold italic font-normal'
                        }`}
                      >
                        {item.owner ? item.owner : 'Unassigned (No Owner Found)'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-gold" />
                      <span className="text-charcoal/50">Deadline:</span>
                      <span
                        className={`font-medium ${
                          item.deadline ? 'text-charcoal' : 'text-gold italic font-normal'
                        }`}
                      >
                        {item.deadline ? item.deadline : 'No Deadline Specified'}
                      </span>
                    </div>

                    {item.source_evidence && (
                      <div className="md:col-span-3 mt-1 p-2 rounded bg-ivory border border-sand/60 text-[11px] text-charcoal/70 flex items-start space-x-2">
                        <Quote className="w-3.5 h-3.5 text-terracotta shrink-0 mt-0.5" />
                        <span className="italic">"{item.source_evidence}"</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Original Transcript */}
      {activeTab === 'transcript' && (
        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-sand">
            <div>
              <h3 className="font-serif text-xl text-charcoal">Raw Meeting Transcript</h3>
              <p className="text-xs text-charcoal/60">
                Permanently saved in Supabase PostgreSQL (meetings.transcript)
              </p>
            </div>
          </div>
          <pre className="p-4 rounded-lg bg-ivory-light border border-sand text-xs font-mono text-charcoal leading-relaxed whitespace-pre-wrap overflow-x-auto">
            {meeting.transcript}
          </pre>
        </div>
      )}

      {/* Tab 4: Automation Execution Logs */}
      {activeTab === 'automation' && (
        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sand">
            <div>
              <h3 className="font-serif text-xl text-charcoal">Trigger-Action Automation Evidence</h3>
              <p className="text-xs text-charcoal/60">
                Supabase Database Webhook & Edge Function execution telemetry
              </p>
            </div>
          </div>

          {automationLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-charcoal/50">
              No automation logs recorded for this meeting.
            </div>
          ) : (
            <div className="space-y-4">
              {automationLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg border border-sand bg-ivory-light space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-terracotta" />
                      <span className="text-xs font-bold text-charcoal font-mono">
                        {log.event_type}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sage-light text-sage">
                      {log.execution_status}
                    </span>
                  </div>

                  <div className="text-xs text-charcoal/60">
                    Executed at: {new Date(log.executed_at).toLocaleString()}
                  </div>

                  <pre className="p-3 rounded bg-white border border-sand text-[11px] font-mono text-charcoal/80 overflow-x-auto">
                    {JSON.stringify(log.execution_details, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
