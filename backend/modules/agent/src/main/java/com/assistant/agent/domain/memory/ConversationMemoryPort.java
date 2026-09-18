package com.assistant.agent.domain.memory;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ConversationMemoryPort {

  record ChatMessageDto(String role, String content, long timestamp) {}

  void addMessage(UUID conversationId, String role, String content);

  List<ChatMessageDto> getMessages(UUID conversationId);

  List<Map<String, String>> getLlmFormattedHistory(UUID conversationId, int limit);
}
