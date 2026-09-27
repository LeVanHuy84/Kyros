export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskItem {
  id: string;
  workspaceId: string;
  parentTaskId?: string | null;
  title: string;
  description?: string;
  priority: TaskPriority;
  tags: string[];
  dueDate?: string; // ISO string
  estimatedDurationMinutes?: number;
  autoSchedule?: boolean;
  subtasks?: string;
  lifecycleStatus: 'Active' | 'Completed' | 'SoftDeleted';
  status: TaskStatus; // Mapped client status: COMPLETED if lifecycleStatus == 'Completed', else TODO/IN_PROGRESS
  version: number;
  hasRecurrence?: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceInterval?: number;
  recurrenceStatus?: 'Active' | 'Paused' | 'Stopped';
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
  dueDate?: string; // ISO string
  estimatedDurationMinutes?: number;
  autoSchedule?: boolean;
  subtasks?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedDurationMinutes?: number;
  autoSchedule?: boolean;
  subtasks?: string;
  version?: number;
}

export interface WorkspaceTag {
  tagId: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CreateWorkspaceTagDto {
  name: string;
  color?: string;
}

export interface UpdateWorkspaceTagDto {
  name: string;
  color?: string;
}

export interface TaskTimeLog {
  id: string;
  workspaceId: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string | null;
  durationMinutes: number;
  notes?: string;
  active: boolean;
}

export interface ProductivityStats {
  totalFocusedMinutes: number;
  totalSessionsCount: number;
  averageSessionMinutes: number;
  activeTimerCount: number;
}

export interface RecurrenceTemplate {
  taskId: string;
  pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
  lastGeneratedOccurrence?: string;
  recurrenceStatus: 'Active' | 'Paused' | 'Stopped';
}

export interface ConfigureRecurrenceDto {
  pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
}

export type TaskViewMode = 'list' | 'board';

export interface TaskFilterState {
  search: string;
  status: 'ALL' | 'ACTIVE' | 'COMPLETED';
  priority: 'ALL' | TaskPriority;
  tag: string | null;
  viewMode: TaskViewMode;
}
