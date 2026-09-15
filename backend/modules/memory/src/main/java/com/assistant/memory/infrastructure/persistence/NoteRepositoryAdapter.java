package com.assistant.memory.infrastructure.persistence;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.Note;
import com.assistant.memory.domain.model.NoteId;
import com.assistant.memory.domain.repository.NoteRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class NoteRepositoryAdapter implements NoteRepository {

  private final SpringDataNoteRepository springDataNoteRepository;

  public NoteRepositoryAdapter(SpringDataNoteRepository springDataNoteRepository) {
    this.springDataNoteRepository = springDataNoteRepository;
  }

  @Override
  public void save(Note note) {
    NoteJpaEntity entity =
        new NoteJpaEntity(
            note.getId().value(),
            note.getWorkspaceId().value(),
            note.getUserId().value(),
            note.getTitle(),
            note.getContent(),
            note.getTaskId(),
            note.getEventId(),
            note.getCreatedAt(),
            note.getUpdatedAt(),
            note.getVersion());
    springDataNoteRepository.save(entity);
  }

  @Override
  public List<Note> findByWorkspaceId(WorkspaceId workspaceId) {
    return springDataNoteRepository
        .findByWorkspaceIdOrderByCreatedAtDesc(workspaceId.value())
        .stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public Optional<Note> findById(WorkspaceId workspaceId, NoteId noteId) {
    return springDataNoteRepository
        .findById(noteId.value())
        .filter(e -> e.getWorkspaceId().equals(workspaceId.value()))
        .map(this::toDomain);
  }

  @Override
  public void delete(Note note) {
    springDataNoteRepository.deleteById(note.getId().value());
  }

  private Note toDomain(NoteJpaEntity entity) {
    return new Note(
        new NoteId(entity.getId()),
        new WorkspaceId(entity.getWorkspaceId()),
        new UserId(entity.getUserId()),
        entity.getTitle(),
        entity.getContent(),
        entity.getTaskId(),
        entity.getEventId(),
        entity.getCreatedAt(),
        entity.getUpdatedAt(),
        entity.getVersion());
  }
}
