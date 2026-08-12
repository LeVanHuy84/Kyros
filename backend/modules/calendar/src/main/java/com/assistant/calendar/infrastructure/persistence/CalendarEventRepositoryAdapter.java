package com.assistant.calendar.infrastructure.persistence;

import com.assistant.calendar.domain.model.CalendarEvent;
import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.EventTimeRange;
import com.assistant.calendar.domain.model.ReminderId;
import com.assistant.calendar.domain.repository.CalendarEventRepository;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;

@Repository
public class CalendarEventRepositoryAdapter implements CalendarEventRepository {
  private final SpringDataCalendarEventRepository repository;

  public CalendarEventRepositoryAdapter(SpringDataCalendarEventRepository repository) {
    this.repository = repository;
  }

  @Override
  public CalendarEvent save(CalendarEvent event) {
    CalendarEventJpaEntity jpa = toJpa(event);
    CalendarEventJpaEntity saved = repository.save(jpa);
    return toDomain(saved);
  }

  @Override
  public Optional<CalendarEvent> findById(EventId id, WorkspaceId workspaceId) {
    return repository.findByIdAndWorkspaceId(id.value(), workspaceId.value()).map(this::toDomain);
  }

  @Override
  public List<CalendarEvent> findOverlappingEvents(
      WorkspaceId workspaceId, EventTimeRange range, EventId excludeEventId) {
    UUID excludeId = excludeEventId != null ? excludeEventId.value() : null;
    return repository
        .findOverlapping(workspaceId.value(), range.startTime(), range.endTime(), excludeId)
        .stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public List<CalendarEvent> findEventsInWindow(WorkspaceId workspaceId, EventTimeRange range) {
    return repository.findInWindow(workspaceId.value(), range.startTime(), range.endTime()).stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public List<CalendarEvent> findEventsWithDueReminders(Instant now) {
    return repository.findEventsWithDueReminders(now).stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public List<CalendarEvent> findActiveEvents(
      WorkspaceId workspaceId, Instant rangeStart, Instant rangeEnd) {
    return repository.findActiveEvents(workspaceId.value(), rangeStart, rangeEnd).stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  private CalendarEvent toDomain(CalendarEventJpaEntity jpa) {
    List<com.assistant.calendar.domain.model.Reminder> reminders = new ArrayList<>();
    if (jpa.getReminders() != null) {
      for (ReminderJpaEntity reminderJpa : jpa.getReminders()) {
        reminders.add(
            new com.assistant.calendar.domain.model.Reminder(
                new ReminderId(reminderJpa.getId()),
                new com.assistant.calendar.domain.model.LeadTime(
                    java.time.Duration.ofMinutes(reminderJpa.getLeadTimeMinutes())),
                new com.assistant.calendar.domain.model.ReminderTriggerTime(
                    reminderJpa.getTriggerTime()),
                com.assistant.calendar.domain.model.ReminderStatus.valueOf(
                    reminderJpa.getStatus())));
      }
    }

    return new CalendarEvent(
        new EventId(jpa.getId()),
        new WorkspaceId(jpa.getWorkspaceId()),
        new com.assistant.kernel.domain.UserId(jpa.getOwnerId()),
        jpa.getTaskId() != null
            ? new com.assistant.calendar.domain.model.TaskId(jpa.getTaskId())
            : null,
        new com.assistant.calendar.domain.model.EventTitle(jpa.getTitle()),
        jpa.getDescription() != null
            ? new com.assistant.calendar.domain.model.EventDescription(jpa.getDescription())
            : null,
        new EventTimeRange(jpa.getStartTime(), jpa.getEndTime()),
        reminders,
        jpa.getCreatedAt(),
        jpa.getUpdatedAt(),
        jpa.getVersion());
  }

  private CalendarEventJpaEntity toJpa(CalendarEvent event) {
    CalendarEventJpaEntity jpa =
        repository.findById(event.getEventId().value()).orElseGet(CalendarEventJpaEntity::new);
    jpa.setId(event.getEventId().value());
    jpa.setWorkspaceId(event.getWorkspaceId().value());
    jpa.setOwnerId(event.getUserId().value());
    jpa.setTaskId(event.getTaskId() != null ? event.getTaskId().value() : null);
    jpa.setTitle(event.getTitle().value());
    jpa.setDescription(event.getDescription() != null ? event.getDescription().value() : null);
    jpa.setStartTime(event.getTimeRange().startTime());
    jpa.setEndTime(event.getTimeRange().endTime());
    jpa.setStatus(event.getStatus().name());
    jpa.setDeletedAt(
        event.getStatus() == com.assistant.calendar.domain.model.EventStatus.Deleted
            ? Instant.now()
            : null);
    jpa.setCreatedAt(event.getCreatedAt());
    jpa.setUpdatedAt(event.getUpdatedAt());
    jpa.setVersion(event.getVersion());

    List<ReminderJpaEntity> existingReminders = jpa.getReminders();
    existingReminders.clear();

    for (var reminder : event.getReminders()) {
      ReminderJpaEntity reminderJpa = new ReminderJpaEntity();
      reminderJpa.setId(reminder.getReminderId().value());
      reminderJpa.setEvent(jpa);
      reminderJpa.setLeadTimeMinutes((int) reminder.getLeadTime().value().toMinutes());
      reminderJpa.setTriggerTime(reminder.getTriggerTime().value());
      reminderJpa.setStatus(reminder.getStatus().name());
      reminderJpa.setCreatedAt(Instant.now());
      reminderJpa.setUpdatedAt(Instant.now());
      existingReminders.add(reminderJpa);
    }

    return jpa;
  }
}
