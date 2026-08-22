package com.assistant.memory.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.MemoryEvents;
import com.assistant.kernel.exception.DomainException;
import com.assistant.memory.application.dto.AppendTurnCommand;
import com.assistant.memory.application.dto.PreferencesDTO;
import com.assistant.memory.application.dto.UpdatePreferencesCommand;
import com.assistant.memory.domain.model.Conversation;
import com.assistant.memory.domain.model.ConversationId;
import com.assistant.memory.domain.model.ConversationStatus;
import com.assistant.memory.domain.model.ConversationTurn;
import com.assistant.memory.domain.model.SenderRole;
import com.assistant.memory.domain.model.UserPreferences;
import com.assistant.memory.domain.repository.ConversationRepository;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import com.assistant.memory.domain.repository.UserPreferencesRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

class MemoryApplicationServiceTest {

  private ConversationRepository conversationRepository;
  private UserPreferencesRepository userPreferencesRepository;
  private MemoryEntryRepository memoryEntryRepository;
  private ApplicationEventPublisher eventPublisher;
  private MemoryApplicationService memoryService;

  private final WorkspaceId workspaceId = new WorkspaceId(UUID.randomUUID());
  private final UserId userId = new UserId(UUID.randomUUID());

  @BeforeEach
  void setUp() {
    conversationRepository = mock(ConversationRepository.class);
    userPreferencesRepository = mock(UserPreferencesRepository.class);
    memoryEntryRepository = mock(MemoryEntryRepository.class);
    eventPublisher = mock(ApplicationEventPublisher.class);
    memoryService =
        new MemoryApplicationService(
            conversationRepository,
            userPreferencesRepository,
            memoryEntryRepository,
            eventPublisher);
  }

  @Test
  void testStartConversationSavesAndPublishesEvent() {
    Conversation conv = memoryService.startConversation(workspaceId, userId, null, "First Chat");

    assertNotNull(conv);
    assertEquals("First Chat", conv.getTitle());
    assertEquals(ConversationStatus.Active, conv.getStatus());
    verify(conversationRepository, times(1)).save(any(Conversation.class));

    ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
    verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
    assertTrue(eventCaptor.getValue() instanceof MemoryEvents.ConversationStarted);
  }

  @Test
  void testAppendTurnSavesAndUpdatesLastTurnTimestamp() {
    ConversationId convId = ConversationId.random();
    Conversation conv = new Conversation(convId, workspaceId, userId, null, "Title");

    when(conversationRepository.findById(convId, workspaceId)).thenReturn(Optional.of(conv));

    AppendTurnCommand command =
        new AppendTurnCommand(workspaceId, convId, SenderRole.User, "Hello agent");
    memoryService.appendMessage(command);

    verify(conversationRepository, times(1))
        .appendTurn(any(ConversationId.class), any(WorkspaceId.class), any(ConversationTurn.class));

    ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
    verify(eventPublisher, times(2)).publishEvent(eventCaptor.capture());

    boolean turnAppendedTriggered =
        eventCaptor.getAllValues().stream()
            .anyMatch(e -> e instanceof MemoryEvents.ConversationTurnAppended);
    assertTrue(turnAppendedTriggered);
  }

  @Test
  void testGetUserPreferencesCreatesDefaultsIfMissing() {
    when(userPreferencesRepository.find(workspaceId, userId)).thenReturn(Optional.empty());

    PreferencesDTO dto = memoryService.getUserPreferences(workspaceId, userId);

    assertNotNull(dto);
    assertEquals("UTC", dto.timezone());
    assertEquals("Medium", dto.defaultPriority());
    verify(userPreferencesRepository, times(1)).save(any(UserPreferences.class));
    verify(eventPublisher, times(1))
        .publishEvent(any(MemoryEvents.UserPreferencesInitialized.class));
  }

  @Test
  void testUpdatePreferencesValidatesInputs() {
    UserPreferences prefs = new UserPreferences(workspaceId, userId);
    when(userPreferencesRepository.find(workspaceId, userId)).thenReturn(Optional.of(prefs));

    UpdatePreferencesCommand command =
        new UpdatePreferencesCommand(workspaceId, userId, "Europe/London", "High", true, 30);

    memoryService.updatePreferences(command);

    verify(userPreferencesRepository, times(1)).save(any(UserPreferences.class));
  }

  @Test
  void testCreateMemoryEntryEnforcesPrivacyScreening() {
    assertThrows(
        DomainException.class,
        () -> {
          memoryService.createMemoryEntry(workspaceId, userId, "password: secret_pass", 1.0f);
        });
  }
}
