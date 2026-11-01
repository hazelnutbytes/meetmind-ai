import React, { useState, useEffect } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Code2,
  Server,
  Database,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { AutomationLog, Meeting } from '../types';

export const AutomationLogs: React.FC = () => {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logList, meetingList] = await Promise.all([
        api.getAutomationLogs(),
        api.getMeetings()
      ]);
      setLogs(logList);
      setMeetings(meetingList);
      if (meetingList.length > 0 && !selectedMeetingId) {
        setSelectedMeetingId(meetingList[0].id);
      }
    } catch (err) {
      console.error('Failed to load automation logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerTest = async () => {
    if (!selectedMeetingId) {
      alert('Please select a meeting to trigger.');
      return;
    }

    try {
      setTriggering(true);
      const result = await api.triggerAutomationTest(selectedMeetingId);
      await loadData();
      alert(`Automation executed: ${result.message}`);
    } catch (err: any) {
      alert(`Automation error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-terracotta/10 text-terracotta text-xs font-semibold mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Event-Driven Architecture</span>
          </div>
          <h1 className="font-serif text-3xl text-charcoal">
            Supabase Database Webhook & Edge Function Automation
          </h1>
          <p className="text-sm text-charcoal/70">
            Automated pipeline: Meeting processing status completed → Database Webhook → Edge Function → Action Tracker.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 bg-white hover:bg-ivory text-charcoal border border-sand px-4 py-2 rounded text-xs font-semibold shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Architecture Workflow Card */}
      <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-xl text-charcoal">Trigger-Action Automation Pipeline</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-ivory border border-sand space-y-2">
            <div className="flex items-center space-x-2 text-terracotta font-bold">
              <Database className="w-4 h-4" />
              <span>1. Database Event</span>
            </div>
            <p className="text-charcoal/70">
              Meeting record in table <code className="font-mono bg-white px-1 py-0.5 rounded">meetings</code> updates its <code className="font-mono bg-white px-1 py-0.5 rounded">processing_status</code> to <code className="font-mono text-sage font-bold">'completed'</code>.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-ivory border border-sand space-y-2">
            <div className="flex items-center space-x-2 text-gold font-bold">
              <Zap className="w-4 h-4" />
              <span>2. Webhook Dispatch</span>
            </div>
            <p className="text-charcoal/70">
              Supabase Database Webhook fires an authenticated HTTP POST payload to the Edge Function <code className="font-mono bg-white px-1 py-0.5 rounded">process-automation</code>.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-ivory border border-sand space-y-2">
            <div className="flex items-center space-x-2 text-sage font-bold">
              <Server className="w-4 h-4" />
              <span>3. Edge Function Action</span>
            </div>
            <p className="text-charcoal/70">
              Edge function validates meeting, prevents duplicate tasks with idempotency constraints, and synchronizes deliverables into the Action Tracker.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-ivory border border-sand space-y-2">
            <div className="flex items-center space-x-2 text-charcoal font-bold">
              <CheckCircle2 className="w-4 h-4 text-sage" />
              <span>4. Execution Audit Log</span>
            </div>
            <p className="text-charcoal/70">
              A permanent execution telemetry record is written to <code className="font-mono bg-white px-1 py-0.5 rounded">automation_logs</code> with task counts and execution timestamps.
            </p>
          </div>
        </div>

        {/* Live trigger demonstration form */}
        <div className="mt-4 pt-4 border-t border-sand flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <label className="text-xs font-semibold text-charcoal shrink-0">
              Simulate / Re-trigger Automation:
            </label>
            <select
              value={selectedMeetingId}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              className="px-3 py-1.5 border border-sand rounded bg-ivory-light text-xs text-charcoal focus:outline-none"
            >
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.meeting_date})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTriggerTest}
            disabled={triggering || !selectedMeetingId}
            className="flex items-center space-x-2 bg-terracotta hover:bg-terracotta-hover disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{triggering ? 'Dispatching Event...' : 'Trigger Webhook Workflow'}</span>
          </button>
        </div>
      </div>

      {/* Execution Logs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-charcoal">
            Audit Telemetry Logs ({logs.length} Recorded)
          </h2>
          <span className="text-xs text-charcoal/50">
            Persisted in Supabase <code className="font-mono">automation_logs</code>
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white border border-sand rounded-xl p-12 text-center space-y-2">
            <Zap className="w-8 h-8 text-sand-dark mx-auto" />
            <h3 className="font-serif text-lg text-charcoal">No automation logs recorded yet</h3>
            <p className="text-xs text-charcoal/60">
              Submit a meeting transcript or click "Trigger Webhook Workflow" above to create an execution log.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isSuccess = log.execution_status === 'success';

              return (
                <div
                  key={log.id}
                  className="bg-white border border-sand rounded-xl p-5 shadow-sm space-y-3 hover:border-terracotta/40 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isSuccess
                            ? 'bg-sage-light text-sage'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-charcoal">
                          {log.event_type}
                        </div>
                        <div className="text-[10px] text-charcoal/50 font-mono">
                          ID: {log.id}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isSuccess
                            ? 'bg-sage-light text-sage'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {log.execution_status}
                      </span>
                      <span className="text-charcoal/50 text-[11px]">
                        {new Date(log.executed_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sand">
                    <span className="text-[10px] uppercase font-semibold text-charcoal/50 block mb-1">
                      Execution Payload & Evidence:
                    </span>
                    <pre className="p-3 rounded bg-ivory text-[11px] font-mono text-charcoal/80 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(log.execution_details, null, 2)}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
