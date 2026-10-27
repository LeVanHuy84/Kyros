export interface WorkspaceDocument {
  id: string;
  workspaceId: string;
  userId?: string;
  filename: string;
  contentType: string;
  fileSize: number;
  chunkCount: number;
  createdAt: string;
}
