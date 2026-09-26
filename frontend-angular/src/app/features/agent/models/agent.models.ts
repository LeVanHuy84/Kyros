export interface ConversationItem {
  id: string;
  title: string;
  status?: string;
  updatedAt?: string;
}

export interface MessageItem {
  id?: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  time?: string;
  isStreaming?: boolean;
  activeThoughtStatus?: string;
  thoughtSteps?: string[];
  attachedNotes?: { id: string; title: string }[];
}

export interface PendingApprovalData {
  toolName: string;
  argumentsJson: string;
  reason: string;
}
