package com.assistant.memory.application.service;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.dto.NoteDto;
import com.assistant.memory.domain.model.Note;
import com.assistant.memory.domain.model.NoteId;
import com.assistant.memory.domain.repository.NoteRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NoteService {

  private final NoteRepository noteRepository;

  public NoteService(NoteRepository noteRepository) {
    this.noteRepository = noteRepository;
  }

  public NoteDto createNote(
      WorkspaceId workspaceId,
      UserId userId,
      String title,
      String content,
      UUID taskId,
      UUID eventId) {
    Note note = new Note(NoteId.random(), workspaceId, userId, title, content, taskId, eventId);

    noteRepository.save(note);
    return toDto(note);
  }

  @Transactional(readOnly = true)
  public List<NoteDto> listNotes(WorkspaceId workspaceId) {
    return noteRepository.findByWorkspaceId(workspaceId).stream()
        .map(this::toDto)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public NoteDto getNote(WorkspaceId workspaceId, NoteId noteId) {
    Note note =
        noteRepository
            .findById(workspaceId, noteId)
            .orElseThrow(() -> new IllegalArgumentException("Note not found: " + noteId.value()));
    return toDto(note);
  }

  public NoteDto updateNote(
      WorkspaceId workspaceId,
      NoteId noteId,
      String title,
      String content,
      UUID taskId,
      UUID eventId) {
    Note note =
        noteRepository
            .findById(workspaceId, noteId)
            .orElseThrow(() -> new IllegalArgumentException("Note not found: " + noteId.value()));

    note.update(title, content, taskId, eventId);
    noteRepository.save(note);
    return toDto(note);
  }

  public void deleteNote(WorkspaceId workspaceId, NoteId noteId) {
    Note note =
        noteRepository
            .findById(workspaceId, noteId)
            .orElseThrow(() -> new IllegalArgumentException("Note not found: " + noteId.value()));
    noteRepository.delete(note);
  }

  private NoteDto toDto(Note note) {
    return new NoteDto(
        note.getId().value(),
        note.getWorkspaceId().value(),
        note.getUserId().value(),
        note.getTitle(),
        note.getContent(),
        note.getTaskId(),
        note.getEventId(),
        note.getCreatedAt(),
        note.getUpdatedAt());
  }
}
