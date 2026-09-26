export interface MemoryEntry {
  id: string;
  workspaceId: string;
  content: string;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryEntryRequest {
  content: string;
  confidenceScore?: number;
}

export interface UpdateMemoryEntryRequest {
  content: string;
  confidenceScore?: number;
}

export interface ConversationSummary {
  id: string;
  conversationId?: string;
  workspaceId: string;
  title: string;
  lastTurnTimestamp: string | null;
  status: string;
}

export interface ConversationTurn {
  id: string;
  turnId?: string;
  role: 'User' | 'Agent' | 'Assistant' | 'System' | string;
  content: string;
  timestamp: string;
}

export interface MemoryEntriesApiResponse {
  data: MemoryEntry[];
  meta: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface ConversationsApiResponse {
  data: ConversationSummary[];
  meta: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}
