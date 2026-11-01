import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Trash2,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { Meeting } from '../types';

interface MeetingHistoryProps {
  onOpenMeeting: (id: string) => void;
  onNewMeeting: () => void;
}

export const MeetingHistory: React.FC<MeetingHistoryProps> = ({
  onOpenMeeting,
  onNewMeeting
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await api.getMeetings();
      setMeetings(data);
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this meeting and all associated minutes and tasks?'))
      return;
    try {
      await api.deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(`Error deleting meeting: ${err.message}`);
    }
  };

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.summary && m.summary.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || m.processing_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Meeting History</h1>
          <p className="text-sm text-charcoal/70">
            Historical archives of analyzed meeting sessions and generated minutes.
          </p>
        </div>

        <button
          onClick={onNewMeeting}
          className="flex items-center space-x-1.5 bg-terracotta hover:bg-terracotta-hover text-white px-4 py-2 rounded text-xs font-semibold shadow-sm transition-colors"
        >
          <span>+ Process New Transcript</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-sand rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meeting titles, discussion summaries..."
            className="w-full pl-9 pr-3 py-1.5 border border-sand rounded bg-ivory-light text-xs focus:outline-none focus:border-terracotta"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-charcoal/50" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-sand rounded bg-ivory-light text-xs text-charcoal focus:outline-none"
          >
            <option value="all">All Processing Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-charcoal/50">
          Loading meeting history...
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="bg-white border border-sand rounded-xl p-12 text-center space-y-2">
          <FileText className="w-8 h-8 text-sand-dark mx-auto" />
          <h3 className="font-serif text-lg text-charcoal">No meetings found</h3>
          <p className="text-xs text-charcoal/60">
            Submit a transcript to begin building your meeting knowledge base.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden divide-y divide-sand">
          {filteredMeetings.map((m) => (
            <div
              key={m.id}
              onClick={() => onOpenMeeting(m.id)}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-ivory/50 cursor-pointer transition-colors"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      m.processing_status === 'completed'
                        ? 'bg-sage-light text-sage'
                        : m.processing_status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gold-light text-gold'
                    }`}
                  >
                    {m.processing_status}
                  </span>
                  <h3 className="font-serif text-lg text-charcoal hover:text-terracotta transition-colors">
                    {m.title}
                  </h3>
                </div>

                {m.summary && (
                  <p className="text-xs text-charcoal/70 line-clamp-2 leading-relaxed">
                    {m.summary}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-charcoal/50 pt-1">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-terracotta" />
                    <span>Reference: {m.meeting_date}</span>
                  </span>
                  <span>•</span>
                  <span>Processed: {new Date(m.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="font-medium text-charcoal/70">
                    {m.action_count || 0} Action Items
                    {m.pending_action_count !== undefined && m.pending_action_count > 0 && (
                      <span className="text-gold font-normal">
                        {' '}
                        ({m.pending_action_count} pending)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  onClick={(e) => handleDelete(m.id, e)}
                  className="p-1.5 text-charcoal/40 hover:text-red-600 rounded transition-colors"
                  title="Delete meeting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-1 text-xs font-semibold text-terracotta">
                  <span>Open Minutes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
