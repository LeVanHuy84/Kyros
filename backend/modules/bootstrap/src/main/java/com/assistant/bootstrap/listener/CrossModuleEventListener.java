package com.assistant.bootstrap.listener;

import com.assistant.calendar.domain.event.ReminderTriggered;
import com.assistant.notification.application.dto.DispatchNotificationCommand;
import com.assistant.notification.application.ports.in.NotificationDispatchPort;
import com.assistant.notification.domain.model.UrgencyLevel;
import java.util.Map;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class CrossModuleEventListener {

  private final NotificationDispatchPort notificationDispatchPort;

  public CrossModuleEventListener(NotificationDispatchPort notificationDispatchPort) {
    this.notificationDispatchPort = notificationDispatchPort;
  }

  @EventListener
  public void onReminderTriggered(ReminderTriggered event) {
    String title = "Calendar Reminder: " + event.eventTitle().value();
    String content = "Your event starts at " + event.eventStartTime().toString();

    notificationDispatchPort.dispatch(
        new DispatchNotificationCommand(
            event.workspaceId(), event.userId(), title, content, UrgencyLevel.Normal, Map.of()));
  }
}
