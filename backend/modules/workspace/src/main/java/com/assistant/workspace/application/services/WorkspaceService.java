package com.assistant.workspace.application.services;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.UserRegistered;
import com.assistant.workspace.application.ports.in.TenantValidationPort;
import com.assistant.workspace.application.ports.in.WorkspacePort;
import com.assistant.workspace.domain.Membership;
import com.assistant.workspace.domain.Workspace;
import com.assistant.workspace.domain.WorkspaceRepository;
import com.assistant.workspace.domain.WorkspaceRole;
import java.util.List;
import java.util.Optional;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkspaceService implements WorkspacePort, TenantValidationPort {

  private final WorkspaceRepository workspaceRepository;
  private final org.springframework.context.ApplicationEventPublisher eventPublisher;

  public WorkspaceService(
      WorkspaceRepository workspaceRepository,
      org.springframework.context.ApplicationEventPublisher eventPublisher) {
    this.workspaceRepository = workspaceRepository;
    this.eventPublisher = eventPublisher;
  }

  @Override
  @Transactional
  public Workspace createWorkspace(String name, UserId ownerId) {
    WorkspaceId workspaceId = WorkspaceId.random();
    Workspace workspace = new Workspace(workspaceId, name, ownerId);

    // Check if the user already has a primary workspace. If not, make this membership primary.
    boolean hasPrimary = workspaceRepository.findPrimaryMembership(ownerId).isPresent();
    if (!hasPrimary) {
      workspace
          .getMemberships()
          .forEach(
              m -> {
                if (m.getUserId().equals(ownerId)) {
                  m.setPrimary(true);
                }
              });
    }

    Workspace saved = workspaceRepository.save(workspace);
    eventPublisher.publishEvent(
        new com.assistant.kernel.event.WorkspaceProvisioned(workspaceId, ownerId));
    return saved;
  }

  @Override
  @Transactional(readOnly = true)
  public List<Workspace> getUserWorkspaces(UserId userId) {
    return workspaceRepository.findByUserId(userId);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Workspace> getPrimaryWorkspace(UserId userId) {
    return workspaceRepository
        .findPrimaryMembership(userId)
        .flatMap(membership -> workspaceRepository.findById(membership.getWorkspaceId()));
  }

  @Override
  @Transactional
  public void setPrimaryWorkspace(WorkspaceId workspaceId, UserId userId) {
    // Check if user is a member of the target workspace
    if (!workspaceRepository.existsMembership(workspaceId, userId)) {
      throw new IllegalStateException("User is not a member of the target workspace");
    }

    // Load user's workspaces
    List<Workspace> userWorkspaces = workspaceRepository.findByUserId(userId);

    // Update memberships
    for (Workspace ws : userWorkspaces) {
      for (Membership m : ws.getMemberships()) {
        if (m.getUserId().equals(userId)) {
          boolean target = ws.getId().equals(workspaceId);
          if (m.isPrimary() != target) {
            m.setPrimary(target);
            workspaceRepository.saveMembership(m);
          }
        }
      }
    }
  }

  @Override
  @Transactional(readOnly = true)
  public boolean isMember(WorkspaceId workspaceId, UserId userId) {
    return workspaceRepository.existsMembership(workspaceId, userId);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<WorkspaceRole> getUserRole(WorkspaceId workspaceId, UserId userId) {
    return workspaceRepository.findRole(workspaceId, userId);
  }

  @EventListener
  @Transactional
  public void handleUserRegistered(UserRegistered event) {
    String defaultWorkspaceName = "Default Workspace";
    createWorkspace(defaultWorkspaceName, event.userId());
  }
}
