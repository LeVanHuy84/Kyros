package com.assistant.workspace.domain;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.util.List;
import java.util.Optional;

public interface WorkspaceRepository {

  Workspace save(Workspace workspace);

  Optional<Workspace> findById(WorkspaceId id);

  List<Workspace> findByUserId(UserId userId);

  Optional<Membership> findPrimaryMembership(UserId userId);

  void saveMembership(Membership membership);

  boolean existsMembership(WorkspaceId workspaceId, UserId userId);

  Optional<WorkspaceRole> findRole(WorkspaceId workspaceId, UserId userId);
}
