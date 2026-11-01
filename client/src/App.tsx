import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { NewMeeting } from './pages/NewMeeting';
import { MeetingDetail } from './pages/MeetingDetail';
import { ActionTracker } from './pages/ActionTracker';
import { MeetingHistory } from './pages/MeetingHistory';
import { Evaluations } from './pages/Evaluations';
import { AutomationLogs } from './pages/AutomationLogs';
import { Settings } from './pages/Settings';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [systemStatus, setSystemStatus] = useState({
    geminiReady: false,
    supabaseReady: false,
    storageMode: 'Persistent Local Fallback'
  });

  const [meetingCount, setMeetingCount] = useState(0);
  const [actionCount, setActionCount] = useState(0);

  useEffect(() => {
    refreshWorkspaceMetrics();
  }, [currentTab]);

  const refreshWorkspaceMetrics = async () => {
    try {
      const [statusData, statsData] = await Promise.all([
        api.getSettingsStatus(),
        api.getDashboardStats()
      ]);

      setSystemStatus({
        geminiReady: statusData.gemini.is_configured,
        supabaseReady: statusData.supabase.is_connected,
        storageMode: statusData.supabase.storage_mode
      });

      setMeetingCount(statsData.totalMeetings);
      setActionCount(statsData.totalActions);
    } catch (err) {
      console.warn('Metrics polling error:', err);
    }
  };

  const handleOpenMeeting = (id: string) => {
    setSelectedMeetingId(id);
    setCurrentTab('meeting_detail');
  };

  const handleMeetingProcessed = (id: string) => {
    setSelectedMeetingId(id);
    setCurrentTab('meeting_detail');
    refreshWorkspaceMetrics();
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'meeting_detail') {
            setSelectedMeetingId(null);
          }
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        meetingCount={meetingCount}
        actionCount={actionCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onNewMeeting={() => setCurrentTab('new_meeting')}
          systemStatus={systemStatus}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNewMeeting={() => setCurrentTab('new_meeting')}
              onOpenMeeting={handleOpenMeeting}
              onViewActionTracker={() => setCurrentTab('action_tracker')}
            />
          )}

          {currentTab === 'new_meeting' && (
            <NewMeeting onMeetingProcessed={handleMeetingProcessed} />
          )}

          {currentTab === 'meeting_detail' && selectedMeetingId && (
            <MeetingDetail
              meetingId={selectedMeetingId}
              onBack={() => setCurrentTab('history')}
              onViewTaskInTracker={() => setCurrentTab('action_tracker')}
            />
          )}

          {currentTab === 'action_tracker' && (
            <ActionTracker onOpenMeeting={handleOpenMeeting} />
          )}

          {currentTab === 'history' && (
            <MeetingHistory
              onOpenMeeting={handleOpenMeeting}
              onNewMeeting={() => setCurrentTab('new_meeting')}
            />
          )}

          {currentTab === 'evaluations' && <Evaluations />}

          {currentTab === 'automation' && <AutomationLogs />}

          {currentTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
};

export default App;
