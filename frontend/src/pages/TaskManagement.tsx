import React, { useState } from 'react';
import {
  ListTodo,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Tags,
} from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../hooks/useTasks';

// Import Modular Presentation Sub-components (Colocation Best Practices)
import { TaskMetrics } from '../components/todo/TaskMetrics';
import { TaskFilters } from '../components/todo/TaskFilters';
import { TaskCard } from '../components/todo/TaskCard';
import { CreateTaskModal } from '../components/todo/CreateTaskModal';
import { EditTaskModal } from '../components/todo/EditTaskModal';
import { RecurrenceModal } from '../components/todo/RecurrenceModal';
import { TagManagerModal } from '../components/todo/TagManagerModal';

const TaskManagement: React.FC = () => {
  const { activeWorkspace } = useWorkspace();

  // Custom Hook managing API states & operations
  const {
    tasks,
    recurrenceRules,
    metrics,
    workspaceTags,
    isLoading,
    isSaving,
    error,
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
    createTask,
    updateTask,
    softDeleteTask,
    recoverTask,
    toggleComplete,
    saveRecurrence,
    recurrenceAction,
  } = useTasks();

  // Overlay state coordinators
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showRecurrenceModal, setShowRecurrenceModal] =
    useState<boolean>(false);
  const [showTagManagerModal, setShowTagManagerModal] =
    useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
          Please select or create a workspace from the top sidebar to access
          Task Management.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 1. Header Area */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: '600',
              color: 'var(--text-main)',
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px',
            }}
          >
            Tasks & Orchestration
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '15px',
              margin: 0,
              maxWidth: '600px',
              lineHeight: '1.6',
            }}
          >
            Coordinate tasks, monitor automated recurrence rules, and manage
            workspace priorities.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          style={{ height: '46px', padding: '0 20px' }}
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>

        <button
          onClick={() => setShowTagManagerModal(true)}
          className="btn btn-secondary"
          style={{ height: '46px', padding: '0 20px' }}
        >
          <Tags size={18} />
          <span>Manage Tags</span>
        </button>
      </div>

      {/* Centered Friendly Error Message alert */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-danger)',
            fontSize: '15px',
          }}
        >
          <AlertCircle size={18} />
          <span style={{ flexGrow: 1 }}>{error}</span>
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

      {/* 2. Metrics bento board */}
      <TaskMetrics metrics={metrics} />

      {/* 3. Task List Panel card */}
      <div className="card" style={{ padding: '24px', gap: '24px' }}>
        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border-color)',
            gap: '24px',
            paddingBottom: '2px',
          }}
        >
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'recurrence', label: 'Recurrent Templates' },
            { id: 'trash', label: 'Trash (Soft Deleted)' },
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
                padding: '0 0 12px 0',
                fontSize: '16px',
                cursor: 'pointer',
                transition:
                  'color var(--transition-fast), border-color var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters control bar (All Tasks only) */}
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

        {/* Task Cards renderer */}
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 0',
              gap: '12px',
            }}
          >
            <RefreshCw
              size={24}
              className="spin"
              style={{ color: 'var(--color-primary)' }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Loading tasks...
            </span>
          </div>
        ) : tasks.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '60px 0',
              gap: '16px',
              textAlign: 'center',
            }}
          >
            <ListTodo
              size={40}
              style={{ opacity: 0.25, color: 'var(--text-muted)' }}
            />
            <div>
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 6px 0',
                  color: 'var(--text-main)',
                }}
              >
                No Tasks Found
              </h4>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  margin: 0,
                }}
              >
                {activeTab === 'trash'
                  ? 'The local trash bin is currently empty.'
                  : activeTab === 'recurrence'
                    ? 'No tasks configured with recurrence automation templates.'
                    : 'Start by creating your first task above.'}
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.taskId}
                task={task}
                rule={recurrenceRules[task.taskId]}
                activeTab={activeTab}
                workspaceTags={workspaceTags}
                onToggleComplete={toggleComplete}
                onConfigureRecurrence={(t) => {
                  setSelectedTask(t);
                  setShowRecurrenceModal(true);
                }}
                onEdit={(t) => {
                  setSelectedTask(t);
                  setShowEditModal(true);
                }}
                onSoftDelete={softDeleteTask}
                onRecover={recoverTask}
                onRecurrenceAction={recurrenceAction}
              />
            ))}
          </div>
        )}

        {/* Offset Paginated footer control bar */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              marginTop: '8px',
            }}
          >
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0 || isLoading}
              className="btn btn-secondary"
              style={{ padding: '8px 12px' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={currentPage === totalPages - 1 || isLoading}
              className="btn btn-secondary"
              style={{ padding: '8px 12px' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ==================== DIALOG MODALS OVERLAYS ==================== */}

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
      />
    </div>
  );
};

export default TaskManagement;
