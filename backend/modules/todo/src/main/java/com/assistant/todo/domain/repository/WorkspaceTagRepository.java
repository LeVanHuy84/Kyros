package com.assistant.todo.domain.repository;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.domain.model.WorkspaceTag;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceTagRepository {

  List<WorkspaceTag> findAllByWorkspaceId(WorkspaceId workspaceId);

  Optional<WorkspaceTag> findById(UUID id, WorkspaceId workspaceId);

  boolean existsByNameAndWorkspaceId(String name, WorkspaceId workspaceId);

  WorkspaceTag save(WorkspaceTag tag);

  void delete(UUID id, WorkspaceId workspaceId);
}
