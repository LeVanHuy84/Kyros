export interface Note {
  id: string;
  title: string;
  content?: string;
  taskId?: string | null;
  eventId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  taskId?: string | null;
  eventId?: string | null;
}

export interface UpdateNoteRequest {
  title: string;
  content: string;
  taskId?: string | null;
  eventId?: string | null;
}
