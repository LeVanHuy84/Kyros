package com.assistant.calendar.presentation;

import com.assistant.calendar.application.port.in.AvailabilityWindowDto;
import com.assistant.calendar.application.port.in.CalendarEventDto;
import com.assistant.calendar.application.port.in.CalendarPort;
import com.assistant.calendar.application.port.in.TimeSlotDto;
import com.assistant.calendar.presentation.dto.CreateEventRequest;
import com.assistant.calendar.presentation.dto.RescheduleEventRequest;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.Duration;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/calendar/events")
public class CalendarController {

  private final CalendarPort calendarPort;

  public CalendarController(CalendarPort calendarPort) {
    this.calendarPort = calendarPort;
  }

  private void validateWorkspace(UUID pathWorkspaceId) {
    UUID authenticatedWorkspaceId = WorkspaceContextHolder.getRequired().value();
    if (!authenticatedWorkspaceId.equals(pathWorkspaceId)) {
      throw new AccessDeniedException("Access denied. You do not have access to this workspace.");
    }
  }

  @PostMapping
  public ResponseEntity<CalendarEventDto> createEvent(
      @PathVariable("workspaceId") UUID workspaceId,
      @Valid @RequestBody CreateEventRequest request) {
    validateWorkspace(workspaceId);
    com.assistant.calendar.domain.model.EventId eventId =
        calendarPort.createEvent(
            new WorkspaceId(workspaceId),
            request.userId(),
            request.taskId(),
            request.title(),
            request.description(),
            request.startTime(),
            request.endTime(),
            request.reminderOffsetsMinutes());
    return ResponseEntity.created(
            URI.create("/api/v1/workspaces/" + workspaceId + "/calendar/events/" + eventId.value()))
        .body(null);
  }

  @GetMapping("/{eventId}")
  public ResponseEntity<CalendarEventDto> getEvent(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("eventId") UUID eventId) {
    validateWorkspace(workspaceId);
    return ResponseEntity.ok(
        calendarPort.getEvent(
            new WorkspaceId(workspaceId),
            new com.assistant.calendar.domain.model.EventId(eventId)));
  }

  @GetMapping
  public ResponseEntity<List<CalendarEventDto>> listEvents(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "startTime") java.time.Instant startTime,
      @RequestParam(name = "endTime") java.time.Instant endTime) {
    validateWorkspace(workspaceId);
    return ResponseEntity.ok(
        calendarPort.listEvents(new WorkspaceId(workspaceId), startTime, endTime));
  }

  @PatchMapping("/{eventId}")
  public ResponseEntity<Void> updateEventMetadata(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("eventId") UUID eventId,
      @RequestBody java.util.Map<String, String> updates) {
    validateWorkspace(workspaceId);
    calendarPort.updateEventMetadata(
        new WorkspaceId(workspaceId),
        new com.assistant.calendar.domain.model.EventId(eventId),
        updates.get("title"),
        updates.get("description"));
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{eventId}")
  public ResponseEntity<Void> deleteEvent(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("eventId") UUID eventId) {
    validateWorkspace(workspaceId);
    calendarPort.deleteEvent(
        new WorkspaceId(workspaceId), new com.assistant.calendar.domain.model.EventId(eventId));
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{eventId}/reschedule")
  public ResponseEntity<Void> rescheduleEvent(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("eventId") UUID eventId,
      @Valid @RequestBody RescheduleEventRequest request) {
    validateWorkspace(workspaceId);
    calendarPort.rescheduleEvent(
        new WorkspaceId(workspaceId),
        new com.assistant.calendar.domain.model.EventId(eventId),
        request.startTime(),
        request.endTime());
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{eventId}/reminders")
  public ResponseEntity<Void> addReminder(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("eventId") UUID eventId,
      @RequestParam(name = "leadTimeMinutes") int leadTimeMinutes) {
    validateWorkspace(workspaceId);
    calendarPort.addReminder(
        new WorkspaceId(workspaceId),
        new com.assistant.calendar.domain.model.EventId(eventId),
        leadTimeMinutes);
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{eventId}/reminders/{reminderId}")
  public ResponseEntity<Void> removeReminder(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("eventId") UUID eventId,
      @PathVariable("reminderId") UUID reminderId) {
    validateWorkspace(workspaceId);
    calendarPort.removeReminder(
        new WorkspaceId(workspaceId),
        new com.assistant.calendar.domain.model.EventId(eventId),
        reminderId.toString());
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{eventId}/reminders/{reminderId}/snooze")
  public ResponseEntity<Void> snoozeReminder(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("eventId") UUID eventId,
      @PathVariable("reminderId") UUID reminderId,
      @RequestParam(name = "snoozeMinutes") int snoozeMinutes) {
    validateWorkspace(workspaceId);
    calendarPort.snoozeReminder(
        new WorkspaceId(workspaceId),
        new com.assistant.calendar.domain.model.EventId(eventId),
        reminderId.toString(),
        snoozeMinutes);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{eventId}/reminders/{reminderId}/dismiss")
  public ResponseEntity<Void> dismissReminder(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("eventId") UUID eventId,
      @PathVariable("reminderId") UUID reminderId) {
    validateWorkspace(workspaceId);
    calendarPort.dismissReminder(
        new WorkspaceId(workspaceId),
        new com.assistant.calendar.domain.model.EventId(eventId),
        reminderId.toString());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/availability")
  public ResponseEntity<List<AvailabilityWindowDto>> queryAvailability(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "rangeStart") java.time.Instant rangeStart,
      @RequestParam(name = "rangeEnd") java.time.Instant rangeEnd,
      @RequestParam(name = "workingHoursStart", required = false) LocalTime workingHoursStart,
      @RequestParam(name = "workingHoursEnd", required = false) LocalTime workingHoursEnd,
      @RequestParam(name = "minimumNoticeMinutes", required = false, defaultValue = "0")
          int minimumNoticeMinutes) {
    validateWorkspace(workspaceId);
    return ResponseEntity.ok(
        calendarPort.queryAvailability(
            new WorkspaceId(workspaceId),
            rangeStart,
            rangeEnd,
            workingHoursStart != null ? workingHoursStart : LocalTime.of(9, 0),
            workingHoursEnd != null ? workingHoursEnd : LocalTime.of(17, 0),
            minimumNoticeMinutes));
  }

  @GetMapping("/availability/slots")
  public ResponseEntity<List<TimeSlotDto>> discoverSlots(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "rangeStart") java.time.Instant rangeStart,
      @RequestParam(name = "rangeEnd") java.time.Instant rangeEnd,
      @RequestParam(name = "desiredDurationMinutes") int desiredDurationMinutes,
      @RequestParam(name = "workingHoursStart", required = false) LocalTime workingHoursStart,
      @RequestParam(name = "workingHoursEnd", required = false) LocalTime workingHoursEnd,
      @RequestParam(name = "minimumNoticeMinutes", required = false, defaultValue = "0")
          int minimumNoticeMinutes,
      @RequestParam(name = "maxResults", required = false, defaultValue = "10") int maxResults) {
    validateWorkspace(workspaceId);
    return ResponseEntity.ok(
        calendarPort.discoverSlots(
            new WorkspaceId(workspaceId),
            rangeStart,
            rangeEnd,
            Duration.ofMinutes(desiredDurationMinutes),
            workingHoursStart != null ? workingHoursStart : LocalTime.of(9, 0),
            workingHoursEnd != null ? workingHoursEnd : LocalTime.of(17, 0),
            minimumNoticeMinutes,
            maxResults));
  }
}
