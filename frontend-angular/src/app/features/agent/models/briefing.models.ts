export interface ExecutiveBriefingData {
  workspaceId?: string;
  generatedAt?: string;
  greeting?: string;
  summary?: string;
  topPriorities?: string[];
  scheduleOverview?: string[];
  aiRecommendations?: string[];
  [key: string]: unknown;
}
