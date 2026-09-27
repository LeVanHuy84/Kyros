package com.assistant.agent.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Locale;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AgentSafetyGuardTest {

  private AgentSafetyGuard safetyGuard;
  private final UUID workspaceId = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    safetyGuard = new AgentSafetyGuard(null);
  }

  @Test
  void shouldPassNonDestructivePrompt() {
    var result =
        safetyGuard.evaluatePrompt(
            workspaceId, "Lên lịch họp với team vào ngày mai", Locale.ENGLISH);
    assertFalse(result.isDestructive());
  }

  @Test
  void shouldInterceptDeleteEventsPrompt() {
    var result =
        safetyGuard.evaluatePrompt(
            workspaceId, "Xóa lịch họp với đối tác", Locale.forLanguageTag("vi"));
    assertTrue(result.isDestructive());
    assertEquals("delete_events", result.toolName());
  }

  @Test
  void shouldInterceptDeleteTasksPrompt() {
    var result =
        safetyGuard.evaluatePrompt(
            workspaceId, "Xóa toàn bộ task đã hoàn thành", Locale.forLanguageTag("vi"));
    assertTrue(result.isDestructive());
    assertEquals("delete_tasks", result.toolName());
  }

  @Test
  void shouldInterceptDeleteNotesPrompt() {
    var result =
        safetyGuard.evaluatePrompt(
            workspaceId, "Xóa ghi chú kế hoạch Q3", Locale.forLanguageTag("vi"));
    assertTrue(result.isDestructive());
    assertEquals("delete_notes", result.toolName());
  }

  @Test
  void shouldInterceptDeleteMemoryPrompt() {
    var result =
        safetyGuard.evaluatePrompt(
            workspaceId, "Xóa trí nhớ về thói quen của tôi", Locale.forLanguageTag("vi"));
    assertTrue(result.isDestructive());
    assertEquals("delete_memory", result.toolName());
  }

  @Test
  void shouldDetectDestructiveTools() {
    assertTrue(safetyGuard.isDestructiveTool("delete_events"));
    assertTrue(safetyGuard.isDestructiveTool("delete_tasks"));
    assertTrue(safetyGuard.isDestructiveTool("delete_notes"));
    assertTrue(safetyGuard.isDestructiveTool("delete_memory"));
    assertFalse(safetyGuard.isDestructiveTool("upsert_events"));
    assertFalse(safetyGuard.isDestructiveTool("upsert_notes"));
    assertFalse(safetyGuard.isDestructiveTool("save_memory"));
    assertFalse(safetyGuard.isDestructiveTool("recall_memory"));
  }
}
