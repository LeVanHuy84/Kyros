package com.assistant.memory.presentation;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.dto.NoteDto;
import com.assistant.memory.application.service.NoteService;
import com.assistant.memory.domain.model.NoteId;
import com.assistant.memory.presentation.dto.CreateNoteRequest;
import com.assistant.memory.presentation.dto.UpdateNoteRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/notes")
public class NoteController {

  private final NoteService noteService;

  public NoteController(NoteService noteService) {
    this.noteService = noteService;
  }

  private void validateWorkspace(UUID pathWorkspaceId) {
    UUID authenticatedWorkspaceId = WorkspaceContextHolder.getRequired().value();
    if (!authenticatedWorkspaceId.equals(pathWorkspaceId)) {
      throw new AccessDeniedException("Access denied. You do not have access to this workspace.");
    }
  }

  @PostMapping
  public ResponseEntity<NoteDto> createNote(
      @PathVariable("workspaceId") UUID workspaceId,
      @Valid @RequestBody CreateNoteRequest request) {
    validateWorkspace(workspaceId);
    // Standard system userId fallback or context holder
    UserId userId = new UserId(UUID.fromString("00000000-0000-0000-0000-000000000000"));

    NoteDto note =
        noteService.createNote(
            new WorkspaceId(workspaceId),
            userId,
            request.title(),
            request.content(),
            request.taskId(),
            request.eventId());

    return ResponseEntity.created(
            URI.create("/api/v1/workspaces/" + workspaceId + "/notes/" + note.id()))
        .body(note);
  }

  @GetMapping
  public ResponseEntity<List<NoteDto>> listNotes(
      @PathVariable("workspaceId") UUID workspaceId) {
    validateWorkspace(workspaceId);
    return ResponseEntity.ok(noteService.listNotes(new WorkspaceId(workspaceId)));
  }

  @GetMapping("/{noteId}")
  public ResponseEntity<NoteDto> getNote(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("noteId") UUID noteId) {
    validateWorkspace(workspaceId);
    return ResponseEntity.ok(
        noteService.getNote(new WorkspaceId(workspaceId), new NoteId(noteId)));
  }

  @PutMapping("/{noteId}")
  public ResponseEntity<NoteDto> updateNote(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("noteId") UUID noteId,
      @Valid @RequestBody UpdateNoteRequest request) {
    validateWorkspace(workspaceId);
    return ResponseEntity.ok(
        noteService.updateNote(
            new WorkspaceId(workspaceId),
            new NoteId(noteId),
            request.title(),
            request.content(),
            request.taskId(),
            request.eventId()));
  }

  @DeleteMapping("/{noteId}")
  public ResponseEntity<Void> deleteNote(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("noteId") UUID noteId) {
    validateWorkspace(workspaceId);
    noteService.deleteNote(new WorkspaceId(workspaceId), new NoteId(noteId));
    return ResponseEntity.noContent().build();
  }
}
