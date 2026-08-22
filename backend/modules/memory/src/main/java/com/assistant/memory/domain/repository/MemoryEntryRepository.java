package com.assistant.memory.domain.repository;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryId;
import java.util.List;
import java.util.Optional;

public interface MemoryEntryRepository {
  Optional<MemoryEntry> findById(MemoryId id, WorkspaceId workspaceId);

  List<MemoryEntry> findByUser(WorkspaceId workspaceId, UserId userId, int offset, int limit);

  long countByUser(WorkspaceId workspaceId, UserId userId);

  List<MemoryEntry> findBySemanticQuery(
      WorkspaceId workspaceId, String queryText, int limit, double confidenceThreshold);

  void save(MemoryEntry entry);

  void delete(MemoryId id, WorkspaceId workspaceId);
}
