package com.assistant.bootstrap.briefing;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/executive/briefing")
public class ExecutiveBriefingController {

  private final ExecutiveBriefingService briefingService;

  public ExecutiveBriefingController(ExecutiveBriefingService briefingService) {
    this.briefingService = briefingService;
  }

  private void validateWorkspace(UUID pathWorkspaceId) {
    UUID authenticatedWorkspaceId = WorkspaceContextHolder.getRequired().value();
    if (!authenticatedWorkspaceId.equals(pathWorkspaceId)) {
      throw new AccessDeniedException("Access denied. You do not have access to this workspace.");
    }
  }

  private UUID resolveUserId(UUID fallback) {
    return fallback != null ? fallback : UUID.fromString("00000000-0000-0000-0000-000000000001");
  }

  @GetMapping("/today")
  public ResponseEntity<ExecutiveBriefingService.ExecutiveBriefingDto> getTodayBriefing(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "userId", required = false) UUID userId,
      @RequestParam(name = "type", defaultValue = "MORNING") String type) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    UserId uId = new UserId(resolveUserId(userId));

    var result =
        "EVENING".equalsIgnoreCase(type)
            ? briefingService.generateEveningWrapup(wsId, uId, false)
            : briefingService.generateMorningBriefing(wsId, uId, false);
    return ResponseEntity.ok(result);
  }

  @PostMapping("/generate")
  public ResponseEntity<ExecutiveBriefingService.ExecutiveBriefingDto> generateAndSendBriefing(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "userId", required = false) UUID userId,
      @RequestParam(name = "type", defaultValue = "MORNING") String type,
      @RequestParam(name = "sendNotification", defaultValue = "true") boolean sendNotification) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    UserId uId = new UserId(resolveUserId(userId));

    var result =
        "EVENING".equalsIgnoreCase(type)
            ? briefingService.generateEveningWrapup(wsId, uId, sendNotification)
            : briefingService.generateMorningBriefing(wsId, uId, sendNotification);
    return ResponseEntity.ok(result);
  }
}
