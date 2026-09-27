package com.assistant.memory.application.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.CoreUserProfile;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryId;
import com.assistant.memory.domain.repository.CoreUserProfileRepository;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

class CoreProfileSynthesisServiceTest {

  private MemoryEntryRepository memoryEntryRepository;
  private CoreUserProfileRepository coreUserProfileRepository;
  private ApplicationEventPublisher eventPublisher;
  private CoreProfileSynthesisService synthesisService;

  private final WorkspaceId workspaceId = new WorkspaceId(UUID.randomUUID());
  private final UserId userId = new UserId(UUID.randomUUID());

  @BeforeEach
  void setUp() {
    memoryEntryRepository = mock(MemoryEntryRepository.class);
    coreUserProfileRepository = mock(CoreUserProfileRepository.class);
    eventPublisher = mock(ApplicationEventPublisher.class);
    synthesisService =
        new CoreProfileSynthesisService(
            memoryEntryRepository, coreUserProfileRepository, eventPublisher);
  }

  @Test
  void shouldReturnEmptyWhenNoFactsExist() {
    when(coreUserProfileRepository.findByUser(workspaceId, userId)).thenReturn(Optional.empty());
    when(memoryEntryRepository.findActiveByUser(workspaceId, userId)).thenReturn(List.of());

    String profile = synthesisService.getSynthesizedCoreProfile(workspaceId, userId);

    assertTrue(profile.isEmpty());
  }

  @Test
  void shouldSynthesizeStructuredProfileFromActiveFacts() {
    when(coreUserProfileRepository.findByUser(workspaceId, userId)).thenReturn(Optional.empty());

    MemoryEntry schedule =
        new MemoryEntry(
            new MemoryId(UUID.randomUUID()),
            workspaceId,
            userId,
            "work_schedule",
            "[WORK_RULE] Làm việc từ Thứ 2 đến sáng Thứ 7",
            0.95f);
    MemoryEntry meet =
        new MemoryEntry(
            new MemoryId(UUID.randomUUID()),
            workspaceId,
            userId,
            "meeting_preference",
            "[USER_PREFERENCE] Ưu tiên họp Google Meet tối đa 30 phút",
            0.90f);

    when(memoryEntryRepository.findActiveByUser(workspaceId, userId))
        .thenReturn(List.of(schedule, meet));

    String profile = synthesisService.getSynthesizedCoreProfile(workspaceId, userId);

    assertFalse(profile.isBlank());
    assertTrue(profile.contains("CORE USER PROFILE & ACTIVE WORK RULES"));
    assertTrue(profile.contains("Work Schedule & Availability"));
    assertTrue(profile.contains("Làm việc từ Thứ 2 đến sáng Thứ 7"));
    assertTrue(profile.contains("Meeting & Call Preferences"));
    assertTrue(profile.contains("Ưu tiên họp Google Meet"));

    verify(coreUserProfileRepository).save(any(CoreUserProfile.class));
  }
}
