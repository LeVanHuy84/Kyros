package com.assistant.memory.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryId;
import com.assistant.memory.domain.model.MemoryStatus;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class MemoryLifecycleDecayServiceTest {

  private MemoryEntryRepository memoryEntryRepository;
  private MemoryLifecycleDecayService decayService;

  private final WorkspaceId workspaceId = new WorkspaceId(UUID.randomUUID());
  private final UserId userId = new UserId(UUID.randomUUID());

  @BeforeEach
  void setUp() {
    memoryEntryRepository = mock(MemoryEntryRepository.class);
    decayService = new MemoryLifecycleDecayService(memoryEntryRepository);
  }

  @Test
  void shouldComputeStrengthWithEbbinghausDecayAndReinforcement() {
    Instant now = Instant.now();
    Instant tenDaysAgo = now.minus(10, ChronoUnit.DAYS);

    MemoryEntry entry =
        new MemoryEntry(
            new MemoryId(UUID.randomUUID()),
            workspaceId,
            userId,
            "work_schedule",
            "Làm việc từ T2 đến T6",
            0.90f,
            MemoryStatus.ACTIVE,
            null,
            tenDaysAgo,
            null,
            tenDaysAgo,
            5, // Access 5 times
            tenDaysAgo,
            tenDaysAgo,
            0);

    double strength = decayService.computeRetentionStrength(entry, now);

    // Confidence 0.90 * e^(-0.002 * 10) * (1 + 0.05 * ln(6)) ~= 0.90 * 0.98 * 1.089 ~= 0.96
    assertTrue(strength > 0.85);
  }

  @Test
  void shouldArchiveSupersededEntryOlderThanGracePeriod() {
    Instant fortyDaysAgo = Instant.now().minus(40, ChronoUnit.DAYS);

    MemoryEntry supersededOld =
        new MemoryEntry(
            new MemoryId(UUID.randomUUID()),
            workspaceId,
            userId,
            "work_schedule",
            "Làm việc từ T2 đến T6",
            0.90f,
            MemoryStatus.SUPERSEDED,
            new MemoryId(UUID.randomUUID()),
            fortyDaysAgo,
            fortyDaysAgo,
            fortyDaysAgo,
            1,
            fortyDaysAgo,
            fortyDaysAgo,
            0);

    when(memoryEntryRepository.findAllActive(workspaceId)).thenReturn(List.of(supersededOld));

    var result = decayService.runDecayAndCleanup(workspaceId);

    assertEquals(1, result.totalEvaluated());
    assertEquals(1, result.archivedCount());
    assertEquals(MemoryStatus.ARCHIVED, supersededOld.getStatus());
    verify(memoryEntryRepository).save(supersededOld);
  }
}
