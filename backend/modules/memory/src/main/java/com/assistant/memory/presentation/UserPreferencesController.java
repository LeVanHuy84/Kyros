package com.assistant.memory.presentation;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.dto.PreferencesDTO;
import com.assistant.memory.application.dto.UpdatePreferencesCommand;
import com.assistant.memory.application.service.MemoryApplicationService;
import com.assistant.memory.presentation.dto.UpdatePreferencesRequest;
import com.assistant.memory.presentation.dto.UserPreferencesResponse;
import com.assistant.workspace.presentation.SecurityUtils;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/preferences")
public class UserPreferencesController {

  private final MemoryApplicationService memoryService;

  public UserPreferencesController(MemoryApplicationService memoryService) {
    this.memoryService = memoryService;
  }

  private void validateWorkspace(UUID pathWorkspaceId) {
    UUID authenticatedWorkspaceId = WorkspaceContextHolder.getRequired().value();
    if (!authenticatedWorkspaceId.equals(pathWorkspaceId)) {
      throw new AccessDeniedException("Access denied. You do not have access to this workspace.");
    }
  }

  @GetMapping
  public ResponseEntity<UserPreferencesResponse> getUserPreferences(
      @PathVariable("workspaceId") UUID workspaceId) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();

    PreferencesDTO prefs = memoryService.getUserPreferences(new WorkspaceId(workspaceId), userId);

    return ResponseEntity.ok(toResponse(prefs));
  }

  @PutMapping
  public ResponseEntity<UserPreferencesResponse> updatePreferences(
      @PathVariable("workspaceId") UUID workspaceId,
      @Valid @RequestBody UpdatePreferencesRequest request) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();

    UpdatePreferencesCommand command =
        new UpdatePreferencesCommand(
            new WorkspaceId(workspaceId),
            userId,
            request.timezone(),
            request.defaultPriority(),
            request.preventCalendarOverlap(),
            request.leadTimeMinutes());

    memoryService.updatePreferences(command);

    PreferencesDTO updated = memoryService.getUserPreferences(new WorkspaceId(workspaceId), userId);

    return ResponseEntity.ok(toResponse(updated));
  }

  @PostMapping("/reset")
  public ResponseEntity<UserPreferencesResponse> resetPreferences(
      @PathVariable("workspaceId") UUID workspaceId) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();

    memoryService.resetUserPreferences(new WorkspaceId(workspaceId), userId);

    PreferencesDTO reset = memoryService.getUserPreferences(new WorkspaceId(workspaceId), userId);

    return ResponseEntity.ok(toResponse(reset));
  }

  private UserPreferencesResponse toResponse(PreferencesDTO dto) {
    return new UserPreferencesResponse(
        dto.workspaceId(),
        dto.userId(),
        dto.timezone(),
        dto.defaultPriority(),
        dto.preventCalendarOverlap(),
        dto.leadTimeMinutes());
  }
}
