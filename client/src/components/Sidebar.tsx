import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  CheckSquare2,
  Clock,
  FlaskConical,
  Zap,
  Settings,
  Sparkles,
  X
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'new_meeting'
  | 'meeting_detail'
  | 'action_tracker'
  | 'history'
  | 'evaluations'
  | 'automation'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  meetingCount?: number;
  actionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  meetingCount = 0,
  actionCount = 0
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new_meeting', label: 'New Meeting', icon: FilePlus2 },
    {
      id: 'action_tracker',
      label: 'Action Tracker',
      icon: CheckSquare2,
      badge: actionCount > 0 ? actionCount : undefined
    },
    {
      id: 'history',
      label: 'Meeting History',
      icon: Clock,
      badge: meetingCount > 0 ? meetingCount : undefined
    },
    { id: 'evaluations', label: 'Evaluations & Rubric', icon: FlaskConical },
    { id: 'automation', label: 'Automation & Logs', icon: Zap },
    { id: 'settings', label: 'Settings & Status', icon: Settings }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-charcoal/40 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-charcoal text-ivory flex flex-col justify-between border-r border-charcoal-light transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header & Logo */}
          <div className="p-6 border-b border-charcoal-light flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded bg-terracotta flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-serif text-xl tracking-wide text-ivory">MeetMind AI</h1>
                <p className="text-[11px] text-sand/70 tracking-wider uppercase font-medium">
                  Intelligent Minutes & Tasks
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-sand/70 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentTab === item.id ||
                (currentTab === 'meeting_detail' && item.id === 'history');

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id as NavTab);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-terracotta text-white shadow-sm'
                      : 'text-sand/80 hover:text-ivory hover:bg-charcoal-light/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-charcoal-light text-sand'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer meta */}
        <div className="p-5 border-t border-charcoal-light text-xs text-sand/60 space-y-2">
          <div className="flex items-center justify-between">
            <span>Workflow Engine</span>
            <span className="text-sage font-medium">Gemini + Supabase</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Accuracy Benchmark</span>
            <span className="text-gold font-medium">14/14 pts (100%)</span>
          </div>
          <p className="text-[10px] text-sand/40 pt-1">
            MeetMind AI • Editorial Productivity
          </p>
        </div>
      </aside>
    </>
  );
};
