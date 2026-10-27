export interface ExecutiveBriefingData {
  type?: 'MORNING' | 'EVENING' | string;
  title?: string;
  markdownContent?: string;
  totalEvents?: number;
  totalTasksPending?: number;
  totalTasksCompleted?: number;
  workspaceId?: string;
  generatedAt?: string;
  greeting?: string;
  summary?: string;
  topPriorities?: string[];
  scheduleOverview?: string[];
  aiRecommendations?: string[];
  [key: string]: unknown;
}
