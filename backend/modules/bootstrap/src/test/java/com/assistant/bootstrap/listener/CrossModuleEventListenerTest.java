package com.assistant.bootstrap.listener;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.assistant.calendar.domain.event.ReminderTriggered;
import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.EventTitle;
import com.assistant.calendar.domain.model.ReminderId;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.notification.application.dto.DispatchNotificationCommand;
import com.assistant.notification.application.ports.in.NotificationDispatchPort;
import com.assistant.notification.domain.model.UrgencyLevel;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class CrossModuleEventListenerTest {

  private NotificationDispatchPort notificationDispatchPort;
  private CrossModuleEventListener listener;

  @BeforeEach
  void setUp() {
    notificationDispatchPort = mock(NotificationDispatchPort.class);
    listener = new CrossModuleEventListener(notificationDispatchPort);
  }

  @Test
  void testOnReminderTriggeredDispatchesNotification() {
    WorkspaceId workspaceId = new WorkspaceId(UUID.randomUUID());
    UserId userId = new UserId(UUID.randomUUID());
    EventId eventId = new EventId(UUID.randomUUID());
    ReminderId reminderId = new ReminderId(UUID.randomUUID());
    EventTitle eventTitle = new EventTitle("Sprint Planning");
    Instant startTime = Instant.parse("2026-08-23T10:00:00Z");
    Instant triggeredAt = Instant.now();

    ReminderTriggered event =
        new ReminderTriggered(
            eventId, reminderId, workspaceId, userId, eventTitle, startTime, triggeredAt);

    listener.onReminderTriggered(event);

    ArgumentCaptor<DispatchNotificationCommand> commandCaptor =
        ArgumentCaptor.forClass(DispatchNotificationCommand.class);
    verify(notificationDispatchPort, times(1)).dispatch(commandCaptor.capture());

    DispatchNotificationCommand command = commandCaptor.getValue();
    Assertions.assertEquals(workspaceId, command.workspaceId());
    Assertions.assertEquals(userId, command.userId());
    Assertions.assertEquals("Calendar Reminder: Sprint Planning", command.title());
    Assertions.assertTrue(command.content().contains("2026-08-23T10:00:00Z"));
    Assertions.assertEquals(UrgencyLevel.Normal, command.urgencyLevel());
  }
}
