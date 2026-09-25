package com.assistant.agent.application.service;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.NoteId;
import com.assistant.memory.domain.repository.NoteRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Augments user prompts with context such as referenced Notes (@Note). */
@Component
public class AgentContextAugmenter {

  private final NoteRepository noteRepository;

  public AgentContextAugmenter(NoteRepository noteRepository) {
    this.noteRepository = noteRepository;
  }

  public String augmentWithNotes(String prompt, List<UUID> noteIds, WorkspaceId workspaceId) {
    if (noteIds == null || noteIds.isEmpty()) {
      return prompt;
    }

    StringBuilder noteContext = new StringBuilder("\n\n[Attached Notes Context (@Note)]:\n");
    for (UUID noteId : noteIds) {
      try {
        var noteOpt = noteRepository.findById(workspaceId, new NoteId(noteId));
        if (noteOpt.isPresent()) {
          var note = noteOpt.get();
          noteContext
              .append("--- Note: \"")
              .append(note.getTitle())
              .append("\" (ID: ")
              .append(note.getId().value())
              .append(") ---\n");
          noteContext.append(note.getContent() != null ? note.getContent() : "").append("\n\n");
        } else {
          noteContext.append("- ID Note: ").append(noteId.toString()).append("\n");
        }
      } catch (Exception e) {
        noteContext.append("- ID Note: ").append(noteId.toString()).append("\n");
      }
    }

    return prompt + noteContext.toString();
  }
}
