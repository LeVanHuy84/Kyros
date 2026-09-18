package com.assistant.agent.infrastructure.memory;

import com.assistant.agent.domain.memory.ConversationMemoryPort;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class ConversationMemoryStore implements ConversationMemoryPort {

  private final Map<UUID, List<ChatMessageDto>> memoryStore = new ConcurrentHashMap<>();

  @Override
  public void addMessage(UUID conversationId, String role, String content) {
    if (conversationId == null) {
      return;
    }
    memoryStore
        .computeIfAbsent(conversationId, id -> Collections.synchronizedList(new ArrayList<>()))
        .add(new ChatMessageDto(role, content, System.currentTimeMillis()));
  }

  @Override
  public List<ChatMessageDto> getMessages(UUID conversationId) {
    if (conversationId == null || !memoryStore.containsKey(conversationId)) {
      return Collections.emptyList();
    }
    return new ArrayList<>(memoryStore.get(conversationId));
  }

  @Override
  public List<Map<String, String>> getLlmFormattedHistory(UUID conversationId, int limit) {
    List<ChatMessageDto> messages = getMessages(conversationId);
    if (messages.isEmpty()) {
      return Collections.emptyList();
    }
    int start = Math.max(0, messages.size() - limit);
    List<Map<String, String>> history = new ArrayList<>();
    for (int i = start; i < messages.size(); i++) {
      ChatMessageDto msg = messages.get(i);
      history.add(Map.of("role", msg.role(), "content", msg.content()));
    }
    return history;
  }
}
