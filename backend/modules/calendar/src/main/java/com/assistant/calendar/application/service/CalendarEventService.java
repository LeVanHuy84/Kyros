package com.assistant.calendar.application.service;

import com.assistant.calendar.application.port.in.AvailabilityWindowDto;
import com.assistant.calendar.application.port.in.CalendarEventDto;
import com.assistant.calendar.application.port.in.CalendarPort;
import com.assistant.calendar.application.port.in.ReminderDto;
import com.assistant.calendar.application.port.in.TimeSlotDto;
import com.assistant.calendar.domain.model.CalendarEvent;
import com.assistant.calendar.domain.model.EventDescription;
import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.EventTimeRange;
import com.assistant.calendar.domain.model.EventTitle;
import com.assistant.calendar.domain.model.LeadTime;
import com.assistant.calendar.domain.model.SlotQuery;
import com.assistant.calendar.domain.model.TimeSlot;
import com.assistant.calendar.domain.repository.CalendarEventRepository;
import com.assistant.calendar.domain.service.AvailabilityQueryService;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CalendarEventService implements CalendarPort {
  private final CalendarEventRepository calendarEventRepository;
  private final AvailabilityQueryService availabilityQueryService;
  private final ApplicationEventPublisher eventPublisher;

  public CalendarEventService(
      CalendarEventRepository calendarEventRepository,
      AvailabilityQueryService availabilityQueryService,
      ApplicationEventPublisher eventPublisher) {
    this.calendarEventRepository = calendarEventRepository;
    this.availabilityQueryService = availabilityQueryService;
    this.eventPublisher = eventPublisher;
  }

  @Override
  public EventId createEvent(
      WorkspaceId workspaceId,
      String userId,
      String taskId,
      String title,
      String description,
      Instant startTime,
      Instant endTime,
      List<Integer> reminderOffsetsMinutes) {
    EventId eventId = EventId.random();
    EventTimeRange timeRange = new EventTimeRange(startTime, endTime);
    EventTitle eventTitle = new EventTitle(title);
    EventDescription eventDescription =
        (description != null && !description.isBlank()) ? new EventDescription(description) : null;
    com.assistant.calendar.domain.model.TaskId tId =
        taskId != null && !taskId.isBlank()
            ? com.assistant.calendar.domain.model.TaskId.fromString(taskId)
            : null;

    List<LeadTime> leadTimes = new ArrayList<>();
    if (reminderOffsetsMinutes != null && !reminderOffsetsMinutes.isEmpty()) {
      for (Integer minutes : reminderOffsetsMinutes) {
        leadTimes.add(new LeadTime(Duration.ofMinutes(minutes)));
      }
    }

    CalendarEvent event =
        com.assistant.calendar.domain.model.CalendarEvent.create(
            eventId,
            workspaceId,
            new UserId(UUID.fromString(userId)),
            tId,
            eventTitle,
            eventDescription,
            timeRange,
            leadTimes,
            Instant.now());
    calendarEventRepository.save(event);
    eventPublisher.publishEvent(
        new com.assistant.calendar.domain.event.CalendarEventCreated(
            event.getEventId(),
            event.getWorkspaceId(),
            event.getUserId(),
            event.getTitle(),
            event.getTimeRange(),
            event.getReminders().size(),
            Instant.now()));
    return eventId;
  }

  @Override
  public void rescheduleEvent(
      WorkspaceId workspaceId, EventId eventId, Instant startTime, Instant endTime) {
    CalendarEvent event =
        calendarEventRepository
            .findById(eventId, workspaceId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    EventTimeRange newTimeRange = new EventTimeRange(startTime, endTime);
    event.reschedule(newTimeRange, Instant.now());
    calendarEventRepository.save(event);
  }

  @Override
  public void deleteEvent(WorkspaceId workspaceId, EventId eventId) {
    CalendarEvent event =
        calendarEventRepository
            .findById(eventId, workspaceId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    event.delete();
    calendarEventRepository.save(event);
    eventPublisher.publishEvent(
        new com.assistant.calendar.domain.event.CalendarEventDeleted(
            eventId, workspaceId, Instant.now()));
  }

  @Override
  public void updateEventMetadata(
      WorkspaceId workspaceId, EventId eventId, String title, String description) {
    CalendarEvent event =
        calendarEventRepository
            .findById(eventId, workspaceId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    event.updateMetadata(
        new EventTitle(title),
        (description != null && !description.isBlank()) ? new EventDescription(description) : null);
    calendarEventRepository.save(event);
  }

  @Override
  public void snoozeReminder(
      WorkspaceId workspaceId, EventId eventId, String reminderId, int snoozeMinutes) {
    CalendarEvent event =
        calendarEventRepository
            .findById(eventId, workspaceId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    event.snoozeReminder(
        new com.assistant.calendar.domain.model.ReminderId(UUID.fromString(reminderId)),
        new com.assistant.calendar.domain.model.SnoozeOffset(Duration.ofMinutes(snoozeMinutes)),
        Instant.now());
    calendarEventRepository.save(event);
  }

  @Override
  public void dismissReminder(WorkspaceId workspaceId, EventId eventId, String reminderId) {
    CalendarEvent event =
        calendarEventRepository
            .findById(eventId, workspaceId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    event.dismissReminder(
        new com.assistant.calendar.domain.model.ReminderId(UUID.fromString(reminderId)));
    calendarEventRepository.save(event);
  }

  @Override
  public void addReminder(WorkspaceId workspaceId, EventId eventId, int leadTimeMinutes) {
    CalendarEvent event =
        calendarEventRepository
            .findById(eventId, workspaceId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    event.addReminder(new LeadTime(Duration.ofMinutes(leadTimeMinutes)), Instant.now());
    calendarEventRepository.save(event);
  }

  @Override
  public void removeReminder(WorkspaceId workspaceId, EventId eventId, String reminderId) {
    CalendarEvent event =
        calendarEventRepository
            .findById(eventId, workspaceId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    event.removeReminder(
        new com.assistant.calendar.domain.model.ReminderId(UUID.fromString(reminderId)));
    calendarEventRepository.save(event);
  }

  @Override
  @Transactional(readOnly = true)
  public CalendarEventDto getEvent(WorkspaceId workspaceId, EventId eventId) {
    CalendarEvent event =
        calendarEventRepository
            .findById(eventId, workspaceId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    return toDto(event);
  }

  @Override
  @Transactional(readOnly = true)
  public List<CalendarEventDto> listEvents(
      WorkspaceId workspaceId, Instant startTime, Instant endTime) {
    List<CalendarEvent> events =
        calendarEventRepository.findEventsInWindow(
            workspaceId, new EventTimeRange(startTime, endTime));
    List<CalendarEventDto> dtos = new ArrayList<>();
    for (CalendarEvent event : events) {
      dtos.add(toDto(event));
    }
    return dtos;
  }

  @Override
  @Transactional(readOnly = true)
  public List<AvailabilityWindowDto> queryAvailability(
      WorkspaceId workspaceId,
      Instant rangeStart,
      Instant rangeEnd,
      LocalTime workingHoursStart,
      LocalTime workingHoursEnd,
      int minimumNoticeMinutes) {
    List<com.assistant.calendar.domain.model.AvailabilityWindow> windows =
        availabilityQueryService.queryAvailability(workspaceId, rangeStart, rangeEnd);
    List<AvailabilityWindowDto> dtos = new ArrayList<>();
    for (com.assistant.calendar.domain.model.AvailabilityWindow window : windows) {
      dtos.add(new AvailabilityWindowDto(window.start(), window.end()));
    }
    return dtos;
  }

  @Override
  @Transactional(readOnly = true)
  public List<TimeSlotDto> discoverSlots(
      WorkspaceId workspaceId,
      Instant rangeStart,
      Instant rangeEnd,
      Duration desiredDuration,
      LocalTime workingHoursStart,
      LocalTime workingHoursEnd,
      int minimumNoticeMinutes,
      int maxResults) {
    SlotQuery query =
        new SlotQuery(
            rangeStart,
            rangeEnd,
            desiredDuration,
            maxResults,
            Duration.ofMinutes(minimumNoticeMinutes));
    List<TimeSlot> slots = availabilityQueryService.discoverSlots(workspaceId, query);
    List<TimeSlotDto> dtos = new ArrayList<>();
    for (TimeSlot slot : slots) {
      dtos.add(new TimeSlotDto(slot.start(), slot.end(), (int) desiredDuration.toMinutes()));
    }
    return dtos;
  }

  private CalendarEventDto toDto(CalendarEvent event) {
    List<ReminderDto> reminderDtos = new ArrayList<>();
    for (var reminder : event.getReminders()) {
      reminderDtos.add(
          new ReminderDto(
              reminder.getReminderId().toString(),
              (int) reminder.getLeadTime().value().toMinutes(),
              reminder.getTriggerTime().value(),
              reminder.getStatus().name()));
    }
    return new CalendarEventDto(
        event.getEventId().toString(),
        event.getWorkspaceId().toString(),
        event.getUserId().toString(),
        event.getTaskId() != null ? event.getTaskId().toString() : null,
        event.getTitle().value(),
        event.getDescription() != null ? event.getDescription().value() : null,
        event.getTimeRange().startTime(),
        event.getTimeRange().endTime(),
        event.getStatus().name(),
        reminderDtos,
        event.getCreatedAt(),
        event.getUpdatedAt(),
        event.getVersion());
  }
}
