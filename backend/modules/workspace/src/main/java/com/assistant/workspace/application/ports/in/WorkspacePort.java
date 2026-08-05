package com.assistant.workspace.application.ports.in;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.workspace.domain.Workspace;
import java.util.List;
import java.util.Optional;

public interface WorkspacePort {

  Workspace createWorkspace(String name, UserId ownerId);

  List<Workspace> getUserWorkspaces(UserId userId);

  Optional<Workspace> getPrimaryWorkspace(UserId userId);

  void setPrimaryWorkspace(WorkspaceId workspaceId, UserId userId);
}
