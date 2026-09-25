package com.assistant.calendar.application.service;

import com.assistant.calendar.application.port.in.CalendarEventDto;
import com.assistant.calendar.domain.model.AvailabilityWindow;
import com.assistant.calendar.domain.model.CalendarEvent;
import com.assistant.calendar.domain.model.EventDescription;
import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.EventTimeRange;
import com.assistant.calendar.domain.model.EventTitle;
import com.assistant.calendar.domain.model.LeadTime;
import com.assistant.calendar.domain.model.TaskId;
import com.assistant.calendar.domain.repository.CalendarEventRepository;
import com.assistant.calendar.domain.service.AvailabilityQueryService;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.application.port.in.TodoPort;
import com.assistant.todo.domain.model.Task;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AutoSchedulingService {

  private final TodoPort todoPort;
  private final CalendarEventRepository calendarEventRepository;
  private final AvailabilityQueryService availabilityQueryService;

  public AutoSchedulingService(
      TodoPort todoPort,
      CalendarEventRepository calendarEventRepository,
      AvailabilityQueryService availabilityQueryService) {
    this.todoPort = todoPort;
    this.calendarEventRepository = calendarEventRepository;
    this.availabilityQueryService = availabilityQueryService;
  }

  public List<CalendarEventDto> autoScheduleTasks(WorkspaceId workspaceId, int daysAhead) {
    Instant now = Instant.now();
    Instant rangeEnd = now.plus(Duration.ofDays(Math.max(1, daysAhead)));

    // 1. Fetch active tasks for workspace that have autoSchedule = true
    List<Task> pendingTasks =
        todoPort
            .listTasks(
                workspaceId,
                null,
                null,
                null,
                false, // Only active/incomplete tasks
                null,
                null,
                PageRequest.of(0, 100))
            .getContent()
            .stream()
            .filter(t -> Boolean.TRUE.equals(t.getAutoSchedule()))
            .collect(Collectors.toList());

    // 2. Sort by Priority (Critical > High > Medium > Low) and Due Date (earliest first)
    pendingTasks.sort(
        Comparator.comparing(Task::getPriority, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(Task::getDueDate, Comparator.nullsLast(Comparator.naturalOrder())));

    // 3. Find existing scheduled tasks to avoid re-scheduling
    Set<String> alreadyScheduledTaskIds =
        calendarEventRepository.findActiveEvents(workspaceId, now, rangeEnd).stream()
            .filter(e -> e.getTaskId() != null)
            .map(e -> e.getTaskId().value().toString())
            .collect(Collectors.toSet());

    List<CalendarEventDto> scheduledEvents = new ArrayList<>();
    ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");

    for (Task task : pendingTasks) {
      if (alreadyScheduledTaskIds.contains(task.getId().toString())) {
        continue; // Already scheduled on calendar
      }

      int durationMins =
          task.getEstimatedDurationMinutes() != null ? task.getEstimatedDurationMinutes() : 30;
      Duration requiredDuration = Duration.ofMinutes(durationMins);

      // Search for availability windows
      List<AvailabilityWindow> freeWindows =
          availabilityQueryService.queryAvailability(workspaceId, now, rangeEnd);

      for (AvailabilityWindow window : freeWindows) {
        Instant windowStart = window.start().isAfter(now) ? window.start() : now;
        ZonedDateTime startZdt = windowStart.atZone(zone);

        // Adjust to working hours (08:30 to 17:30)
        if (startZdt.getHour() < 8 || (startZdt.getHour() == 8 && startZdt.getMinute() < 30)) {
          startZdt = startZdt.withHour(8).withMinute(30).withSecond(0).withNano(0);
        }
        if (startZdt.getHour() >= 17 && startZdt.getMinute() >= 30) {
          // Push to next day at 08:30 AM
          startZdt = startZdt.plusDays(1).withHour(8).withMinute(30).withSecond(0).withNano(0);
        }

        Instant candidateStart = startZdt.toInstant();
        Instant candidateEnd = candidateStart.plus(requiredDuration);

        if (!candidateEnd.isAfter(window.end()) && !candidateEnd.isAfter(rangeEnd)) {
          // Create calendar time block event
          CalendarEvent event =
              CalendarEvent.create(
                  EventId.random(),
                  workspaceId,
                  null, // UserId optional
                  new TaskId(task.getId().value()),
                  new EventTitle("[Task] " + task.getTitle()),
                  task.getDescription() != null
                      ? new EventDescription(task.getDescription())
                      : null,
                  new EventTimeRange(candidateStart, candidateEnd),
                  List.of(new LeadTime(Duration.ofMinutes(15))),
                  Instant.now());

          calendarEventRepository.save(event);
          scheduledEvents.add(
              new CalendarEventDto(
                  event.getEventId().value().toString(),
                  event.getWorkspaceId().value().toString(),
                  null,
                  event.getTaskId() != null ? event.getTaskId().value().toString() : null,
                  event.getTitle().value(),
                  event.getDescription() != null ? event.getDescription().value() : null,
                  event.getTimeRange().startTime(),
                  event.getTimeRange().endTime(),
                  event.getStatus().name(),
                  List.of(),
                  event.getCreatedAt(),
                  event.getUpdatedAt(),
                  event.getVersion()));
          alreadyScheduledTaskIds.add(task.getId().toString());

          // Advance now to the end of this candidate time block
          now = candidateEnd;
          break;
        }
      }
    }

    return scheduledEvents;
  }

  public List<CalendarEventDto> resolveConflicts(WorkspaceId workspaceId, int daysAhead) {
    Instant now = Instant.now();
    Instant rangeEnd = now.plus(Duration.ofDays(Math.max(1, daysAhead)));

    List<CalendarEvent> activeEvents =
        calendarEventRepository.findActiveEvents(workspaceId, now, rangeEnd);

    activeEvents.sort(Comparator.comparing(e -> e.getTimeRange().startTime()));

    List<CalendarEventDto> resolvedList = new ArrayList<>();
    Instant lastOccupiedEnd = now;

    for (CalendarEvent event : activeEvents) {
      Instant start = event.getTimeRange().startTime();
      Instant end = event.getTimeRange().endTime();

      if (start.isBefore(lastOccupiedEnd) && event.getTaskId() != null) {
        // Shift task block forward after last occupied end
        Duration duration = Duration.between(start, end);
        Instant newStart = lastOccupiedEnd.plus(Duration.ofMinutes(15));
        Instant newEnd = newStart.plus(duration);

        event.reschedule(new EventTimeRange(newStart, newEnd), Instant.now());
        calendarEventRepository.save(event);
        lastOccupiedEnd = newEnd;
      } else {
        if (end.isAfter(lastOccupiedEnd)) {
          lastOccupiedEnd = end;
        }
      }

      resolvedList.add(
          new CalendarEventDto(
              event.getEventId().value().toString(),
              event.getWorkspaceId().value().toString(),
              null,
              event.getTaskId() != null ? event.getTaskId().value().toString() : null,
              event.getTitle().value(),
              event.getDescription() != null ? event.getDescription().value() : null,
              event.getTimeRange().startTime(),
              event.getTimeRange().endTime(),
              event.getStatus().name(),
              List.of(),
              event.getCreatedAt(),
              event.getUpdatedAt(),
              event.getVersion()));
    }

    return resolvedList;
  }
}
