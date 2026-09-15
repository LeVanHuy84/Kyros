import React, { useState, useEffect, useCallback } from 'react';
import {
  ListTodo,
  Calendar,
  Sparkles,
  RefreshCw,
  Plus,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Edit3,
  Tags,
  Zap,
} from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../hooks/useTasks';
import type { CalendarEvent } from '../components/calendar/types';
import apiClient from '../services/api-client';

// Existing Todo Modals
import { CreateTaskModal } from '../components/todo/CreateTaskModal';
import { EditTaskModal } from '../components/todo/EditTaskModal';
import { RecurrenceModal } from '../components/todo/RecurrenceModal';
import { TagManagerModal } from '../components/todo/TagManagerModal';
import { TaskFilters } from '../components/todo/TaskFilters';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { EventDetailsDrawer } from '../components/calendar/EventDetailsDrawer';
import { EventEditorModal } from '../components/calendar/EventEditorModal';

const TaskManagement: React.FC = () => {
  const { activeWorkspace } = useWorkspace();

  // Task state from hook
  const {
    tasks,
    recurrenceRules,
    isLoading: isTasksLoading,
    isSaving,
    error: taskError,
    activeTab,
    currentPage,
    totalPages,
    searchQuery,
    selectedPriority,
    selectedTag,
    selectedStatus,
    allTags,
    dueDateFrom,
    dueDateTo,
    setActiveTab,
    setCurrentPage,
    setSearchQuery,
    setSelectedPriority,
    setSelectedTag,
    setSelectedStatus,
    setDueDateFrom,
    setDueDateTo,
    setError,
    fetchTasks,
    createTask,
    updateTask,
    softDeleteTask,
    recoverTask,
    toggleComplete,
    saveRecurrence,
    refreshWorkspaceTags,
  } = useTasks();

  // Calendar State for Right Panel
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState<boolean>(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState<boolean>(false);
  const [autoScheduleSuccessMsg, setAutoScheduleSuccessMsg] = useState<
    string | null
  >(null);

  // Selected event & Drawer states
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [prefilledStart, setPrefilledStart] = useState<Date | null>(null);

  // Task Overlay state coordinators
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showRecurrenceModal, setShowRecurrenceModal] =
    useState<boolean>(false);
  const [showTagManagerModal, setShowTagManagerModal] =
    useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch Calendar Events
  const fetchCalendarEvents = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsCalendarLoading(true);
    try {
      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() - 7
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 14
      );

      const response = await apiClient.get(
        `/v1/workspaces/${activeWorkspace.id}/calendar/events`,
        {
          params: {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          },
        }
      );

      const activeEvents = (response.data || []).filter(
        (e: CalendarEvent) => e.status !== 'Deleted'
      );
      setEvents(activeEvents);
    } catch (err: any) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setIsCalendarLoading(false);
    }
  }, [activeWorkspace, currentDate]);

  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  // One-Click AI Auto Schedule Action
  const handleAutoSchedule = async () => {
    if (!activeWorkspace) return;
    setIsAutoScheduling(true);
    setAutoScheduleSuccessMsg(null);
    try {
      const res = await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/calendar/events/auto-schedule`,
        null,
        { params: { daysAhead: 7 } }
      );
      const scheduledList = res.data || [];
      setAutoScheduleSuccessMsg(
        `Successfully scheduled ${scheduledList.length} task(s) into your calendar!`
      );
      fetchCalendarEvents();
      fetchTasks();
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to auto-schedule tasks.');
    } finally {
      setIsAutoScheduling(false);
    }
  };

  // Drag Task -> Drop onto Calendar Cell Slot
  const handleDragStartTask = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(task));
  };

  const handleDropOnCalendarSlot = async (prefilledDate: Date) => {
    // Drop target calendar action if needed
    setIsEditing(false);
    setPrefilledStart(prefilledDate);
    setIsModalOpen(true);
  };

  // Check event overlaps locally for UI highlighting
  const checkConflicts = useCallback(
    (event: CalendarEvent) => {
      const start = new Date(event.startTime).getTime();
      const end = new Date(event.endTime).getTime();

      return events.filter((e) => {
        if (e.eventId === event.eventId) return false;
        const eStart = new Date(e.startTime).getTime();
        const eEnd = new Date(e.endTime).getTime();
        return start < eEnd && eStart < end;
      });
    },
    [events]
  );

  // Calendar event handlers
  const handleSaveEvent = async (
    title: string,
    desc: string,
    taskId: string,
    start: string,
    end: string,
    reminders: number[]
  ) => {
    if (!activeWorkspace) return;

    const startInstant = new Date(start).toISOString();
    const endInstant = new Date(end).toISOString();

    if (isEditing && selectedEvent) {
      await apiClient.patch(
        `/v1/workspaces/${activeWorkspace.id}/calendar/events/${selectedEvent.eventId}`,
        { title, description: desc }
      );

      if (
        new Date(selectedEvent.startTime).getTime() !==
          new Date(start).getTime() ||
        new Date(selectedEvent.endTime).getTime() !== new Date(end).getTime()
      ) {
        await apiClient.post(
          `/v1/workspaces/${activeWorkspace.id}/calendar/events/${selectedEvent.eventId}/reschedule`,
          { startTime: startInstant, endTime: endInstant }
        );
      }
    } else {
      await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/calendar/events`,
        {
          userId: '00000000-0000-0000-0000-000000000000',
          taskId: taskId || null,
          title,
          description: desc,
          startTime: startInstant,
          endTime: endInstant,
          reminderOffsetsMinutes: reminders,
        }
      );
    }

    setIsModalOpen(false);
    fetchCalendarEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!activeWorkspace) return;
    try {
      await apiClient.delete(
        `/v1/workspaces/${activeWorkspace.id}/calendar/events/${eventId}`
      );
      setIsDrawerOpen(false);
      setSelectedEvent(null);
      fetchCalendarEvents();
    } catch (err: any) {
      alert(err.friendlyMessage || 'Failed to delete event.');
    }
  };

  if (!activeWorkspace) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <ListTodo size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-main)',
          }}
        >
          No Active Workspace
        </h3>
        <p style={{ fontSize: '15px' }}>
          Please select or create a workspace from the sidebar to access
          Time-Blocking Workspace.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Bar with AI Auto-Schedule Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: '700',
              color: 'var(--text-main)',
              margin: '0 0 4px 0',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Time-Blocking Workspace
            <span
              style={{
                fontSize: '12px',
                padding: '3px 8px',
                borderRadius: '12px',
                backgroundColor:
                  'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.15)',
                color: 'var(--color-primary)',
                fontWeight: '600',
                letterSpacing: '0',
              }}
            >
              Pro AI Engine
            </span>
          </h2>
          <p
            style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}
          >
            Organize tasks on the left, auto-schedule or drag & drop onto your
            interactive calendar on the right.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleAutoSchedule}
            disabled={isAutoScheduling}
            className="btn btn-primary"
            style={{
              height: '44px',
              padding: '0 20px',
              backgroundColor: 'var(--color-primary)',
              boxShadow:
                '0 4px 12px rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.25)',
              gap: '8px',
            }}
          >
            <Sparkles size={18} className={isAutoScheduling ? 'spin' : ''} />
            <span>
              {isAutoScheduling ? 'Auto-Scheduling...' : '🤖 AI Auto-Schedule'}
            </span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-secondary"
            style={{ height: '44px', padding: '0 16px' }}
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>

          <button
            onClick={() => setShowTagManagerModal(true)}
            className="btn btn-secondary"
            style={{ height: '44px', padding: '0 16px' }}
          >
            <Tags size={18} />
            <span>Tags</span>
          </button>
        </div>
      </div>

      {/* Notifications / Feedback Banners */}
      {taskError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger)',
            fontSize: '14px',
          }}
        >
          <AlertCircle size={18} />
          <span style={{ flexGrow: 1 }}>{taskError}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-danger)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {autoScheduleSuccessMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--color-success)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-success)',
            fontSize: '14px',
          }}
        >
          <Zap size={18} />
          <span style={{ flexGrow: 1 }}>{autoScheduleSuccessMsg}</span>
          <button
            onClick={() => setAutoScheduleSuccessMsg(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-success)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. Main Split-View Workspace Grid Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(440px, 1.3fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: Task Backlog & Orchestration */}
        <div
          className="card"
          style={{
            padding: '20px',
            gap: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Tab Switcher */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '2px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { id: 'all', label: 'Backlog Tasks' },
                { id: 'recurrence', label: 'Recurring' },
                { id: 'trash', label: 'Trash' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom:
                      activeTab === tab.id
                        ? '2px solid var(--color-primary)'
                        : '2px solid transparent',
                    color:
                      activeTab === tab.id
                        ? 'var(--text-main)'
                        : 'var(--text-muted)',
                    fontWeight: activeTab === tab.id ? '600' : '500',
                    padding: '0 0 10px 0',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters Bar */}
          {activeTab === 'all' && (
            <TaskFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedPriority={selectedPriority}
              setSelectedPriority={setSelectedPriority}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              allTags={allTags}
              dueDateFrom={dueDateFrom}
              setDueDateFrom={setDueDateFrom}
              dueDateTo={dueDateTo}
              setDueDateTo={setDueDateTo}
            />
          )}

          {/* Task Backlog List Cards */}
          {isTasksLoading ? (
            <div
              style={{
                padding: '30px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <RefreshCw
                size={20}
                className="spin"
                style={{ color: 'var(--color-primary)', marginBottom: '8px' }}
              />
              <div>Loading backlog...</div>
            </div>
          ) : tasks.length === 0 ? (
            <div
              style={{
                padding: '40px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <ListTodo
                size={36}
                style={{ opacity: 0.3, marginBottom: '8px' }}
              />
              <div
                style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                }}
              >
                No Tasks Available
              </div>
              <div style={{ fontSize: '13px' }}>
                Create a task or trigger AI Auto-Schedule.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '680px',
                overflowY: 'auto',
              }}
            >
              {tasks.map((task) => (
                <div
                  key={task.taskId}
                  draggable
                  onDragStart={(e) => handleDragStartTask(e, task)}
                  style={{
                    padding: '14px 16px',
                    backgroundColor:
                      task.status === 'Completed'
                        ? 'rgba(16, 185, 129, 0.03)'
                        : 'var(--bg-app)',
                    border:
                      task.status === 'Completed'
                        ? '1px solid rgba(16, 185, 129, 0.2)'
                        : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'grab',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    {/* Drag Handle */}
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        cursor: 'grab',
                        marginTop: '2px',
                        opacity: 0.6,
                      }}
                      title="Drag to schedule on calendar"
                    >
                      ⋮⋮
                    </span>

                    {task.status !== 'SoftDeleted' && (
                      <button
                        onClick={() => toggleComplete(task)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color:
                            task.status === 'Completed'
                              ? 'var(--color-success)'
                              : 'var(--text-muted)',
                          padding: 0,
                          marginTop: '2px',
                        }}
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'var(--text-main)',
                            textDecoration:
                              task.status === 'Completed'
                                ? 'line-through'
                                : 'none',
                            opacity: task.status === 'Completed' ? 0.6 : 1,
                          }}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`badge ${
                            task.priority === 'High'
                              ? 'badge-high'
                              : task.priority === 'Medium'
                                ? 'badge-medium'
                                : 'badge-low'
                          }`}
                          style={{ fontSize: '10px', padding: '1px 6px' }}
                        >
                          {task.priority}
                        </span>

                        {task.autoSchedule && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor:
                                'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.1)',
                              color: 'var(--color-primary)',
                              fontWeight: '600',
                            }}
                            title="Auto-scheduling enabled"
                          >
                            ⚡ Auto
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p
                          style={{
                            margin: '4px 0 0 0',
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {task.description}
                        </p>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginTop: '6px',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {task.dueDate && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Calendar size={12} />
                            {new Date(task.dueDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={12} />
                          {task.estimatedDurationMinutes || 30} mins
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {activeTab === 'all' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowEditModal(true);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 6px' }}
                            title="Edit"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => softDeleteTask(task.taskId)}
                            className="btn btn-danger"
                            style={{ padding: '4px 6px' }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                      {activeTab === 'trash' && (
                        <button
                          onClick={() => recoverTask(task.taskId)}
                          className="btn btn-success"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                marginTop: '8px',
              }}
            >
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0 || isTasksLoading}
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={currentPage === totalPages - 1 || isTasksLoading}
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Time-Blocking Calendar */}
        <div
          className="card"
          style={{
            padding: '20px',
            gap: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Calendar Header Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setCurrentDate(new Date())}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                }}
              >
                Today
              </button>
              <button
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() - 7);
                  setCurrentDate(d);
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 10px' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() + 7);
                  setCurrentDate(d);
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 10px' }}
              >
                <ChevronRight size={14} />
              </button>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginLeft: '8px',
                }}
              >
                {currentDate.toLocaleString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '4px',
                backgroundColor: 'var(--bg-app)',
                padding: '2px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              {(['week', 'day'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontWeight: viewMode === m ? '600' : '500',
                    backgroundColor:
                      viewMode === m ? 'var(--bg-card)' : 'transparent',
                    color:
                      viewMode === m
                        ? 'var(--color-primary)'
                        : 'var(--text-muted)',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDropOnCalendarSlot(currentDate);
            }}
          >
            <CalendarGrid
              currentDate={currentDate}
              viewMode={viewMode === 'week' ? 'week' : 'day'}
              events={events}
              isLoading={isCalendarLoading}
              onCellClick={handleDropOnCalendarSlot}
              onEventClick={(ev) => {
                setSelectedEvent(ev);
                setIsDrawerOpen(true);
              }}
              checkConflicts={checkConflicts}
            />
          </div>
        </div>
      </div>

      {/* Drawers & Modals */}
      <EventDetailsDrawer
        selectedEvent={selectedEvent}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onDelete={handleDeleteEvent}
        onReschedule={async (id, s, e) => {
          await apiClient.post(
            `/v1/workspaces/${activeWorkspace.id}/calendar/events/${id}/reschedule`,
            {
              startTime: new Date(s).toISOString(),
              endTime: new Date(e).toISOString(),
            }
          );
          fetchCalendarEvents();
        }}
        onAddReminder={async () => {}}
        onRemoveReminder={async () => {}}
        onEditClick={(ev) => {
          setSelectedEvent(ev);
          setIsEditing(true);
          setIsModalOpen(true);
        }}
        conflictingEvents={selectedEvent ? checkConflicts(selectedEvent) : []}
      />

      <EventEditorModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        selectedEvent={selectedEvent}
        prefilledStart={prefilledStart}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
      />

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={createTask}
        isSaving={isSaving}
      />

      <EditTaskModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSave={updateTask}
        isSaving={isSaving}
      />

      <RecurrenceModal
        isOpen={showRecurrenceModal}
        onClose={() => {
          setShowRecurrenceModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        rule={selectedTask ? recurrenceRules[selectedTask.taskId] : undefined}
        onSave={saveRecurrence}
        isSaving={isSaving}
      />

      <TagManagerModal
        isOpen={showTagManagerModal}
        onClose={() => setShowTagManagerModal(false)}
        onTagsChange={refreshWorkspaceTags}
      />
    </div>
  );
};

export default TaskManagement;
