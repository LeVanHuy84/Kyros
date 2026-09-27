package com.assistant.memory.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.ExtractedFact;
import com.assistant.memory.domain.model.FactCategory;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryId;
import com.assistant.memory.domain.model.MemoryStatus;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

class MemoryConsolidationServiceTest {

  private MemoryEntryRepository memoryEntryRepository;
  private ApplicationEventPublisher eventPublisher;
  private MemoryConsolidationService consolidationService;

  private final WorkspaceId workspaceId = new WorkspaceId(UUID.randomUUID());
  private final UserId userId = new UserId(UUID.randomUUID());

  @BeforeEach
  void setUp() {
    memoryEntryRepository = mock(MemoryEntryRepository.class);
    eventPublisher = mock(ApplicationEventPublisher.class);
    consolidationService = new MemoryConsolidationService(memoryEntryRepository, eventPublisher);
  }

  @Test
  void shouldCreateNewMemoryWhenNoMatch() {
    when(memoryEntryRepository.findActiveByUser(workspaceId, userId)).thenReturn(List.of());

    ExtractedFact fact =
        ExtractedFact.of(
            "[WORK_RULE] Không họp vào chiều thứ Sáu",
            FactCategory.WORK_RULE,
            0.90f,
            "Meeting Rule");

    var result = consolidationService.consolidate(workspaceId, userId, fact);

    assertEquals(MemoryConsolidationService.ConsolidationResultType.CREATED, result.type());
    assertEquals(MemoryStatus.ACTIVE, result.memoryEntry().getStatus());
    verify(memoryEntryRepository).save(any(MemoryEntry.class));
  }

  @Test
  void shouldReinforceExistingMemoryWhenSemanticallyMatching() {
    MemoryEntry existing =
        new MemoryEntry(
            new MemoryId(UUID.randomUUID()),
            workspaceId,
            userId,
            "meeting_preference",
            "[USER_PREFERENCE] Thích họp qua Zoom vào buổi sáng",
            0.80f);

    when(memoryEntryRepository.findActiveByUser(workspaceId, userId)).thenReturn(List.of(existing));

    ExtractedFact fact =
        ExtractedFact.of(
            "[USER_PREFERENCE] Thích họp qua Zoom vào buổi sáng",
            FactCategory.USER_PREFERENCE,
            0.85f,
            "Preference");

    var result = consolidationService.consolidate(workspaceId, userId, fact);

    assertEquals(MemoryConsolidationService.ConsolidationResultType.REINFORCED, result.type());
    assertTrue(result.memoryEntry().getConfidenceScore() > 0.80f);
    verify(memoryEntryRepository).save(existing);
  }

  @Test
  void shouldSupersedeScheduleMemoryWhenWorkHoursChangeFromT2T6ToT2SangT7() {
    // Thời điểm A: User chỉ làm việc từ T2 đến T6
    MemoryEntry oldSchedule =
        new MemoryEntry(
            new MemoryId(UUID.randomUUID()),
            workspaceId,
            userId,
            "work_schedule",
            "[WORK_RULE] Tôi làm việc từ Thứ 2 đến Thứ 6 hàng tuần",
            0.90f);

    when(memoryEntryRepository.findActiveByUser(workspaceId, userId))
        .thenReturn(List.of(oldSchedule));

    // Thời điểm B: User cập nhật làm việc từ T2 đến sáng T7
    ExtractedFact updatedScheduleFact =
        ExtractedFact.of(
            "[WORK_RULE] Tôi làm việc từ Thứ 2 đến sáng Thứ 7",
            FactCategory.WORK_RULE,
            0.95f,
            "Work Schedule");

    var result = consolidationService.consolidate(workspaceId, userId, updatedScheduleFact);

    // Ký ức mới được kích hoạt, ký ức cũ bị SUPERSEDED
    assertEquals(MemoryConsolidationService.ConsolidationResultType.SUPERSEDED, result.type());
    assertEquals(MemoryStatus.SUPERSEDED, oldSchedule.getStatus());
    assertNotNull(oldSchedule.getSupersededById());
    assertEquals(result.memoryEntry().getId(), oldSchedule.getSupersededById());

    assertEquals(MemoryStatus.ACTIVE, result.memoryEntry().getStatus());
    assertTrue(result.memoryEntry().getContent().contains("sáng Thứ 7"));

    // Cả 2 bản ghi được lưu lại để bảo toàn lịch sử và truy vấn
    verify(memoryEntryRepository, times(2)).save(any(MemoryEntry.class));
  }
}
