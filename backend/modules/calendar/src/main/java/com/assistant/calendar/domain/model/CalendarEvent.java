package com.assistant.calendar.domain.model;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CalendarEvent {
  private final EventId eventId;
  private final WorkspaceId workspaceId;
  private final UserId userId;
  private final TaskId taskId; // Nullable
  private EventTitle title;
  private EventDescription description;
  private EventTimeRange timeRange;
  private EventStatus status;
  private final List<Reminder> reminders;
  private Instant createdAt;
  private Instant updatedAt;
  private int version;

  public CalendarEvent(
      EventId eventId,
      WorkspaceId workspaceId,
      UserId userId,
      TaskId taskId,
      EventTitle title,
      EventDescription description,
      EventTimeRange timeRange,
      List<Reminder> reminders,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.eventId = eventId;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.taskId = taskId;
    this.title = title;
    this.description = description;
    this.timeRange = timeRange;
    this.status = EventStatus.Scheduled;
    this.reminders = new ArrayList<>(reminders != null ? reminders : Collections.emptyList());
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.version = version;
  }

  public static CalendarEvent create(
      EventId eventId,
      WorkspaceId workspaceId,
      UserId userId,
      TaskId taskId,
      EventTitle title,
      EventDescription description,
      EventTimeRange timeRange,
      List<LeadTime> initialLeadTimes,
      Instant now) {
    CalendarEvent event =
        new CalendarEvent(
            eventId,
            workspaceId,
            userId,
            taskId,
            title,
            description,
            timeRange,
            Collections.emptyList(),
            now,
            now,
            0);
    for (LeadTime leadTime : initialLeadTimes) {
      event.addReminder(leadTime, now);
    }
    return event;
  }

  public void updateMetadata(EventTitle title, EventDescription description) {
    checkNotDeleted();
    this.title = title;
    this.description = description;
    this.updatedAt = Instant.now();
  }

  public void reschedule(EventTimeRange newTimeRange, Instant now) {
    checkNotDeleted();
    this.timeRange = newTimeRange;
    for (Reminder reminder : reminders) {
      if (reminder.getStatus() == ReminderStatus.Scheduled
          || reminder.getStatus() == ReminderStatus.Snoozed) {
        reminder.recalculate(newTimeRange.startTime(), now);
      }
    }
    this.updatedAt = Instant.now();
  }

  public void delete() {
    if (this.status == EventStatus.Deleted) {
      return;
    }
    for (Reminder reminder : reminders) {
      if (reminder.getStatus() != ReminderStatus.Dismissed) {
        reminder.dismiss();
      }
    }
    this.status = EventStatus.Deleted;
    this.updatedAt = Instant.now();
  }

  public void addReminder(LeadTime leadTime, Instant now) {
    checkNotDeleted();
    ReminderTriggerTime triggerTime =
        new ReminderTriggerTime(this.timeRange.startTime().minus(leadTime.value()));
    if (triggerTime.value().isBefore(now)) {
      // Trigger time is already in the past — skip this reminder silently
      return;
    }
    ReminderId reminderId = ReminderId.random();
    Reminder reminder = new Reminder(reminderId, leadTime, triggerTime);
    this.reminders.add(reminder);
    this.updatedAt = Instant.now();
  }

  public void removeReminder(ReminderId reminderId) {
    checkNotDeleted();
    boolean removed = this.reminders.removeIf(r -> r.getReminderId().equals(reminderId));
    if (!removed) {
      throw new IllegalArgumentException("Reminder not found");
    }
    this.updatedAt = Instant.now();
  }

  public void snoozeReminder(ReminderId reminderId, SnoozeOffset offset, Instant now) {
    checkNotDeleted();
    Reminder reminder = findReminder(reminderId);
    reminder.snooze(offset, now);
    this.updatedAt = Instant.now();
  }

  public void dismissReminder(ReminderId reminderId) {
    checkNotDeleted();
    Reminder reminder = findReminder(reminderId);
    reminder.dismiss();
    this.updatedAt = Instant.now();
  }

  public void triggerReminder(ReminderId reminderId, Instant now) {
    Reminder reminder = findReminder(reminderId);
    reminder.trigger();
  }

  private void checkNotDeleted() {
    if (this.status == EventStatus.Deleted) {
      throw new IllegalStateException("Cannot modify a deleted event");
    }
  }

  private Reminder findReminder(ReminderId reminderId) {
    return reminders.stream()
        .filter(r -> r.getReminderId().equals(reminderId))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Reminder not found"));
  }

  public EventId getEventId() {
    return eventId;
  }

  public WorkspaceId getWorkspaceId() {
    return workspaceId;
  }

  public UserId getUserId() {
    return userId;
  }

  public TaskId getTaskId() {
    return taskId;
  }

  public EventTitle getTitle() {
    return title;
  }

  public EventDescription getDescription() {
    return description;
  }

  public EventTimeRange getTimeRange() {
    return timeRange;
  }

  public EventStatus getStatus() {
    return status;
  }

  public List<Reminder> getReminders() {
    return Collections.unmodifiableList(reminders);
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public int getVersion() {
    return version;
  }
}
