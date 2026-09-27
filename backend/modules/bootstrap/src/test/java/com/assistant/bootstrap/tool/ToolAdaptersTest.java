package com.assistant.bootstrap.tool;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.infrastructure.tools.DeleteMemoryToolAdapter;
import com.assistant.agent.infrastructure.tools.DeleteNotesToolAdapter;
import com.assistant.agent.infrastructure.tools.NoteToolAdapter;
import com.assistant.agent.infrastructure.tools.RecallMemoryToolAdapter;
import com.assistant.agent.infrastructure.tools.SaveMemoryToolAdapter;
import com.assistant.calendar.application.port.in.CalendarPort;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.service.MemoryConsolidationService;
import com.assistant.memory.application.service.NoteService;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryId;
import com.assistant.memory.domain.model.Note;
import com.assistant.memory.domain.model.NoteId;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import com.assistant.memory.domain.repository.NoteRepository;
import com.assistant.todo.application.port.in.TodoPort;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.model.TaskId;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ToolAdaptersTest {

  private final ObjectMapper objectMapper = new ObjectMapper();
  private NoteRepository noteRepository;
  private NoteService noteService;
  private MemoryEntryRepository memoryEntryRepository;
  private MemoryConsolidationService consolidationService;
  private CalendarPort calendarPort;
  private TodoPort todoPort;

  @BeforeEach
  void setUp() {
    noteRepository = mock(NoteRepository.class);
    noteService = new NoteService(noteRepository);
    memoryEntryRepository = mock(MemoryEntryRepository.class);
    consolidationService = new MemoryConsolidationService(memoryEntryRepository);
    calendarPort = mock(CalendarPort.class);
    todoPort = mock(TodoPort.class);
  }

  @Test
  void testNoteToolAdapterUpsert() {
    NoteToolAdapter adapter = new NoteToolAdapter(noteService, objectMapper);
    assertEquals("upsert_notes", adapter.getName());

    UUID wsId = UUID.randomUUID();
    String json =
        "{\"workspaceId\":\""
            + wsId
            + "\",\"notes\":[{\"title\":\"Title 1\",\"content\":\"Content 1\"}]}";
    ToolExecutionResult result = adapter.execute(json);

    assertTrue(result.output().contains("Title 1"));
    assertFalse(result.requiresApproval());
    verify(noteRepository).save(any(Note.class));
  }

  @Test
  void testDeleteNotesToolAdapter() {
    DeleteNotesToolAdapter adapter = new DeleteNotesToolAdapter(noteService, objectMapper);
    assertEquals("delete_notes", adapter.getName());

    UUID wsId = UUID.randomUUID();
    UUID noteId = UUID.randomUUID();
    Note mockNote =
        new Note(
            new NoteId(noteId),
            new WorkspaceId(wsId),
            new UserId(UUID.randomUUID()),
            "Title",
            "Content",
            null,
            null);
    when(noteRepository.findById(any(), any())).thenReturn(Optional.of(mockNote));

    String json = "{\"workspaceId\":\"" + wsId + "\",\"noteIds\":[\"" + noteId + "\"]}";
    ToolExecutionResult result = adapter.execute(json);

    assertTrue(result.output().contains("Đã xóa thành công 1 ghi chú"));
    verify(noteRepository).delete(mockNote);
  }

  @Test
  void testSaveMemoryToolAdapter() {
    SaveMemoryToolAdapter adapter = new SaveMemoryToolAdapter(consolidationService, objectMapper);
    assertEquals("save_memory", adapter.getName());

    String json = "{\"content\":\"Không họp vào chiều thứ 6\",\"category\":\"WORK_RULE\"}";
    ToolExecutionResult result = adapter.execute(json);

    assertTrue(result.output().contains("CREATED"));
    verify(memoryEntryRepository).save(any(MemoryEntry.class));
  }

  @Test
  void testRecallMemoryToolAdapter() {
    RecallMemoryToolAdapter adapter =
        new RecallMemoryToolAdapter(memoryEntryRepository, objectMapper);
    assertEquals("recall_memory", adapter.getName());

    UUID wsId = UUID.randomUUID();
    MemoryEntry entry =
        new MemoryEntry(
            new MemoryId(UUID.randomUUID()),
            new WorkspaceId(wsId),
            new UserId(UUID.randomUUID()),
            "[WORK_RULE] Không họp chiều thứ 6",
            0.95f);
    when(memoryEntryRepository.findBySemanticQuery(any(), eq("họp"), eq(5), eq(0.50)))
        .thenReturn(List.of(entry));

    String json = "{\"workspaceId\":\"" + wsId + "\",\"query\":\"họp\"}";
    ToolExecutionResult result = adapter.execute(json);

    assertTrue(result.output().contains("Không họp chiều thứ 6"));
  }

  @Test
  void testDeleteMemoryToolAdapter() {
    DeleteMemoryToolAdapter adapter =
        new DeleteMemoryToolAdapter(memoryEntryRepository, objectMapper);
    assertEquals("delete_memory", adapter.getName());

    UUID wsId = UUID.randomUUID();
    UUID memId = UUID.randomUUID();
    String json = "{\"workspaceId\":\"" + wsId + "\",\"memoryIds\":[\"" + memId + "\"]}";

    ToolExecutionResult result = adapter.execute(json);
    assertTrue(result.output().contains("Đã xóa thành công 1 bản ghi"));
    verify(memoryEntryRepository).delete(eq(new MemoryId(memId)), any(WorkspaceId.class));
  }

  @Test
  void testCalendarToolAdapter() {
    CalendarToolAdapter adapter = new CalendarToolAdapter(calendarPort, objectMapper);
    assertEquals("upsert_events", adapter.getName());

    when(calendarPort.listEvents(any(), any(), any())).thenReturn(List.of());
    when(calendarPort.createEvent(any(), any(), any(), any(), any(), any(), any(), any()))
        .thenReturn(new com.assistant.calendar.domain.model.EventId(UUID.randomUUID()));

    String json =
        "{\"events\":[{\"title\":\"Họp"
            + " Sprint\",\"startTime\":\"2026-10-01T10:00:00Z\",\"endTime\":\"2026-10-01T11:00:00Z\"}]}";
    ToolExecutionResult result = adapter.execute(json);

    assertTrue(result.output().contains("Họp Sprint"));
  }

  @Test
  void testTaskToolAdapter() {
    TaskToolAdapter adapter = new TaskToolAdapter(todoPort, objectMapper);
    assertEquals("upsert_tasks", adapter.getName());

    Task mockTask =
        new Task(
            TaskId.random(),
            new WorkspaceId(UUID.randomUUID()),
            "Task Test",
            "Description",
            Priority.High,
            null,
            null);
    when(todoPort.createTask(any(), any(), any(), any(), any(), any(), any(), any(), any()))
        .thenReturn(mockTask);

    String json = "{\"tasks\":[{\"title\":\"Task Test\",\"priority\":\"High\"}]}";
    ToolExecutionResult result = adapter.execute(json);

    assertTrue(result.output().contains("Task Test"));
  }
}
