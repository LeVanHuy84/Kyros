package com.assistant.agent.presentation;

import com.assistant.agent.application.dto.UserAiConfigDto;
import com.assistant.agent.application.service.UserAiConfigService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/agent/ai-config")
public class UserAiConfigController {

  private final UserAiConfigService aiConfigService;

  public UserAiConfigController(UserAiConfigService aiConfigService) {
    this.aiConfigService = aiConfigService;
  }

  @GetMapping
  public ResponseEntity<UserAiConfigDto> getConfig(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "userId", required = false) UUID userId) {
    UUID finalUserId =
        userId != null ? userId : UUID.fromString("00000000-0000-0000-0000-000000000001");
    UserAiConfigDto dto = aiConfigService.getMaskedConfig(workspaceId, finalUserId);
    return ResponseEntity.ok(dto);
  }

  @PutMapping
  public ResponseEntity<UserAiConfigDto> saveConfig(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "userId", required = false) UUID userId,
      @RequestBody UserAiConfigDto dto) {
    UUID finalUserId =
        userId != null ? userId : UUID.fromString("00000000-0000-0000-0000-000000000001");
    UserAiConfigDto saved = aiConfigService.saveConfig(workspaceId, finalUserId, dto);
    return ResponseEntity.ok(saved);
  }
}
