package com.assistant.agent.application.service;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.NoteId;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import com.assistant.memory.domain.repository.NoteRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Augments user prompts with dynamic context including: 1. Dynamic Memory Recall (Top 3-5 relevant
 * user facts/rules from Memory Vault) 2. Attached Notes (@Note)
 */
@Component
public class AgentContextAugmenter {

  private final NoteRepository noteRepository;
  private final MemoryEntryRepository memoryEntryRepository;

  @Autowired
  public AgentContextAugmenter(
      NoteRepository noteRepository,
      @Autowired(required = false) MemoryEntryRepository memoryEntryRepository) {
    this.noteRepository = noteRepository;
    this.memoryEntryRepository = memoryEntryRepository;
  }

  public AgentContextAugmenter(NoteRepository noteRepository) {
    this(noteRepository, null);
  }

  /** Main entry point to augment prompt with attached notes and dynamic memory recall. */
  public String augmentPrompt(String prompt, List<UUID> noteIds, WorkspaceId workspaceId) {
    String withNotes = augmentWithNotes(prompt, noteIds, workspaceId);
    return augmentWithDynamicMemory(withNotes, prompt, workspaceId);
  }

  public String augmentWithNotes(String prompt, List<UUID> noteIds, WorkspaceId workspaceId) {
    if (noteIds == null || noteIds.isEmpty() || noteRepository == null) {
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

  public String augmentWithDynamicMemory(
      String currentPrompt, String userQuery, WorkspaceId workspaceId) {
    if (memoryEntryRepository == null || userQuery == null || userQuery.isBlank()) {
      return currentPrompt;
    }

    try {
      List<MemoryEntry> relevantMemories =
          memoryEntryRepository.findBySemanticQuery(workspaceId, userQuery, 3, 0.60);

      if (relevantMemories == null || relevantMemories.isEmpty()) {
        return currentPrompt;
      }

      StringBuilder memContext =
          new StringBuilder("\n\n[Relevant User Long-term Memory & Rules Vault]:\n");
      for (MemoryEntry entry : relevantMemories) {
        memContext
            .append("• ")
            .append(entry.getContent())
            .append(" (Confidence: ")
            .append(String.format("%.0f%%", entry.getConfidenceScore() * 100))
            .append(")\n");
      }

      return currentPrompt + memContext.toString();
    } catch (Exception e) {
      return currentPrompt;
    }
  }
}
