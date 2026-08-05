package com.assistant.workspace.application.services;

import static org.junit.jupiter.api.Assertions.*;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.UserRegistered;
import com.assistant.workspace.domain.Membership;
import com.assistant.workspace.domain.Workspace;
import com.assistant.workspace.domain.WorkspaceRepository;
import com.assistant.workspace.domain.WorkspaceRole;
import com.assistant.workspace.domain.WorkspaceStatus;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WorkspaceServiceTest {

  private FakeWorkspaceRepository workspaceRepository;
  private WorkspaceService workspaceService;

  @BeforeEach
  void setUp() {
    workspaceRepository = new FakeWorkspaceRepository();
    workspaceService = new WorkspaceService(workspaceRepository);
  }

  @Test
  void shouldCreateFirstWorkspaceAsPrimary() {
    UserId userId = UserId.random();
    String name = "Project A Workspace";

    Workspace workspace = workspaceService.createWorkspace(name, userId);

    assertNotNull(workspace);
    assertEquals(name, workspace.getName());
    assertEquals(userId, workspace.getOwnerId());
    assertEquals(WorkspaceStatus.Active, workspace.getStatus());

    // Memberships check
    List<Membership> memberships = workspace.getMemberships();
    assertEquals(1, memberships.size());
    Membership ownerMembership = memberships.get(0);
    assertEquals(userId, ownerMembership.getUserId());
    assertEquals(WorkspaceRole.Owner, ownerMembership.getRole());
    // First workspace membership should be primary!
    assertTrue(ownerMembership.isPrimary());
  }

  @Test
  void shouldCreateSecondWorkspaceAsNonPrimary() {
    UserId userId = UserId.random();
    workspaceService.createWorkspace("First Workspace", userId);

    Workspace secondWorkspace = workspaceService.createWorkspace("Second Workspace", userId);

    List<Membership> memberships = secondWorkspace.getMemberships();
    assertEquals(1, memberships.size());
    Membership membership = memberships.get(0);
    assertEquals(userId, membership.getUserId());
    assertFalse(membership.isPrimary());
  }

  @Test
  void shouldSwitchPrimaryWorkspaceSuccessfully() {
    UserId userId = UserId.random();
    Workspace w1 = workspaceService.createWorkspace("First", userId);
    Workspace w2 = workspaceService.createWorkspace("Second", userId);

    // Initial state: w1 is primary, w2 is not
    assertTrue(w1.getMemberships().get(0).isPrimary());
    assertFalse(w2.getMemberships().get(0).isPrimary());

    // Switch to w2
    workspaceService.setPrimaryWorkspace(w2.getId(), userId);

    // Reload or check stored state
    Workspace w1Reloaded = workspaceRepository.findById(w1.getId()).orElseThrow();
    Workspace w2Reloaded = workspaceRepository.findById(w2.getId()).orElseThrow();

    assertFalse(w1Reloaded.getMemberships().get(0).isPrimary());
    assertTrue(w2Reloaded.getMemberships().get(0).isPrimary());
  }

  @Test
  void shouldHandleUserRegisteredEventAndCreateDefaultWorkspace() {
    UserId userId = UserId.random();
    String email = "registered-user@example.com";
    UserRegistered event = new UserRegistered(userId, email);

    workspaceService.handleUserRegistered(event);

    List<Workspace> workspaces = workspaceService.getUserWorkspaces(userId);
    assertEquals(1, workspaces.size());
    Workspace ws = workspaces.get(0);
    assertEquals("Default Workspace", ws.getName());
    assertEquals(userId, ws.getOwnerId());
    assertTrue(ws.getMemberships().get(0).isPrimary());
  }

  // FAKE WORKSPACE REPOSITORY

  private static class FakeWorkspaceRepository implements WorkspaceRepository {
    private final Map<WorkspaceId, Workspace> workspaces = new HashMap<>();
    private final List<Membership> memberships = new ArrayList<>();

    @Override
    public Workspace save(Workspace workspace) {
      workspaces.put(workspace.getId(), workspace);

      // Update memberships list
      workspace
          .getMemberships()
          .forEach(
              m -> {
                memberships.removeIf(existing -> existing.getId().equals(m.getId()));
                memberships.add(m);
              });

      return workspace;
    }

    @Override
    public Optional<Workspace> findById(WorkspaceId id) {
      return Optional.ofNullable(workspaces.get(id));
    }

    @Override
    public List<Workspace> findByUserId(UserId userId) {
      List<Workspace> results = new ArrayList<>();
      for (Workspace ws : workspaces.values()) {
        boolean isMember = ws.getMemberships().stream().anyMatch(m -> m.getUserId().equals(userId));
        if (isMember) {
          results.add(ws);
        }
      }
      return results;
    }

    @Override
    public Optional<Membership> findPrimaryMembership(UserId userId) {
      return memberships.stream()
          .filter(m -> m.getUserId().equals(userId) && m.isPrimary())
          .findFirst();
    }

    @Override
    public void saveMembership(Membership membership) {
      memberships.removeIf(existing -> existing.getId().equals(membership.getId()));
      memberships.add(membership);

      // Sync back to workspace if cached
      Workspace ws = workspaces.get(membership.getWorkspaceId());
      if (ws != null) {
        // Since memberships list is private mutable, we can ensure it's in sync
        for (Membership m : ws.getMemberships()) {
          if (m.getId().equals(membership.getId())) {
            if (m.isPrimary() != membership.isPrimary()) {
              m.setPrimary(membership.isPrimary());
            }
          }
        }
      }
    }

    @Override
    public boolean existsMembership(WorkspaceId workspaceId, UserId userId) {
      return memberships.stream()
          .anyMatch(m -> m.getWorkspaceId().equals(workspaceId) && m.getUserId().equals(userId));
    }

    @Override
    public Optional<WorkspaceRole> findRole(WorkspaceId workspaceId, UserId userId) {
      return memberships.stream()
          .filter(m -> m.getWorkspaceId().equals(workspaceId) && m.getUserId().equals(userId))
          .map(Membership::getRole)
          .findFirst();
    }
  }
}
