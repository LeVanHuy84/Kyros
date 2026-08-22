export interface Preferences {
  timezone: string;
  defaultPriority: 'High' | 'Medium' | 'Low';
  preventCalendarOverlap: boolean;
  leadTimeMinutes: number;
}

export interface MemoryEntry {
  id: string;
  workspaceId: string;
  content: string;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  title: string;
  lastTurnTimestamp: string | null;
  status: 'Active' | 'Cleared' | 'Archived';
}

export interface ConversationTurn {
  id: string;
  role: 'User' | 'Agent';
  content: string;
  timestamp: string;
}
