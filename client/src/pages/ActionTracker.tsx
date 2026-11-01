import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  Edit2,
  Trash2,
  X,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { ActionItem, TaskPriority, TaskStatus, Meeting } from '../types';

interface ActionTrackerProps {
  onOpenMeeting: (id: string) => void;
}

export const ActionTracker: React.FC<ActionTrackerProps> = ({ onOpenMeeting }) => {
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Modal state
  const [editingTask, setEditingTask] = useState<ActionItem | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskMeetingId, setNewTaskMeetingId] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [actionList, meetingList] = await Promise.all([
        api.getActions(),
        api.getMeetings()
      ]);
      setTasks(actionList);
      setMeetings(meetingList);
      if (meetingList.length > 0) {
        setNewTaskMeetingId(meetingList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: TaskStatus) => {
    try {
      const updated = await api.updateAction(id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err: any) {
      alert(`Error updating task status: ${err.message}`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this action item?')) return;
    try {
      await api.deleteAction(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(`Error deleting task: ${err.message}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    try {
      const updated = await api.updateAction(editingTask.id, {
        task_description: editingTask.task_description,
        owner: editingTask.owner,
        deadline: editingTask.deadline,
        priority: editingTask.priority,
        status: editingTask.status
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTask(null);
    } catch (err: any) {
      alert(`Error saving task: ${err.message}`);
    }
  };

  const handleCreateNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim() || !newTaskMeetingId) return;

    try {
      const created = await api.createAction({
        meeting_id: newTaskMeetingId,
        task_description: newTaskDesc.trim(),
        owner: newTaskOwner.trim() ? newTaskOwner.trim() : null,
        deadline: newTaskDeadline ? newTaskDeadline : null,
        priority: newTaskPriority,
        status: 'pending'
      });
      setTasks((prev) => [created, ...prev]);
      setIsNewTaskModalOpen(false);
      setNewTaskDesc('');
      setNewTaskOwner('');
      setNewTaskDeadline('');
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    }
  };

  // Distinct owners for filter dropdown
  const distinctOwners = Array.from(
    new Set(tasks.map((t) => t.owner).filter(Boolean))
  ) as string[];

  // Filtered task set
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.task_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.owner && t.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.meeting_title && t.meeting_title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'all' || t.status === selectedStatus;

    const matchesOwner =
      selectedOwner === 'all'
        ? true
        : selectedOwner === 'unassigned'
        ? t.owner === null
        : t.owner === selectedOwner;

    const matchesPriority =
      selectedPriority === 'all' || t.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesOwner && matchesPriority;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Action Tracker</h1>
          <p className="text-sm text-charcoal/70">
            Audit-ready deliverables, assigned responsibilities, deadlines, and execution progress.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View mode toggle */}
          <div className="flex rounded border border-sand bg-white p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs flex items-center space-x-1 ${
                viewMode === 'list'
                  ? 'bg-terracotta text-white font-medium shadow-xs'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded text-xs flex items-center space-x-1 ${
                viewMode === 'kanban'
                  ? 'bg-terracotta text-white font-medium shadow-xs'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex items-center space-x-1.5 bg-terracotta hover:bg-terracotta-hover text-white px-3.5 py-2 rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Action Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-sand rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, owners, meetings..."
            className="w-full pl-9 pr-3 py-1.5 border border-sand rounded bg-ivory-light text-xs focus:outline-none focus:border-terracotta"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-sand rounded bg-ivory-light text-xs text-charcoal focus:outline-none focus:border-terracotta"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Owner filter */}
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="px-2.5 py-1.5 border border-sand rounded bg-ivory-light text-xs text-charcoal focus:outline-none focus:border-terracotta"
          >
            <option value="all">All Owners</option>
            <option value="unassigned">Unassigned (Null)</option>
            {distinctOwners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 border border-sand rounded bg-ivory-light text-xs text-charcoal focus:outline-none focus:border-terracotta"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content View: List or Kanban */}
      {loading ? (
        <div className="py-16 text-center text-xs text-charcoal/50">
          Loading synchronized tasks from Supabase...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white border border-sand rounded-xl p-12 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-sage mx-auto" />
          <h3 className="font-serif text-lg text-charcoal">No tasks matching criteria</h3>
          <p className="text-xs text-charcoal/60">
            Try adjusting your search query or status filters.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE / LIST VIEW */
        <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory border-b border-sand text-charcoal/60 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-10">Status</th>
                  <th className="py-3 px-4">Task Description</th>
                  <th className="py-3 px-4">Related Meeting</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {filteredTasks.map((t) => {
                  const isOverdue =
                    t.deadline && t.deadline < today && t.status !== 'completed';

                  return (
                    <tr key={t.id} className="hover:bg-ivory/50 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              t.id,
                              t.status === 'completed'
                                ? 'pending'
                                : t.status === 'pending'
                                ? 'in_progress'
                                : 'completed'
                            )
                          }
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            t.status === 'completed'
                              ? 'bg-sage border-sage text-white'
                              : t.status === 'in_progress'
                              ? 'bg-gold-light border-gold text-gold'
                              : 'border-sand-dark hover:border-charcoal'
                          }`}
                        >
                          {t.status === 'completed' && (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {t.status === 'in_progress' && (
                            <span className="w-2 h-2 rounded-full bg-gold" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 font-medium text-charcoal">
                        <span
                          className={
                            t.status === 'completed'
                              ? 'line-through text-charcoal/40'
                              : ''
                          }
                        >
                          {t.task_description}
                        </span>
                        {t.source_evidence && (
                          <div className="text-[10px] text-charcoal/50 italic line-clamp-1 mt-0.5">
                            Ref: "{t.source_evidence}"
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-charcoal/70">
                        <button
                          onClick={() => onOpenMeeting(t.meeting_id)}
                          className="hover:text-terracotta hover:underline truncate max-w-[180px] block"
                        >
                          {t.meeting_title || 'Meeting Link'}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        {t.owner ? (
                          <span className="inline-flex items-center space-x-1 font-medium text-charcoal">
                            <User className="w-3 h-3 text-terracotta" />
                            <span>{t.owner}</span>
                          </span>
                        ) : (
                          <span className="text-gold italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {t.deadline ? (
                          <div className="flex items-center space-x-1">
                            <span
                              className={`font-semibold ${
                                isOverdue ? 'text-red-600' : 'text-charcoal'
                              }`}
                            >
                              {t.deadline}
                            </span>
                            {isOverdue && (
                              <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[9px] font-bold uppercase">
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-charcoal/40 italic">None</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            t.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : t.priority === 'medium'
                              ? 'bg-gold-light text-gold'
                              : 'bg-sand text-charcoal'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setEditingTask(t)}
                            className="p-1 text-charcoal/50 hover:text-charcoal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="p-1 text-charcoal/50 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map((colStatus) => {
            const colTasks = filteredTasks.filter((t) => t.status === colStatus);
            const colTitle =
              colStatus === 'pending'
                ? 'Pending'
                : colStatus === 'in_progress'
                ? 'In Progress'
                : 'Completed';

            return (
              <div
                key={colStatus}
                className="bg-ivory border border-sand rounded-xl p-4 space-y-3 min-h-[450px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-sand">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        colStatus === 'pending'
                          ? 'bg-sand-dark'
                          : colStatus === 'in_progress'
                          ? 'bg-gold'
                          : 'bg-sage'
                      }`}
                    />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal">
                      {colTitle}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-charcoal/50 px-2 py-0.5 bg-white rounded">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.map((t) => {
                    const isOverdue =
                      t.deadline && t.deadline < today && t.status !== 'completed';

                    return (
                      <div
                        key={t.id}
                        className="bg-white border border-sand rounded-lg p-3.5 shadow-xs space-y-2.5 hover:border-terracotta/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-charcoal leading-snug">
                            {t.task_description}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              t.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : t.priority === 'medium'
                                ? 'bg-gold-light text-gold'
                                : 'bg-sand text-charcoal'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <div className="text-[11px] text-charcoal/60 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3 text-terracotta" />
                              <span className={t.owner ? 'font-medium' : 'italic text-gold'}>
                                {t.owner || 'Unassigned'}
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-gold" />
                              <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                                {t.deadline || 'No date'}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Quick Kanban transitions */}
                        <div className="pt-2 border-t border-sand flex items-center justify-between text-[11px]">
                          <select
                            value={t.status}
                            onChange={(e) =>
                              handleUpdateStatus(t.id, e.target.value as TaskStatus)
                            }
                            className="bg-ivory border border-sand rounded px-1.5 py-0.5 text-[10px] text-charcoal/80"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingTask(t)}
                              className="p-1 text-charcoal/40 hover:text-charcoal"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t.id)}
                              className="p-1 text-charcoal/40 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sand rounded-xl p-6 max-w-lg w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-sand">
              <h3 className="font-serif text-lg text-charcoal">Edit Action Item</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-charcoal/40 hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">
                  Task Description
                </label>
                <textarea
                  rows={3}
                  value={editingTask.task_description}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, task_description: e.target.value })
                  }
                  className="w-full p-2.5 border border-sand rounded bg-ivory-light text-xs focus:outline-none focus:border-terracotta"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Owner</label>
                  <input
                    type="text"
                    value={editingTask.owner || ''}
                    placeholder="Leave empty for unassigned"
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        owner: e.target.value.trim() ? e.target.value : null
                      })
                    }
                    className="w-full p-2 border border-sand rounded bg-ivory-light text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal block mb-1">Deadline</label>
                  <input
                    type="date"
                    value={editingTask.deadline || ''}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        deadline: e.target.value ? e.target.value : null
                      })
                    }
                    className="w-full p-2 border border-sand rounded bg-ivory-light text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        priority: e.target.value as TaskPriority
                      })
                    }
                    className="w-full p-2 border border-sand rounded bg-ivory-light text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-charcoal block mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        status: e.target.value as TaskStatus
                      })
                    }
                    className="w-full p-2 border border-sand rounded bg-ivory-light text-xs"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-sand flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-3.5 py-1.5 rounded text-xs font-semibold text-charcoal/70 hover:text-charcoal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded text-xs font-semibold bg-terracotta hover:bg-terracotta-hover text-white transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewTask}
            className="bg-white border border-sand rounded-xl p-6 max-w-lg w-full shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-sand">
              <h3 className="font-serif text-lg text-charcoal">Add New Action Item</h3>
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="text-charcoal/40 hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">
                  Associate with Meeting
                </label>
                <select
                  value={newTaskMeetingId}
                  onChange={(e) => setNewTaskMeetingId(e.target.value)}
                  className="w-full p-2 border border-sand rounded bg-ivory-light text-xs focus:outline-none"
                  required
                >
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.meeting_date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">
                  Task Description
                </label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="e.g. Conduct security penetration test..."
                  className="w-full p-2.5 border border-sand rounded bg-ivory-light text-xs focus:outline-none focus:border-terracotta"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Owner (Optional)
                  </label>
                  <input
                    type="text"
                    value={newTaskOwner}
                    placeholder="Unassigned"
                    onChange={(e) => setNewTaskOwner(e.target.value)}
                    className="w-full p-2 border border-sand rounded bg-ivory-light text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                    className="w-full p-2 border border-sand rounded bg-ivory-light text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                  className="w-full p-2 border border-sand rounded bg-ivory-light text-xs"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-sand flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="px-3.5 py-1.5 rounded text-xs font-semibold text-charcoal/70 hover:text-charcoal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded text-xs font-semibold bg-terracotta hover:bg-terracotta-hover text-white transition-colors"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
