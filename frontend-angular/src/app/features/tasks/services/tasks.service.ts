import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { WorkspaceService } from '@core/workspace/services/workspace.service';
import {
  ConfigureRecurrenceDto,
  CreateTaskDto,
  CreateWorkspaceTagDto,
  ProductivityStats,
  RecurrenceTemplate,
  TaskFilterState,
  TaskItem,
  TaskPriority,
  TaskStatus,
  TaskTimeLog,
  UpdateTaskDto,
  UpdateWorkspaceTagDto,
  WorkspaceTag,
} from '../models/task.models';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

interface RawTaskResponse {
  taskId: string;
  workspaceId: string;
  parentTaskId?: string | null;
  title: string;
  description?: string;
  priority: string;
  tags: string[];
  dueDate?: string;
  estimatedDurationMinutes?: number;
  autoSchedule?: boolean;
  subtasks?: string;
  lifecycleStatus: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly workspaceService = inject(WorkspaceService);

  readonly tasks = signal<TaskItem[]>([]);
  readonly deletedTasks = signal<TaskItem[]>([]);
  readonly tags = signal<WorkspaceTag[]>([]);
  readonly productivityStats = signal<ProductivityStats | null>(null);
  readonly activeTimer = signal<TaskTimeLog | null>(null);

  readonly isLoading = signal<boolean>(false);
  readonly isDeleting = signal<boolean>(false);

  readonly filters = signal<TaskFilterState>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    tag: null,
    viewMode: 'list',
  });

  // Filtered tasks computed signal
  readonly filteredTasks = computed(() => {
    const all = this.tasks();
    const filter = this.filters();
    const searchLower = filter.search.trim().toLowerCase();

    return all.filter((task) => {
      // Search filter
      if (searchLower) {
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDesc = task.description?.toLowerCase().includes(searchLower) || false;
        const matchesTag = task.tags.some((t) => t.toLowerCase().includes(searchLower));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      // Status filter
      if (filter.status === 'ACTIVE' && task.lifecycleStatus === 'Completed') return false;
      if (filter.status === 'COMPLETED' && task.lifecycleStatus !== 'Completed') return false;

      // Priority filter
      if (filter.priority !== 'ALL' && task.priority !== filter.priority) return false;

      // Tag filter
      if (filter.tag && !task.tags.includes(filter.tag)) return false;

      return true;
    });
  });

  // Task count metrics
  readonly taskCounts = computed(() => {
    const list = this.tasks();
    return {
      total: list.length,
      active: list.filter((t) => t.lifecycleStatus !== 'Completed').length,
      completed: list.filter((t) => t.lifecycleStatus === 'Completed').length,
      overdue: list.filter((t) => {
        if (t.lifecycleStatus === 'Completed' || !t.dueDate) return false;
        return new Date(t.dueDate).getTime() < Date.now();
      }).length,
    };
  });

  private get wsId(): string {
    return this.workspaceService.activeWorkspaceId() || '';
  }

  /**
   * Fetches all active tasks for current workspace.
   */
  loadTasks(): Observable<TaskItem[]> {
    const wsId = this.wsId;
    if (!wsId) return of([]);

    this.isLoading.set(true);
    return this.http
      .get<PageResponse<RawTaskResponse> | RawTaskResponse[]>(
        `/api/v1/workspaces/${wsId}/tasks?size=100`
      )
      .pipe(
        map((res) => {
          const rawList = Array.isArray(res) ? res : res?.content || [];
          const mapped = rawList.map((r) => this.mapRawTask(r));
          this.tasks.set(mapped);
          this.isLoading.set(false);
          return mapped;
        }),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        })
      );
  }

  /**
   * Fetches soft-deleted tasks (2-hour recovery window).
   */
  loadDeletedTasks(): Observable<TaskItem[]> {
    const wsId = this.wsId;
    if (!wsId) return of([]);

    return this.http
      .get<PageResponse<RawTaskResponse> | RawTaskResponse[]>(
        `/api/v1/workspaces/${wsId}/tasks/deleted?size=50`
      )
      .pipe(
        map((res) => {
          const rawList = Array.isArray(res) ? res : res?.content || [];
          const mapped = rawList.map((r) => this.mapRawTask(r));
          this.deletedTasks.set(mapped);
          return mapped;
        }),
        catchError(() => {
          this.deletedTasks.set([]);
          return of([]);
        })
      );
  }

  /**
   * Creates a new task.
   */
  createTask(dto: CreateTaskDto): Observable<TaskItem> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    const payload = {
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      priority: this.formatPriorityForApi(dto.priority || 'MEDIUM'),
      tags: dto.tags || [],
      dueDate: dto.dueDate || null,
      estimatedDurationMinutes: dto.estimatedDurationMinutes || null,
      autoSchedule: dto.autoSchedule ?? false,
      subtasks: dto.subtasks || null,
    };

    return this.http
      .post<RawTaskResponse>(`/api/v1/workspaces/${wsId}/tasks`, payload)
      .pipe(
        map((res) => {
          const task = this.mapRawTask(res);
          this.tasks.update((prev) => [task, ...prev]);
          return task;
        })
      );
  }

  /**
   * Updates an existing task.
   */
  updateTask(taskId: string, dto: UpdateTaskDto): Observable<TaskItem> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    const current = this.tasks().find((t) => t.id === taskId);
    const payload = {
      title: dto.title !== undefined ? dto.title.trim() : current?.title,
      description: dto.description !== undefined ? dto.description : current?.description,
      priority: this.formatPriorityForApi(dto.priority || current?.priority || 'MEDIUM'),
      dueDate: dto.dueDate !== undefined ? dto.dueDate : current?.dueDate,
      estimatedDurationMinutes:
        dto.estimatedDurationMinutes !== undefined
          ? dto.estimatedDurationMinutes
          : current?.estimatedDurationMinutes,
      autoSchedule:
        dto.autoSchedule !== undefined ? dto.autoSchedule : current?.autoSchedule ?? false,
      subtasks: dto.subtasks !== undefined ? dto.subtasks : current?.subtasks,
      version: dto.version ?? current?.version ?? 0,
    };

    return this.http
      .put<RawTaskResponse>(`/api/v1/workspaces/${wsId}/tasks/${taskId}`, payload)
      .pipe(
        map((res) => {
          const updated = this.mapRawTask(res);
          this.tasks.update((prev) =>
            prev.map((t) => (t.id === taskId ? updated : t))
          );
          return updated;
        })
      );
  }

  /**
   * Optimistically marks a task as completed.
   */
  completeTask(taskId: string): Observable<TaskItem> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    // Optimistic UI update
    this.tasks.update((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, lifecycleStatus: 'Completed', status: 'COMPLETED' }
          : t
      )
    );

    return this.http
      .post<RawTaskResponse>(`/api/v1/workspaces/${wsId}/tasks/${taskId}/complete`, {})
      .pipe(
        map((res) => {
          const synced = this.mapRawTask(res);
          this.tasks.update((prev) =>
            prev.map((t) => (t.id === taskId ? synced : t))
          );
          return synced;
        }),
        catchError((err) => {
          // Rollback on error
          this.loadTasks().subscribe();
          return throwError(() => err);
        })
      );
  }

  /**
   * Optimistically reopens a completed task.
   */
  reopenTask(taskId: string): Observable<TaskItem> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    // Optimistic UI update
    this.tasks.update((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, lifecycleStatus: 'Active', status: 'TODO' }
          : t
      )
    );

    return this.http
      .post<RawTaskResponse>(`/api/v1/workspaces/${wsId}/tasks/${taskId}/reopen`, {})
      .pipe(
        map((res) => {
          const synced = this.mapRawTask(res);
          this.tasks.update((prev) =>
            prev.map((t) => (t.id === taskId ? synced : t))
          );
          return synced;
        }),
        catchError((err) => {
          // Rollback on error
          this.loadTasks().subscribe();
          return throwError(() => err);
        })
      );
  }

  /**
   * Toggles task completed status.
   */
  toggleComplete(task: TaskItem): Observable<TaskItem> {
    if (task.lifecycleStatus === 'Completed') {
      return this.reopenTask(task.id);
    } else {
      return this.completeTask(task.id);
    }
  }

  /**
   * Soft deletes a task (recovers in 2-hour window).
   */
  softDeleteTask(taskId: string): Observable<void> {
    const wsId = this.wsId;
    if (!wsId) return of(undefined);

    const deletedItem = this.tasks().find((t) => t.id === taskId);
    // Optimistic UI removal
    this.tasks.update((prev) => prev.filter((t) => t.id !== taskId));
    if (deletedItem) {
      this.deletedTasks.update((prev) => [
        { ...deletedItem, lifecycleStatus: 'SoftDeleted', deletedAt: new Date().toISOString() },
        ...prev,
      ]);
    }

    return this.http
      .delete<void>(`/api/v1/workspaces/${wsId}/tasks/${taskId}`)
      .pipe(
        tap(() => {
          this.loadDeletedTasks().subscribe();
        }),
        catchError((err) => {
          this.loadTasks().subscribe();
          return throwError(() => err);
        })
      );
  }

  /**
   * Recovers a soft-deleted task back to active list.
   */
  recoverTask(taskId: string): Observable<TaskItem> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http
      .post<RawTaskResponse>(`/api/v1/workspaces/${wsId}/tasks/${taskId}/recover`, {})
      .pipe(
        map((res) => {
          const recovered = this.mapRawTask(res);
          this.deletedTasks.update((prev) => prev.filter((t) => t.id !== taskId));
          this.tasks.update((prev) => [recovered, ...prev]);
          return recovered;
        })
      );
  }

  // --- TAGS MANAGEMENT ---

  loadTags(): Observable<WorkspaceTag[]> {
    const wsId = this.wsId;
    if (!wsId) return of([]);

    return this.http
      .get<WorkspaceTag[]>(`/api/v1/workspaces/${wsId}/tags`)
      .pipe(
        map((list) => {
          const tags = list || [];
          this.tags.set(tags);
          return tags;
        }),
        catchError(() => {
          this.tags.set([]);
          return of([]);
        })
      );
  }

  createTag(dto: CreateWorkspaceTagDto): Observable<WorkspaceTag> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http
      .post<WorkspaceTag>(`/api/v1/workspaces/${wsId}/tags`, {
        name: dto.name.trim(),
        color: dto.color || '#10b981',
      })
      .pipe(
        tap((tag) => {
          this.tags.update((prev) => [...prev, tag]);
        })
      );
  }

  updateTag(tagId: string, dto: UpdateWorkspaceTagDto): Observable<WorkspaceTag> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http
      .put<WorkspaceTag>(`/api/v1/workspaces/${wsId}/tags/${tagId}`, dto)
      .pipe(
        tap((updated) => {
          this.tags.update((prev) =>
            prev.map((t) => (t.tagId === tagId ? updated : t))
          );
        })
      );
  }

  deleteTag(tagId: string): Observable<void> {
    const wsId = this.wsId;
    if (!wsId) return of(undefined);

    return this.http
      .delete<void>(`/api/v1/workspaces/${wsId}/tags/${tagId}`)
      .pipe(
        tap(() => {
          this.tags.update((prev) => prev.filter((t) => t.tagId !== tagId));
        })
      );
  }

  // --- RECURRENCE ---

  getRecurrence(taskId: string): Observable<RecurrenceTemplate | null> {
    const wsId = this.wsId;
    if (!wsId) return of(null);

    return this.http
      .get<RecurrenceTemplate>(`/api/v1/workspaces/${wsId}/tasks/${taskId}/recurrence`)
      .pipe(catchError(() => of(null)));
  }

  configureRecurrence(
    taskId: string,
    dto: ConfigureRecurrenceDto
  ): Observable<RecurrenceTemplate> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http
      .put<RecurrenceTemplate>(
        `/api/v1/workspaces/${wsId}/tasks/${taskId}/recurrence`,
        dto
      )
      .pipe(
        tap((res) => {
          this.tasks.update((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    hasRecurrence: true,
                    recurrencePattern: res.pattern,
                    recurrenceInterval: res.interval,
                    recurrenceStatus: res.recurrenceStatus,
                  }
                : t
            )
          );
        })
      );
  }

  pauseRecurrence(taskId: string): Observable<RecurrenceTemplate> {
    const wsId = this.wsId;
    return this.http
      .post<RecurrenceTemplate>(
        `/api/v1/workspaces/${wsId}/tasks/${taskId}/recurrence/pause`,
        {}
      )
      .pipe(
        tap((res) => {
          this.tasks.update((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, recurrenceStatus: 'Paused' } : t
            )
          );
        })
      );
  }

  resumeRecurrence(taskId: string): Observable<RecurrenceTemplate> {
    const wsId = this.wsId;
    return this.http
      .post<RecurrenceTemplate>(
        `/api/v1/workspaces/${wsId}/tasks/${taskId}/recurrence/resume`,
        {}
      )
      .pipe(
        tap((res) => {
          this.tasks.update((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, recurrenceStatus: 'Active' } : t
            )
          );
        })
      );
  }

  stopRecurrence(taskId: string): Observable<RecurrenceTemplate> {
    const wsId = this.wsId;
    return this.http
      .post<RecurrenceTemplate>(
        `/api/v1/workspaces/${wsId}/tasks/${taskId}/recurrence/stop`,
        {}
      )
      .pipe(
        tap((res) => {
          this.tasks.update((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    hasRecurrence: false,
                    recurrenceStatus: 'Stopped',
                  }
                : t
            )
          );
        })
      );
  }

  // --- TIME TRACKING & PRODUCTIVITY ---

  startTimer(taskId: string): Observable<TaskTimeLog> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http
      .post<TaskTimeLog>(`/api/v1/workspaces/${wsId}/tasks/${taskId}/timer/start`, {})
      .pipe(
        tap((log) => {
          this.activeTimer.set(log);
        })
      );
  }

  stopTimer(taskId: string, notes?: string): Observable<TaskTimeLog> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http
      .post<TaskTimeLog>(`/api/v1/workspaces/${wsId}/tasks/${taskId}/timer/stop`, {
        notes,
      })
      .pipe(
        tap(() => {
          this.activeTimer.set(null);
          this.loadProductivityStats().subscribe();
        })
      );
  }

  logCompletedSession(
    taskId: string,
    durationMinutes: number,
    notes?: string
  ): Observable<TaskTimeLog> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http
      .post<TaskTimeLog>(`/api/v1/workspaces/${wsId}/tasks/${taskId}/timer/log`, {
        durationMinutes,
        notes: notes?.trim() || null,
      })
      .pipe(
        tap(() => {
          this.activeTimer.set(null);
          this.loadProductivityStats().subscribe();
        })
      );
  }

  loadProductivityStats(): Observable<ProductivityStats | null> {
    const wsId = this.wsId;
    if (!wsId) return of(null);

    return this.http
      .get<ProductivityStats>(`/api/v1/workspaces/${wsId}/tasks/productivity/stats`)
      .pipe(
        tap((stats) => {
          this.productivityStats.set(stats);
        }),
        catchError(() => {
          this.productivityStats.set(null);
          return of(null);
        })
      );
  }

  // Filter helpers
  setSearch(search: string): void {
    this.filters.update((f) => ({ ...f, search }));
  }

  setStatusFilter(status: 'ALL' | 'ACTIVE' | 'COMPLETED'): void {
    this.filters.update((f) => ({ ...f, status }));
  }

  setPriorityFilter(priority: 'ALL' | TaskPriority): void {
    this.filters.update((f) => ({ ...f, priority }));
  }

  setTagFilter(tag: string | null): void {
    this.filters.update((f) => ({ ...f, tag: f.tag === tag ? null : tag }));
  }

  setViewMode(viewMode: 'list' | 'board'): void {
    this.filters.update((f) => ({ ...f, viewMode }));
  }

  private mapRawTask(r: RawTaskResponse): TaskItem {
    const pStr = (r.priority || 'Medium').toUpperCase();
    let priority: TaskPriority = 'MEDIUM';
    if (pStr === 'HIGH') priority = 'HIGH';
    else if (pStr === 'LOW') priority = 'LOW';

    const isCompleted = r.lifecycleStatus?.toLowerCase() === 'completed';
    const status: TaskStatus = isCompleted ? 'COMPLETED' : 'TODO';

    return {
      id: r.taskId,
      workspaceId: r.workspaceId,
      parentTaskId: r.parentTaskId,
      title: r.title,
      description: r.description,
      priority,
      tags: r.tags || [],
      dueDate: r.dueDate,
      estimatedDurationMinutes: r.estimatedDurationMinutes,
      autoSchedule: r.autoSchedule,
      subtasks: r.subtasks,
      lifecycleStatus: isCompleted ? 'Completed' : (r.lifecycleStatus as any) || 'Active',
      status,
      version: r.version || 0,
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.updatedAt || new Date().toISOString(),
    };
  }

  private formatPriorityForApi(p: TaskPriority): string {
    switch (p) {
      case 'HIGH':
        return 'High';
      case 'LOW':
        return 'Low';
      default:
        return 'Medium';
    }
  }
}
