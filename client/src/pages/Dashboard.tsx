import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Calendar,
  User,
  Sparkles,
  Zap,
  TrendingUp,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';

interface DashboardProps {
  onNewMeeting: () => void;
  onOpenMeeting: (id: string) => void;
  onViewActionTracker: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNewMeeting,
  onOpenMeeting,
  onViewActionTracker
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-charcoal/60 font-medium">Loading workspace metrics...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Meetings',
      value: stats?.totalMeetings || 0,
      icon: FileText,
      accent: 'border-charcoal/20 bg-white text-charcoal',
      description: 'Transcripts processed'
    },
    {
      label: 'Action Items',
      value: stats?.totalActions || 0,
      icon: TrendingUp,
      accent: 'border-terracotta/20 bg-terracotta-light/30 text-terracotta',
      description: 'Extracted deliverables'
    },
    {
      label: 'Pending Tasks',
      value: stats?.pendingTasks || 0,
      icon: Clock,
      accent: 'border-sand-dark bg-white text-charcoal',
      description: 'Active responsibilities'
    },
    {
      label: 'Completed Tasks',
      value: stats?.completedTasks || 0,
      icon: CheckCircle2,
      accent: 'border-sage/30 bg-sage-light/50 text-sage',
      description: 'Done & ratified'
    },
    {
      label: 'Overdue Tasks',
      value: stats?.overdueTasks || 0,
      icon: AlertTriangle,
      accent: 'border-gold/30 bg-gold-light text-gold',
      description: 'Past target deadline'
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Editorial Welcome Header */}
      <div className="bg-ivory border border-sand rounded-xl p-8 relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-sand/60 text-[11px] font-semibold text-charcoal tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-terracotta" />
            <span>Intelligent Meeting Workspace</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-charcoal leading-tight">
            Transform conversational chaos into structured clarity.
          </h1>
          <p className="text-sm text-charcoal/70 leading-relaxed font-sans">
            MeetMind AI analyzes meeting dialogues to isolate true consensus decisions,
            map actionable assignments, preserve ground-truth citations, and trigger automated task updates.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onNewMeeting}
              className="inline-flex items-center space-x-2 bg-terracotta hover:bg-terracotta-hover text-white px-4 py-2 rounded text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Process New Meeting</span>
            </button>
            <button
              onClick={onViewActionTracker}
              className="inline-flex items-center space-x-2 bg-white hover:bg-ivory text-charcoal border border-sand px-4 py-2 rounded text-xs font-semibold transition-colors"
            >
              <span>View Action Tracker</span>
              <ArrowRight className="w-3.5 h-3.5 text-charcoal/60" />
            </button>
          </div>
        </div>

        {/* Soft background watermark */}
        <div className="absolute -right-8 -bottom-10 opacity-5 pointer-events-none select-none">
          <Zap className="w-72 h-72 text-charcoal" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="bg-white border border-sand p-4 rounded-lg shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-charcoal/60">{c.label}</span>
                <div className={`p-1.5 rounded ${c.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="font-serif text-2xl md:text-3xl text-charcoal font-semibold">
                  {c.value}
                </span>
                <p className="text-[11px] text-charcoal/50 mt-1">{c.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Asymmetrical 2-Column Split: Recent Meetings & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Meetings (2 Cols wide) */}
        <div className="lg:col-span-2 bg-white border border-sand rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sand">
            <div>
              <h3 className="font-serif text-xl text-charcoal">Recent Meetings</h3>
              <p className="text-xs text-charcoal/60">
                Latest transcripts analyzed and persisted in database
              </p>
            </div>
            <button
              onClick={onNewMeeting}
              className="text-xs text-terracotta hover:underline font-medium flex items-center space-x-1"
            >
              <span>+ New Analysis</span>
            </button>
          </div>

          {!stats?.recentMeetings || stats.recentMeetings.length === 0 ? (
            <div className="py-12 text-center text-charcoal/50 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-sand-dark" />
              <p className="text-sm font-medium">No meetings processed yet</p>
              <p className="text-xs text-charcoal/60">
                Submit your first transcript to generate minutes and action items.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-sand/50">
              {stats.recentMeetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onOpenMeeting(m.id)}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-ivory/50 px-2 rounded cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-charcoal hover:text-terracotta transition-colors">
                        {m.title}
                      </h4>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          m.processing_status === 'completed'
                            ? 'bg-sage-light text-sage'
                            : m.processing_status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gold-light text-gold'
                        }`}
                      >
                        {m.processing_status}
                      </span>
                    </div>
                    {m.summary && (
                      <p className="text-xs text-charcoal/70 line-clamp-1 max-w-xl">
                        {m.summary}
                      </p>
                    )}
                    <div className="flex items-center space-x-3 text-[11px] text-charcoal/50">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{m.meeting_date}</span>
                      </span>
                      <span>•</span>
                      <span>{m.action_count} Action items extracted</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-1 text-xs text-terracotta font-medium">
                    <span>View Minutes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Action Deadlines */}
        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sand">
            <div>
              <h3 className="font-serif text-xl text-charcoal">Upcoming Deadlines</h3>
              <p className="text-xs text-charcoal/60">Urgent deliverables requiring follow-up</p>
            </div>
            <button
              onClick={onViewActionTracker}
              className="text-xs text-terracotta hover:underline font-medium"
            >
              All Tasks
            </button>
          </div>

          {!stats?.upcomingDeadlines || stats.upcomingDeadlines.length === 0 ? (
            <div className="py-12 text-center text-charcoal/50 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-sage" />
              <p className="text-sm font-medium">No impending deadlines</p>
              <p className="text-xs text-charcoal/60">
                All assigned tasks are current or marked complete.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingDeadlines.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded border border-sand bg-ivory-light space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-charcoal leading-snug">
                      {item.task_description}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        item.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : item.priority === 'medium'
                          ? 'bg-gold-light text-gold'
                          : 'bg-sand text-charcoal'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-charcoal/60">
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3 text-terracotta" />
                      <span className="font-medium text-charcoal">
                        {item.owner || 'Unassigned'}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1 font-semibold text-gold">
                      <Clock className="w-3 h-3" />
                      <span>{item.deadline}</span>
                    </span>
                  </div>

                  <div className="text-[10px] text-charcoal/40 truncate">
                    Ref: {item.meeting_title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
