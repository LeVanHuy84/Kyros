package com.assistant.bootstrap.memory;

import com.assistant.kernel.event.MemoryEvents;
import com.assistant.memory.domain.model.ConversationId;
import com.assistant.memory.domain.repository.ConversationRepository;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class MemorySynthesisEventListener {

  private final MemorySynthesisService memorySynthesisService;
  private final ConversationRepository conversationRepository;

  public MemorySynthesisEventListener(
      MemorySynthesisService memorySynthesisService,
      ConversationRepository conversationRepository) {
    this.memorySynthesisService = memorySynthesisService;
    this.conversationRepository = conversationRepository;
  }

  @Async
  @EventListener
  public void onConversationTurnAppended(MemoryEvents.ConversationTurnAppended event) {
    try {
      var convOpt =
          conversationRepository.findById(
              new ConversationId(event.conversationId()), event.workspaceId());
      if (convOpt.isPresent()) {
        var conv = convOpt.get();
        var turns = conversationRepository.findRecentTurns(conv.getId(), 5);
        for (var t : turns) {
          if (t.getRole() == com.assistant.memory.domain.model.SenderRole.User) {
            memorySynthesisService.extractAndStoreFacts(
                conv.getWorkspaceId(), conv.getUserId(), t.getContent());
          }
        }
      }
    } catch (Exception ignored) {
    }
  }
}
