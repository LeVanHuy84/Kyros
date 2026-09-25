import React, { useState } from 'react';
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
  CalendarCheck,
  Timer,
} from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../hooks/useTasks';
import apiClient from '../services/api-client';

// Existing Todo Modals
import { CreateTaskModal } from '../components/todo/CreateTaskModal';
import { EditTaskModal } from '../components/todo/EditTaskModal';
import { RecurrenceModal } from '../components/todo/RecurrenceModal';
import { TagManagerModal } from '../components/todo/TagManagerModal';
import { TaskFilters } from '../components/todo/TaskFilters';
import { FocusTimerModal } from '../components/todo/FocusTimerModal';

const TaskManagement: React.FC = () => {
  const { activeWorkspace } = useWorkspace();

  // Task state from hook
  const {
    tasks,
    recurrenceRules,
    metrics,
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

  // AI Auto Scheduling State
  const [isAutoScheduling, setIsAutoScheduling] = useState<boolean>(false);
  const [autoScheduleSuccessMsg, setAutoScheduleSuccessMsg] = useState<
    string | null
  >(null);

  // Task Overlay state coordinators
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showRecurrenceModal, setShowRecurrenceModal] =
    useState<boolean>(false);
  const [showTagManagerModal, setShowTagManagerModal] =
    useState<boolean>(false);
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timerTask, setTimerTask] = useState<Task | null>(null);

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
        `Successfully auto-scheduled ${scheduledList.length} task(s) into your calendar!`
      );
      fetchTasks();
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to auto-schedule tasks.');
    } finally {
      setIsAutoScheduling(false);
    }
  };

  // Schedule task action (Navigates to Calendar or triggers auto-schedule)
  const handleScheduleTask = async (task: Task) => {
    if (!activeWorkspace) return;
    try {
      // Create a quick calendar event for the task starting now + 1 hour or default time
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1, 0, 0, 0);
      const endTime = new Date(
        startTime.getTime() + (task.estimatedDurationMinutes || 30) * 60000
      );

      await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/calendar/events`,
        {
          userId: '00000000-0000-0000-0000-000000000000',
          taskId: task.taskId,
          title: task.title,
          description: task.description || '',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          reminderOffsetsMinutes: [15],
        }
      );
      setAutoScheduleSuccessMsg(`Scheduled "${task.title}" on Calendar!`);
      fetchTasks();
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to schedule task.');
    }
  };

  const isFiltered =
    !!searchQuery ||
    !!selectedPriority ||
    !!selectedStatus ||
    !!selectedTag ||
    !!dueDateFrom ||
    !!dueDateTo;

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
        <p style={{ fontSize: '14px' }}>
          Please select or create a workspace from the sidebar to manage your
          tasks.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
      }}
    >
      {/* 1. PAGE HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text-main)',
              margin: '0 0 4px 0',
              letterSpacing: '-0.5px',
            }}
          >
            Task Management
          </h1>
          <p
            style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}
          >
            Manage and organize your tasks across your workspace.
          </p>
        </div>

        {/* Action Buttons Hierarchy */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {/* Primary Action */}
          <button
            onClick={handleAutoSchedule}
            disabled={isAutoScheduling}
            className="btn btn-primary"
            style={{
              height: '40px',
              padding: '0 18px',
              backgroundColor: 'var(--color-primary)',
              boxShadow:
                '0 4px 12px rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.25)',
              gap: '8px',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            <Sparkles size={16} className={isAutoScheduling ? 'spin' : ''} />
            <span>
              {isAutoScheduling ? 'Auto-Scheduling...' : 'AI Auto-Schedule'}
            </span>
          </button>

          {/* Secondary Action */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-secondary"
            style={{
              height: '40px',
              padding: '0 16px',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>

          {/* Tertiary Action */}
          <button
            onClick={() => setShowTagManagerModal(true)}
            className="btn btn-secondary"
            style={{
              height: '40px',
              padding: '0 14px',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            <Tags size={16} />
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
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger)',
            fontSize: '13px',
          }}
        >
          <AlertCircle size={16} />
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
            <X size={15} />
          </button>
        </div>
      )}

      {autoScheduleSuccessMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--color-success)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-success)',
            fontSize: '13px',
          }}
        >
          <Zap size={16} />
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
            <X size={15} />
          </button>
        </div>
      )}

      {/* 2. MAIN TASK WORKSPACE CONTAINER */}
      <div
        className="card"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
        }}
      >
        {/* TASK TABS WITH METRICS COUNTS */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '2px',
          }}
        >
          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              {
                id: 'all',
                label: 'Backlog Tasks',
                count: metrics.activeCount + metrics.completedCount,
              },
              {
                id: 'recurrence',
                label: 'Recurring',
                count: metrics.recurrenceCount,
              },
              { id: 'trash', label: 'Trash', count: metrics.trashCount },
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      backgroundColor:
                        activeTab === tab.id
                          ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.15)'
                          : 'var(--bg-app)',
                      color:
                        activeTab === tab.id
                          ? 'var(--color-primary)'
                          : 'var(--text-muted)',
                      fontWeight: '600',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* TOOLBAR & FILTERS */}
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

        {/* TASK LIST CONTENT */}
        {isTasksLoading ? (
          <div
            style={{
              padding: '60px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <RefreshCw
              size={24}
              className="spin"
              style={{ color: 'var(--color-primary)', marginBottom: '12px' }}
            />
            <div style={{ fontSize: '14px' }}>Loading tasks...</div>
          </div>
        ) : tasks.length === 0 ? (
          /* EMPTY STATE */
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <ListTodo size={40} style={{ opacity: 0.3 }} />
            <div
              style={{
                fontWeight: '600',
                fontSize: '15px',
                color: 'var(--text-main)',
              }}
            >
              {isFiltered ? 'No tasks match your filters' : 'No tasks yet'}
            </div>
            <p style={{ fontSize: '13px', margin: 0, maxWidth: '400px' }}>
              {isFiltered
                ? 'Try adjusting or resetting your search filters to view your tasks.'
                : 'Create your first task or let AI auto-schedule your workload.'}
            </p>
            {isFiltered ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPriority('');
                  setSelectedStatus('');
                  setSelectedTag('');
                  setDueDateFrom('');
                  setDueDateTo('');
                }}
                className="btn btn-secondary"
                style={{
                  marginTop: '8px',
                  padding: '6px 16px',
                  fontSize: '13px',
                }}
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
                style={{
                  marginTop: '8px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  gap: '6px',
                }}
              >
                <Plus size={15} />
                <span>Create Task</span>
              </button>
            )}
          </div>
        ) : (
          /* TASK ROWS */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {tasks.map((task) => (
              <div
                key={task.taskId}
                className="task-row"
                style={{
                  padding: '12px 16px',
                  backgroundColor:
                    task.status === 'Completed'
                      ? 'rgba(16, 185, 129, 0.02)'
                      : 'var(--bg-app)',
                  border:
                    task.status === 'Completed'
                      ? '1px solid rgba(16, 185, 129, 0.15)'
                      : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {/* Completion Checkbox */}
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
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  )}

                  {/* Task Content */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Title */}
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
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                        }}
                        title={task.title}
                      >
                        {task.title}
                      </span>

                      {/* Priority Badge */}
                      <span
                        className={`badge ${
                          task.priority === 'High'
                            ? 'badge-high'
                            : task.priority === 'Medium'
                              ? 'badge-medium'
                              : 'badge-low'
                        }`}
                        style={{
                          fontSize: '10px',
                          padding: '1px 7px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}
                      >
                        {task.priority}
                      </span>

                      {/* Recurrence Indicator */}
                      {recurrenceRules[task.taskId] && (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(168, 85, 247, 0.12)',
                            color: '#c084fc',
                            fontWeight: '600',
                            flexShrink: 0,
                          }}
                        >
                          🔄 {recurrenceRules[task.taskId].pattern}
                        </span>
                      )}

                      {/* Tags */}
                      {task.tags &&
                        task.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-app)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>

                    {/* Task Description snippet */}
                    {task.description && (
                      <p
                        style={{
                          margin: '2px 0 0 0',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '700px',
                        }}
                      >
                        {task.description}
                      </p>
                    )}

                    {/* Metadata Hierarchy */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        marginTop: '4px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={12} />
                        {task.estimatedDurationMinutes || 30} mins
                      </span>

                      {task.dueDate && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Calendar size={12} />
                          Due{' '}
                          {new Date(task.dueDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                  }}
                >
                  {activeTab === 'all' && (
                    <>
                      {/* Focus Timer Button */}
                      {task.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            setTimerTask(task);
                            setShowTimerModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            gap: '4px',
                            borderColor: 'rgba(99, 102, 241, 0.4)',
                            color: 'var(--color-primary)',
                          }}
                          title="Bắt đầu Focus Timer (Pomodoro)"
                        >
                          <Timer size={13} />
                          <span className="hide-mobile">Focus</span>
                        </button>
                      )}

                      {/* Quick Schedule Button */}
                      <button
                        onClick={() => handleScheduleTask(task)}
                        className="btn btn-secondary"
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          gap: '4px',
                        }}
                        title="Schedule task on calendar"
                      >
                        <CalendarCheck size={13} />
                        <span className="hide-mobile">Schedule</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowEditModal(true);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '5px 7px' }}
                        title="Edit Task"
                      >
                        <Edit3 size={13} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => softDeleteTask(task.taskId)}
                        className="btn btn-danger"
                        style={{ padding: '5px 7px' }}
                        title="Delete Task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}

                  {activeTab === 'trash' && (
                    <button
                      onClick={() => recoverTask(task.taskId)}
                      className="btn btn-success"
                      style={{
                        padding: '5px 10px',
                        fontSize: '12px',
                        gap: '4px',
                      }}
                    >
                      <RotateCcw size={13} />
                      <span>Recover</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0 || isTasksLoading}
              className="btn btn-secondary"
              style={{ padding: '4px 10px' }}
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
              style={{ padding: '4px 10px' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* MODALS */}
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

      <FocusTimerModal
        task={timerTask}
        isOpen={showTimerModal}
        onClose={() => {
          setShowTimerModal(false);
          setTimerTask(null);
        }}
        onTimerComplete={() => {
          fetchTasks();
        }}
      />
    </div>
  );
};

export default TaskManagement;
