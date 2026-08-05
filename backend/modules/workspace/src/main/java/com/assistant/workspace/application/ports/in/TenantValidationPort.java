package com.assistant.workspace.application.ports.in;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.workspace.domain.WorkspaceRole;
import java.util.Optional;

public interface TenantValidationPort {

  boolean isMember(WorkspaceId workspaceId, UserId userId);

  Optional<WorkspaceRole> getUserRole(WorkspaceId workspaceId, UserId userId);
}
