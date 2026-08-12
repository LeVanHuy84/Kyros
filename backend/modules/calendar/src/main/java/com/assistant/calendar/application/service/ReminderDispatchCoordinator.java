package com.assistant.calendar.application.service;

import com.assistant.calendar.domain.event.ReminderTriggered;
import com.assistant.calendar.domain.model.CalendarEvent;
import com.assistant.calendar.domain.repository.CalendarEventRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReminderDispatchCoordinator {
  private final CalendarEventRepository calendarEventRepository;
  private final ApplicationEventPublisher eventPublisher;

  public ReminderDispatchCoordinator(
      CalendarEventRepository calendarEventRepository, ApplicationEventPublisher eventPublisher) {
    this.calendarEventRepository = calendarEventRepository;
    this.eventPublisher = eventPublisher;
  }

  @Scheduled(fixedRate = 60000)
  @Transactional
  public void triggerDueReminders() {
    Instant now = Instant.now();
    List<CalendarEvent> events = calendarEventRepository.findEventsWithDueReminders(now);
    for (CalendarEvent event : events) {
      for (var reminder : event.getReminders()) {
        if ((reminder.getStatus() == com.assistant.calendar.domain.model.ReminderStatus.Scheduled
                || reminder.getStatus()
                    == com.assistant.calendar.domain.model.ReminderStatus.Snoozed)
            && !reminder.getTriggerTime().value().isAfter(now)) {
          event.triggerReminder(reminder.getReminderId(), now);
          calendarEventRepository.save(event);
          eventPublisher.publishEvent(
              new ReminderTriggered(
                  event.getEventId(),
                  reminder.getReminderId(),
                  event.getWorkspaceId(),
                  event.getUserId(),
                  event.getTitle(),
                  event.getTimeRange().startTime(),
                  now));
        }
      }
    }
  }
}
