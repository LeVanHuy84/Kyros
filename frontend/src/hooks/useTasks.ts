import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceTags } from './useWorkspaceTags';
import apiClient from '../services/api-client';

export interface Task {
  taskId: string;
  workspaceId: string;
  parentTaskId: string | null;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Completed' | 'SoftDeleted';
  tags: string[];
  dueDate: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface RecurrenceRule {
  taskId: string;
  pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;
  interval: number | null;
  recurrenceStatus: 'Active' | 'Paused' | 'Stopped' | null;
  lastGeneratedOccurrence: string | null;
}

export interface TaskMetrics {
  activeCount: number;
  completedCount: number;
  recurrenceCount: number;
  trashCount: number;
}

export const useTasks = () => {
  const { activeWorkspace } = useWorkspace();
  const { tags: workspaceTags } = useWorkspaceTags();

  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurrenceRules, setRecurrenceRules] = useState<
    Record<string, RecurrenceRule>
  >({});
  const [activeTab, setActiveTab] = useState<'all' | 'recurrence' | 'trash'>(
    'all'
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Summary Metrics
  const [metrics, setMetrics] = useState<TaskMetrics>({
    activeCount: 0,
    completedCount: 0,
    recurrenceCount: 0,
    trashCount: 0,
  });

  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dueDateFrom, setDueDateFrom] = useState<string>('');
  const [dueDateTo, setDueDateTo] = useState<string>('');

  // Available Tags (derived from loaded tasks for filter dropdown)
  const [allTags, setAllTags] = useState<string[]>([]);

  // Fetch Tasks with current filters & pagination
  const fetchTasks = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    setError(null);
    try {
      let endpoint = `/v1/workspaces/${activeWorkspace.id}/tasks`;

      const params: Record<string, any> = {
        page: currentPage,
        size: 10,
      };

      if (activeTab === 'trash') {
        endpoint += '/deleted';
      } else {
        if (searchQuery.trim()) params.title = searchQuery.trim();
        if (selectedPriority) params.priority = selectedPriority;
        if (selectedTag) params.tag = selectedTag;
        if (selectedStatus) params.isCompleted = selectedStatus === 'Completed';
        if (dueDateFrom)
          params.dueDateFrom = new Date(
            dueDateFrom + 'T00:00:00'
          ).toISOString();
        if (dueDateTo)
          params.dueDateTo = new Date(dueDateTo + 'T23:59:59').toISOString();
      }

      const response = await apiClient.get(endpoint, { params });
      const contentList: Task[] = response.data.content || [];
      setTasks(contentList);
      setTotalPages(response.data.totalPages || 0);

      // Fetch recurrence details for tasks
      if (activeTab === 'all' || activeTab === 'recurrence') {
        const rulesMap: Record<string, RecurrenceRule> = {};
        await Promise.all(
          contentList.map(async (task) => {
            try {
              const res = await apiClient.get(
                `/v1/workspaces/${activeWorkspace.id}/tasks/${task.taskId}/recurrence`
              );
              if (res.data && res.data.pattern) {
                rulesMap[task.taskId] = res.data;
              }
            } catch {
              // Ignore if no recurrence set
            }
          })
        );
        setRecurrenceRules((prev) => ({ ...prev, ...rulesMap }));
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.friendlyMessage ||
          'Failed to load tasks. Please verify workspace context.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    activeWorkspace,
    currentPage,
    searchQuery,
    selectedPriority,
    selectedTag,
    selectedStatus,
    dueDateFrom,
    dueDateTo,
    activeTab,
  ]);

  // Fetch Summary metrics (Independent counts)
  const fetchMetrics = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const activeRes = await apiClient.get(
        `/v1/workspaces/${activeWorkspace.id}/tasks`,
        { params: { isCompleted: false, size: 1 } }
      );
      const completedRes = await apiClient.get(
        `/v1/workspaces/${activeWorkspace.id}/tasks`,
        { params: { isCompleted: true, size: 1 } }
      );
      const trashRes = await apiClient.get(
        `/v1/workspaces/${activeWorkspace.id}/tasks/deleted`,
        { params: { size: 1 } }
      );

      setMetrics({
        activeCount: activeRes.data.totalElements || 0,
        completedCount: completedRes.data.totalElements || 0,
        recurrenceCount: Object.values(recurrenceRules).filter(
          (r) => r.recurrenceStatus === 'Active'
        ).length,
        trashCount: trashRes.data.totalElements || 0,
      });
    } catch (e) {
      console.warn('Failed to load metrics summary', e);
    }
  }, [activeWorkspace, recurrenceRules]);

  // Trigger loading on active workspace / tab / filter changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Derive available tags for the filter dropdown from loaded tasks + workspace tag catalog
  useEffect(() => {
    const tagsSet = new Set<string>();
    tasks.forEach((t) => t.tags?.forEach((tag) => tagsSet.add(tag)));
    workspaceTags.forEach((t) => tagsSet.add(t.name));
    setAllTags(Array.from(tagsSet));
  }, [tasks, workspaceTags]);

  // Reset page when tab/filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [
    activeTab,
    searchQuery,
    selectedPriority,
    selectedTag,
    selectedStatus,
    dueDateFrom,
    dueDateTo,
  ]);

  // Create Task Action
  const createTask = async (
    title: string,
    description: string,
    priority: 'High' | 'Medium' | 'Low',
    dueDate: string | null,
    tags: string[]
  ) => {
    if (!activeWorkspace) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.post(`/v1/workspaces/${activeWorkspace.id}/tasks`, {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        tags,
      });
      fetchTasks();
    } catch (err: any) {
      const msg =
        err.friendlyMessage ||
        'Failed to create task. Check validation invariants.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Update Task Action
  const updateTask = async (
    taskId: string,
    title: string,
    description: string,
    priority: 'High' | 'Medium' | 'Low',
    dueDate: string | null,
    version: number,
    tags: string[],
    originalTags: string[]
  ) => {
    if (!activeWorkspace) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.put(
        `/v1/workspaces/${activeWorkspace.id}/tasks/${taskId}`,
        {
          title: title.trim(),
          description: description.trim(),
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          version,
        }
      );

      // Update tags if changed
      const tagsToAdd = tags.filter((t) => !originalTags.includes(t));
      if (tagsToAdd.length > 0) {
        await apiClient.post(
          `/v1/workspaces/${activeWorkspace.id}/tasks/${taskId}/tags`,
          {
            tags: tagsToAdd,
          }
        );
      }

      const tagsToRemove = originalTags.filter((t) => !tags.includes(t));
      for (const tag of tagsToRemove) {
        await apiClient.delete(
          `/v1/workspaces/${activeWorkspace.id}/tasks/${taskId}/tags/${tag}`
        );
      }

      fetchTasks();
    } catch (err: any) {
      const msg =
        err.friendlyMessage ||
        'Failed to update task. Optimistic lock validation failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Soft Delete Action
  const softDeleteTask = async (taskId: string) => {
    if (!activeWorkspace) return;
    try {
      await apiClient.delete(
        `/v1/workspaces/${activeWorkspace.id}/tasks/${taskId}`
      );
      fetchTasks();
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to soft delete task.');
    }
  };

  // Recover Action
  const recoverTask = async (taskId: string) => {
    if (!activeWorkspace) return;
    try {
      await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/tasks/${taskId}/recover`
      );
      fetchTasks();
    } catch (err: any) {
      setError(
        err.friendlyMessage ||
          'Failed to recover task. The 2-hour window might have expired.'
      );
    }
  };

  // Complete / Reopen Action
  const toggleComplete = async (task: Task) => {
    if (!activeWorkspace) return;
    try {
      const endpoint = task.status === 'Completed' ? 'reopen' : 'complete';
      await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/tasks/${task.taskId}/${endpoint}`
      );
      fetchTasks();
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to update task lifecycle.');
    }
  };

  // Save Recurrence Configuration
  const saveRecurrence = async (
    taskId: string,
    pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    interval: number
  ) => {
    if (!activeWorkspace) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await apiClient.put(
        `/v1/workspaces/${activeWorkspace.id}/tasks/${taskId}/recurrence`,
        {
          pattern,
          interval,
        }
      );
      setRecurrenceRules((prev) => ({ ...prev, [taskId]: res.data }));
      fetchTasks();
    } catch (err: any) {
      const msg = err.friendlyMessage || 'Failed to configure recurrence.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Pause / Resume / Stop Recurrence Rules
  const recurrenceAction = async (
    taskId: string,
    action: 'pause' | 'resume' | 'stop'
  ) => {
    if (!activeWorkspace) return;
    try {
      const res = await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/tasks/${taskId}/recurrence/${action}`
      );
      setRecurrenceRules((prev) => ({ ...prev, [taskId]: res.data }));
      fetchTasks();
    } catch (err: any) {
      setError(err.friendlyMessage || `Failed to ${action} recurrence.`);
    }
  };

  return {
    tasks,
    recurrenceRules,
    metrics,
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
    fetchTasks,
    createTask,
    updateTask,
    softDeleteTask,
    recoverTask,
    toggleComplete,
    saveRecurrence,
    recurrenceAction,
  };
};
