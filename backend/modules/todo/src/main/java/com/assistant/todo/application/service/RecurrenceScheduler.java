package com.assistant.todo.application.service;

import com.assistant.kernel.event.TaskEvents.TaskCreated;
import com.assistant.todo.domain.model.Tag;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.repository.TaskRepository;
import com.assistant.todo.domain.service.RecurrenceInstanceGenerationService;
import com.assistant.todo.domain.service.RecurrenceInstanceGenerationService.GenerationResult;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RecurrenceScheduler {

  private final TaskRepository taskRepository;
  private final RecurrenceInstanceGenerationService generationService =
      new RecurrenceInstanceGenerationService();
  private final ApplicationEventPublisher eventPublisher;

  public RecurrenceScheduler(
      TaskRepository taskRepository, ApplicationEventPublisher eventPublisher) {
    this.taskRepository = taskRepository;
    this.eventPublisher = eventPublisher;
  }

  // Run hourly
  @Scheduled(cron = "0 0 * * * *")
  @Transactional
  public void generateRecurringTasks() {
    List<Task> activeTemplates = taskRepository.findActiveRecurrenceTemplates();

    for (Task template : activeTemplates) {
      Optional<GenerationResult> resultOpt =
          generationService.generateNextInstance(template, taskRepository);
      if (resultOpt.isPresent()) {
        GenerationResult result = resultOpt.get();
        // Save parent (updates lastGeneratedOccurrence and bumps version)
        taskRepository.save(result.parent);
        // Save child instance
        taskRepository.save(result.child);

        // Publish TaskCreated event for child
        eventPublisher.publishEvent(
            new TaskCreated(
                result.child.getId().value(),
                result.child.getWorkspaceId(),
                result.child.getTitle(),
                result.child.getPriority().name(),
                result.child.getDueDate(),
                result.child.getTags().stream().map(Tag::name).collect(Collectors.toSet()),
                result.parent.getId().value()));
      }
    }
  }
}
