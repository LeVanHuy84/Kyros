package com.assistant.calendar.domain.model;

import java.time.Instant;
import java.util.Objects;

public class Reminder {
  private final ReminderId reminderId;
  private final LeadTime leadTime;
  private ReminderTriggerTime triggerTime;
  private ReminderStatus status;

  public Reminder(ReminderId reminderId, LeadTime leadTime, ReminderTriggerTime triggerTime) {
    this(reminderId, leadTime, triggerTime, ReminderStatus.Scheduled);
  }

  public Reminder(
      ReminderId reminderId,
      LeadTime leadTime,
      ReminderTriggerTime triggerTime,
      ReminderStatus status) {
    this.reminderId = Objects.requireNonNull(reminderId);
    this.leadTime = Objects.requireNonNull(leadTime);
    this.triggerTime = Objects.requireNonNull(triggerTime);
    this.status = Objects.requireNonNull(status);
  }

  public void trigger() {
    if (status == ReminderStatus.Dismissed) {
      throw new IllegalStateException("Cannot trigger a dismissed reminder");
    }
    this.status = ReminderStatus.Triggered;
  }

  public void snooze(SnoozeOffset offset, Instant now) {
    if (status != ReminderStatus.Triggered) {
      throw new IllegalStateException("Only triggered reminders can be snoozed");
    }
    this.triggerTime = new ReminderTriggerTime(now.plus(offset.value()));
    this.status = ReminderStatus.Snoozed;
  }

  public void dismiss() {
    this.status = ReminderStatus.Dismissed;
  }

  public void recalculate(Instant newStartTime, Instant now) {
    this.triggerTime = new ReminderTriggerTime(newStartTime.minus(this.leadTime.value()));
    if (triggerTime.value().isBefore(now)) {
      if (newStartTime.isAfter(now)) {
        this.status = ReminderStatus.Triggered;
      } else {
        this.status = ReminderStatus.Dismissed;
      }
    }
  }

  public ReminderId getReminderId() {
    return reminderId;
  }

  public LeadTime getLeadTime() {
    return leadTime;
  }

  public ReminderTriggerTime getTriggerTime() {
    return triggerTime;
  }

  public ReminderStatus getStatus() {
    return status;
  }
}
