package com.assistant.memory.application.service;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.MemoryEvents;
import com.assistant.kernel.event.WorkspaceProvisioned;
import com.assistant.kernel.exception.DomainException;
import com.assistant.kernel.exception.EntityNotFoundException;
import com.assistant.memory.application.dto.AppendTurnCommand;
import com.assistant.memory.application.dto.MemoryEntryDTO;
import com.assistant.memory.application.dto.PreferencesDTO;
import com.assistant.memory.application.dto.TurnDTO;
import com.assistant.memory.application.dto.UpdatePreferencesCommand;
import com.assistant.memory.application.ports.in.ConversationHistoryPort;
import com.assistant.memory.application.ports.in.MemoryStorePort;
import com.assistant.memory.domain.model.Conversation;
import com.assistant.memory.domain.model.ConversationId;
import com.assistant.memory.domain.model.ConversationTurn;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryId;
import com.assistant.memory.domain.model.TurnId;
import com.assistant.memory.domain.model.UserPreferences;
import com.assistant.memory.domain.repository.ConversationRepository;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import com.assistant.memory.domain.repository.UserPreferencesRepository;
import com.assistant.memory.domain.service.SensitiveDataScreeningResult;
import com.assistant.memory.domain.service.SensitiveFactScreeningService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemoryApplicationService implements ConversationHistoryPort, MemoryStorePort {

  private final ConversationRepository conversationRepository;
  private final UserPreferencesRepository userPreferencesRepository;
  private final MemoryEntryRepository memoryEntryRepository;
  private final SensitiveFactScreeningService screeningService =
      new SensitiveFactScreeningService();
  private final ApplicationEventPublisher eventPublisher;

  public MemoryApplicationService(
      ConversationRepository conversationRepository,
      UserPreferencesRepository userPreferencesRepository,
      MemoryEntryRepository memoryEntryRepository,
      ApplicationEventPublisher eventPublisher) {
    this.conversationRepository = conversationRepository;
    this.userPreferencesRepository = userPreferencesRepository;
    this.memoryEntryRepository = memoryEntryRepository;
    this.eventPublisher = eventPublisher;
  }

  @Override
  @Transactional
  public void appendMessage(AppendTurnCommand command) {
    Conversation conversation =
        conversationRepository
            .findById(command.conversationId(), command.workspaceId())
            .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));

    Instant now = Instant.now();
    ConversationTurn turn =
        new ConversationTurn(TurnId.random(), command.senderRole(), command.messageContent(), now);

    conversation.appendTurn(command.senderRole(), command.messageContent(), now);
    conversationRepository.appendTurn(conversation.getId(), conversation.getWorkspaceId(), turn);

    eventPublisher.publishEvent(
        new MemoryEvents.ConversationTurnAppended(
            conversation.getId().value(),
            conversation.getWorkspaceId(),
            turn.getId().value(),
            turn.getRole().name()));
    eventPublisher.publishEvent(
        new MemoryEvents.MemoryUpdated(
            conversation.getWorkspaceId(), conversation.getUserId(), "CONVERSATION"));
  }

  @Override
  @Transactional
  public void clearHistory(WorkspaceId workspaceId, ConversationId conversationId) {
    Conversation conversation =
        conversationRepository
            .findById(conversationId, workspaceId)
            .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));

    conversation.clear();
    conversationRepository.save(conversation);
    conversationRepository.deleteTurns(conversationId);

    eventPublisher.publishEvent(
        new MemoryEvents.ConversationCleared(conversationId.value(), workspaceId));
    eventPublisher.publishEvent(
        new MemoryEvents.MemoryUpdated(workspaceId, conversation.getUserId(), "CONVERSATION"));
  }

  @Override
  @Transactional(readOnly = true)
  public List<TurnDTO> getRecentTurns(
      WorkspaceId workspaceId, ConversationId conversationId, int limit) {
    if (conversationRepository.findById(conversationId, workspaceId).isEmpty()) {
      throw new EntityNotFoundException("Conversation not found");
    }

    return conversationRepository.findRecentTurns(conversationId, limit).stream()
        .map(
            turn ->
                new TurnDTO(
                    turn.getId().value(),
                    turn.getRole().name(),
                    turn.getContent(),
                    turn.getTimestamp()))
        .collect(Collectors.toList());
  }

  @Override
  @Transactional
  public PreferencesDTO getUserPreferences(WorkspaceId workspaceId, UserId userId) {
    UserPreferences preferences =
        userPreferencesRepository
            .find(workspaceId, userId)
            .orElseGet(
                () -> {
                  UserPreferences newPrefs = new UserPreferences(workspaceId, userId);
                  userPreferencesRepository.save(newPrefs);
                  eventPublisher.publishEvent(
                      new MemoryEvents.UserPreferencesInitialized(workspaceId, userId));
                  return newPrefs;
                });

    return toDto(preferences);
  }

  @Override
  @Transactional
  public void updatePreferences(UpdatePreferencesCommand command) {
    UserPreferences preferences =
        userPreferencesRepository
            .find(command.workspaceId(), command.userId())
            .orElseGet(
                () -> {
                  UserPreferences newPrefs =
                      new UserPreferences(command.workspaceId(), command.userId());
                  userPreferencesRepository.save(newPrefs);
                  return newPrefs;
                });

    preferences.update(
        command.timezone(),
        command.defaultPriority(),
        command.preventCalendarOverlap(),
        Set.of("InApp", "Email"),
        command.leadTimeMinutes());
    userPreferencesRepository.save(preferences);

    eventPublisher.publishEvent(
        new MemoryEvents.UserPreferencesUpdated(
            command.workspaceId(),
            command.userId(),
            Set.of("timezone", "defaultPriority", "preventCalendarOverlap", "leadTimeMinutes")));
    eventPublisher.publishEvent(
        new MemoryEvents.MemoryUpdated(command.workspaceId(), command.userId(), "PREFERENCES"));
  }

  @Override
  @Transactional(readOnly = true)
  public List<MemoryEntryDTO> searchSemanticFacts(WorkspaceId workspaceId, String queryText) {
    return memoryEntryRepository.findBySemanticQuery(workspaceId, queryText, 10, 0.0).stream()
        .map(this::toDto)
        .collect(Collectors.toList());
  }

  @EventListener
  @Transactional
  public void handleWorkspaceProvisioned(WorkspaceProvisioned event) {
    if (userPreferencesRepository.find(event.workspaceId(), event.ownerId()).isEmpty()) {
      UserPreferences preferences = new UserPreferences(event.workspaceId(), event.ownerId());
      userPreferencesRepository.save(preferences);
      eventPublisher.publishEvent(
          new MemoryEvents.UserPreferencesInitialized(event.workspaceId(), event.ownerId()));
    }
  }

  @Transactional
  public Conversation startConversation(
      WorkspaceId workspaceId, UserId userId, UUID sessionId, String title) {
    ConversationId id = ConversationId.random();
    Conversation conversation = new Conversation(id, workspaceId, userId, sessionId, title);
    conversationRepository.save(conversation);
    eventPublisher.publishEvent(
        new MemoryEvents.ConversationStarted(id.value(), workspaceId, userId));
    return conversation;
  }

  @Transactional(readOnly = true)
  public List<Conversation> listConversations(WorkspaceId workspaceId, int offset, int limit) {
    return conversationRepository.findByWorkspace(workspaceId, offset, limit);
  }

  @Transactional(readOnly = true)
  public long countConversations(WorkspaceId workspaceId) {
    return conversationRepository.countByWorkspace(workspaceId);
  }

  @Transactional
  public MemoryEntry createMemoryEntry(
      WorkspaceId workspaceId, UserId userId, String content, float confidenceScore) {
    SensitiveDataScreeningResult screeningResult = screeningService.screen(content);
    if (!screeningResult.isAllowed()) {
      throw new DomainException("Sensitive data rejected: " + screeningResult.reason());
    }

    MemoryId id = MemoryId.random();
    MemoryEntry entry = new MemoryEntry(id, workspaceId, userId, content, confidenceScore);
    memoryEntryRepository.save(entry);

    eventPublisher.publishEvent(
        new MemoryEvents.MemoryEntryCreated(id.value(), workspaceId, userId, confidenceScore));
    eventPublisher.publishEvent(new MemoryEvents.MemoryUpdated(workspaceId, userId, "MEMORIES"));
    return entry;
  }

  @Transactional
  public MemoryEntry reviseMemoryEntry(
      MemoryId memoryId, WorkspaceId workspaceId, String content, float confidenceScore) {
    SensitiveDataScreeningResult screeningResult = screeningService.screen(content);
    if (!screeningResult.isAllowed()) {
      throw new DomainException("Sensitive data rejected: " + screeningResult.reason());
    }

    MemoryEntry entry =
        memoryEntryRepository
            .findById(memoryId, workspaceId)
            .orElseThrow(() -> new EntityNotFoundException("Memory entry not found"));

    boolean contentUpdated = !entry.getContent().equals(content);
    entry.revise(content, confidenceScore);
    memoryEntryRepository.save(entry);

    eventPublisher.publishEvent(
        new MemoryEvents.MemoryEntryUpdated(
            memoryId.value(), workspaceId, entry.getUserId(), confidenceScore, contentUpdated));
    eventPublisher.publishEvent(
        new MemoryEvents.MemoryUpdated(workspaceId, entry.getUserId(), "MEMORIES"));
    return entry;
  }

  @Transactional
  public void deleteMemoryEntry(MemoryId memoryId, WorkspaceId workspaceId) {
    MemoryEntry entry =
        memoryEntryRepository
            .findById(memoryId, workspaceId)
            .orElseThrow(() -> new EntityNotFoundException("Memory entry not found"));

    memoryEntryRepository.delete(memoryId, workspaceId);

    eventPublisher.publishEvent(new MemoryEvents.MemoryEntryDeleted(memoryId.value(), workspaceId));
    eventPublisher.publishEvent(
        new MemoryEvents.MemoryUpdated(workspaceId, entry.getUserId(), "MEMORIES"));
  }

  @Transactional(readOnly = true)
  public List<MemoryEntry> listMemoryEntries(
      WorkspaceId workspaceId, UserId userId, int offset, int limit) {
    return memoryEntryRepository.findByUser(workspaceId, userId, offset, limit);
  }

  @Transactional(readOnly = true)
  public long countMemoryEntries(WorkspaceId workspaceId, UserId userId) {
    return memoryEntryRepository.countByUser(workspaceId, userId);
  }

  @Transactional(readOnly = true)
  public Optional<MemoryEntry> getMemoryEntry(MemoryId memoryId, WorkspaceId workspaceId) {
    return memoryEntryRepository.findById(memoryId, workspaceId);
  }

  @Transactional
  public void resetUserPreferences(WorkspaceId workspaceId, UserId userId) {
    UserPreferences preferences =
        userPreferencesRepository
            .find(workspaceId, userId)
            .orElseThrow(() -> new EntityNotFoundException("User preferences not found"));

    preferences.resetToDefaults();
    userPreferencesRepository.save(preferences);

    eventPublisher.publishEvent(
        new MemoryEvents.UserPreferencesUpdated(
            workspaceId,
            userId,
            Set.of("timezone", "defaultPriority", "preventCalendarOverlap", "leadTimeMinutes")));
    eventPublisher.publishEvent(new MemoryEvents.MemoryUpdated(workspaceId, userId, "PREFERENCES"));
  }

  private PreferencesDTO toDto(UserPreferences prefs) {
    return new PreferencesDTO(
        prefs.getWorkspaceId().value(),
        prefs.getUserId().value(),
        prefs.getTimezone(),
        prefs.getDefaultTaskPriority(),
        prefs.isPreventCalendarOverlap(),
        prefs.getDefaultReminderLeadTimeMinutes());
  }

  private MemoryEntryDTO toDto(MemoryEntry entry) {
    return new MemoryEntryDTO(
        entry.getId().value(),
        entry.getWorkspaceId().value(),
        entry.getContent(),
        entry.getConfidenceScore(),
        entry.getCreatedAt(),
        entry.getUpdatedAt());
  }
}
