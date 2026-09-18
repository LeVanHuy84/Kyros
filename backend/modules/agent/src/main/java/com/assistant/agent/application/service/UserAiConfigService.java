package com.assistant.agent.application.service;

import com.assistant.agent.application.dto.UserAiConfigDto;
import com.assistant.agent.domain.model.UserAiConfig;
import com.assistant.agent.domain.repository.UserAiConfigRepository;
import com.assistant.agent.domain.security.VaultEncryptionPort;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserAiConfigService {

  private final UserAiConfigRepository repository;
  private final VaultEncryptionPort encryptionPort;

  public UserAiConfigService(
      UserAiConfigRepository repository, VaultEncryptionPort encryptionPort) {
    this.repository = repository;
    this.encryptionPort = encryptionPort;
  }

  @Transactional(readOnly = true)
  public UserAiConfigDto getMaskedConfig(UUID workspaceId, UUID userId) {
    Optional<UserAiConfig> configOpt = repository.findByWorkspaceIdAndUserId(workspaceId, userId);
    if (configOpt.isEmpty()) {
      return new UserAiConfigDto(
          "groq", "", "https://api.groq.com/openai/v1", "llama-3.3-70b-versatile", false);
    }
    UserAiConfig config = configOpt.get();
    String decrypted = encryptionPort.decrypt(config.getApiKeyEncrypted());
    boolean hasKey = decrypted != null && !decrypted.isBlank();
    String maskedKey = hasKey ? maskKey(decrypted) : "";

    return new UserAiConfigDto(
        config.getProvider() != null ? config.getProvider() : "groq",
        maskedKey,
        config.getBaseUrl() != null ? config.getBaseUrl() : "https://api.groq.com/openai/v1",
        config.getModel() != null ? config.getModel() : "llama-3.3-70b-versatile",
        hasKey);
  }

  @Transactional
  public UserAiConfigDto saveConfig(UUID workspaceId, UUID userId, UserAiConfigDto dto) {
    Instant now = Instant.now();
    UserAiConfig config =
        repository
            .findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseGet(
                () ->
                    new UserAiConfig(
                        UUID.randomUUID(),
                        workspaceId,
                        userId,
                        dto.provider(),
                        "",
                        dto.baseUrl(),
                        dto.model(),
                        now,
                        now));

    config.setProvider(dto.provider());
    config.setBaseUrl(dto.baseUrl());
    config.setModel(dto.model());
    config.setUpdatedAt(now);

    if (dto.apiKey() != null && !dto.apiKey().isBlank() && !dto.apiKey().contains("***")) {
      config.setApiKeyEncrypted(encryptionPort.encrypt(dto.apiKey()));
    }

    repository.save(config);
    return getMaskedConfig(workspaceId, userId);
  }

  @Transactional(readOnly = true)
  public DecryptedAiConfig getDecryptedConfig(UUID workspaceId, UUID userId) {
    Optional<UserAiConfig> configOpt = repository.findByWorkspaceIdAndUserId(workspaceId, userId);
    if (configOpt.isEmpty()) {
      return new DecryptedAiConfig(null, null, null, null);
    }
    UserAiConfig config = configOpt.get();
    String decryptedKey = encryptionPort.decrypt(config.getApiKeyEncrypted());
    return new DecryptedAiConfig(
        config.getProvider(), decryptedKey, config.getBaseUrl(), config.getModel());
  }

  private String maskKey(String key) {
    if (key == null || key.length() <= 8) {
      return "******";
    }
    String prefix = key.substring(0, 4);
    String suffix = key.substring(key.length() - 4);
    return prefix + "***" + suffix;
  }

  public record DecryptedAiConfig(String provider, String apiKey, String baseUrl, String model) {}
}
