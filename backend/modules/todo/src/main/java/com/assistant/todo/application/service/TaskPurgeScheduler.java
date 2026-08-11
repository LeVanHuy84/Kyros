package com.assistant.todo.application.service;

import com.assistant.kernel.event.TaskEvents.TaskPurged;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.repository.TaskRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TaskPurgeScheduler {

  private final TaskRepository taskRepository;
  private final ApplicationEventPublisher eventPublisher;

  public TaskPurgeScheduler(
      TaskRepository taskRepository, ApplicationEventPublisher eventPublisher) {
    this.taskRepository = taskRepository;
    this.eventPublisher = eventPublisher;
  }

  // Run daily at midnight UTC
  @Scheduled(cron = "0 0 0 * * *")
  @Transactional
  public void purgeExpiredDeletedTasks() {
    Instant threshold = Instant.now().minus(Duration.ofDays(30));
    List<Task> expiredTasks = taskRepository.findSoftDeletedExpiredBefore(threshold);

    for (Task task : expiredTasks) {
      taskRepository.delete(task);
      eventPublisher.publishEvent(new TaskPurged(task.getId().value(), task.getWorkspaceId()));
    }
  }
}
