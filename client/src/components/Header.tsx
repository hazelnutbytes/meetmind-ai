import React from 'react';
import { Menu, Plus, CheckCircle2, AlertCircle, Database, Sparkles } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onOpenSidebar: () => void;
  onNewMeeting: () => void;
  systemStatus: {
    geminiReady: boolean;
    supabaseReady: boolean;
    storageMode: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenSidebar,
  onNewMeeting,
  systemStatus
}) => {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Executive Overview';
      case 'new_meeting':
        return 'Process Meeting Transcript';
      case 'meeting_detail':
        return 'Meeting Minutes & Action Plan';
      case 'action_tracker':
        return 'Action Tracker & Tasks';
      case 'history':
        return 'Meeting Archives';
      case 'evaluations':
        return 'Prompt Benchmark & Rubric';
      case 'automation':
        return 'Event-Driven Automation Logs';
      case 'settings':
        return 'System Configuration & Health';
      default:
        return 'MeetMind AI';
    }
  };

  return (
    <header className="h-16 bg-ivory border-b border-sand px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden text-charcoal p-1.5 rounded hover:bg-sand/40"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-serif text-lg text-charcoal">{getTabTitle()}</h2>
        </div>
      </div>

      <div className="flex items-center space-x-3 text-xs">
        {/* Gemini status badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded border border-sand bg-ivory-light">
          <Sparkles className="w-3.5 h-3.5 text-terracotta" />
          <span className="font-medium text-charcoal">Gemini:</span>
          {systemStatus.geminiReady ? (
            <span className="flex items-center text-sage font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block mr-1"></span>
              Live
            </span>
          ) : (
            <span className="flex items-center text-gold font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block mr-1"></span>
              Needs Key
            </span>
          )}
        </div>

        {/* Supabase status badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded border border-sand bg-ivory-light">
          <Database className="w-3.5 h-3.5 text-sage" />
          <span className="font-medium text-charcoal">DB:</span>
          <span className="text-charcoal-light font-medium">
            {systemStatus.supabaseReady ? 'Supabase' : 'Local Fallback'}
          </span>
        </div>

        {/* Primary CTA */}
        {currentTab !== 'new_meeting' && (
          <button
            onClick={onNewMeeting}
            className="flex items-center space-x-1.5 bg-terracotta hover:bg-terracotta-hover text-white px-3.5 py-1.5 rounded text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Process Meeting</span>
          </button>
        )}
      </div>
    </header>
  );
};
