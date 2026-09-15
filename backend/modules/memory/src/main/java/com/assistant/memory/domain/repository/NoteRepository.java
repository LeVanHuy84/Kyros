package com.assistant.memory.domain.repository;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.Note;
import com.assistant.memory.domain.model.NoteId;
import java.util.List;
import java.util.Optional;

public interface NoteRepository {
  void save(Note note);

  List<Note> findByWorkspaceId(WorkspaceId workspaceId);

  Optional<Note> findById(WorkspaceId workspaceId, NoteId noteId);

  void delete(Note note);
}
