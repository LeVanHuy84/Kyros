package com.assistant.bootstrap.briefing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.calendar.application.port.in.CalendarEventDto;
import com.assistant.calendar.application.port.in.CalendarPort;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.notification.application.ports.in.NotificationDispatchPort;
import com.assistant.todo.application.port.in.TodoPort;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.workspace.domain.WorkspaceRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;

class ExecutiveBriefingServiceTest {

  private CalendarPort calendarPort;
  private TodoPort todoPort;
  private NotificationDispatchPort notificationDispatchPort;
  private WorkspaceRepository workspaceRepository;
  private ExecutiveBriefingService briefingService;

  @BeforeEach
  void setUp() {
    calendarPort = mock(CalendarPort.class);
    todoPort = mock(TodoPort.class);
    notificationDispatchPort = mock(NotificationDispatchPort.class);
    workspaceRepository = mock(WorkspaceRepository.class);

    briefingService =
        new ExecutiveBriefingService(
            calendarPort, todoPort, notificationDispatchPort, workspaceRepository);
  }

  @Test
  void testGenerateMorningBriefing() {
    WorkspaceId wsId = new WorkspaceId(UUID.randomUUID());
    UserId userId = new UserId(UUID.randomUUID());

    Instant eventStart = Instant.now().plus(2, ChronoUnit.HOURS);
    Instant eventEnd = eventStart.plus(1, ChronoUnit.HOURS);
    CalendarEventDto event =
        new CalendarEventDto(
            UUID.randomUUID().toString(),
            wsId.value().toString(),
            userId.value().toString(),
            null,
            "Sprint Planning",
            "Discuss sprint backlog",
            eventStart,
            eventEnd,
            "SCHEDULED",
            List.of(),
            Instant.now(),
            Instant.now(),
            1);

    when(calendarPort.listEvents(any(), any(), any())).thenReturn(List.of(event));

    Task task1 =
        new Task(
            TaskId.random(),
            wsId,
            "Complete Executive Report",
            "Urgent report",
            Priority.High,
            null,
            null);
    when(todoPort.listTasks(any(), any(), any(), any(), any(), any(), any(), any()))
        .thenReturn(new PageImpl<>(List.of(task1)));

    var briefing = briefingService.generateMorningBriefing(wsId, userId, true);

    assertNotNull(briefing);
    assertEquals(ExecutiveBriefingService.BriefingType.MORNING, briefing.type());
    assertEquals(1, briefing.totalEvents());
    assertEquals(1, briefing.totalTasksPending());
    assertTrue(briefing.markdownContent().contains("Sprint Planning"));
    assertTrue(briefing.markdownContent().contains("Complete Executive Report"));
    verify(notificationDispatchPort).dispatch(any());
  }

  @Test
  void testGenerateEveningWrapup() {
    WorkspaceId wsId = new WorkspaceId(UUID.randomUUID());
    UserId userId = new UserId(UUID.randomUUID());

    Task completedTask =
        new Task(TaskId.random(), wsId, "Review PR #42", "Done", Priority.Medium, null, null);
    completedTask.complete();

    when(todoPort.listTasks(any(), any(), any(), any(), any(), any(), any(), any()))
        .thenReturn(new PageImpl<>(List.of(completedTask)));

    var briefing = briefingService.generateEveningWrapup(wsId, userId, false);

    assertNotNull(briefing);
    assertEquals(ExecutiveBriefingService.BriefingType.EVENING, briefing.type());
    assertTrue(briefing.markdownContent().contains("Tổng Kết Cuối Ngày"));
    assertTrue(briefing.markdownContent().contains("Review PR #42"));
  }
}
