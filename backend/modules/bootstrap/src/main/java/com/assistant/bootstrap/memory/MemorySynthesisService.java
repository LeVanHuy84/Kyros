package com.assistant.bootstrap.memory;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryId;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class MemorySynthesisService {

  private final MemoryEntryRepository memoryEntryRepository;

  private static final List<Pattern> FACT_PATTERNS =
      List.of(
          Pattern.compile("(?i)(?:tôi\\s+thường|thói\\s+quen\\s+của\\s+tôi\\s+là)\\s+([^.,;\\n]+)"),
          Pattern.compile("(?i)(?:tôi\\s+thích|tôi\\s+muốn\\s+ưu\\s+tiên)\\s+([^.,;\\n]+)"),
          Pattern.compile("(?i)(?:tôi\\s+không\\s+thích|tôi\\s+tránh|không\\s+được\\s+xếp\\s+lịch)\\s+([^.,;\\n]+)"),
          Pattern.compile("(?i)(?:tôi\\s+đang\\s+làm\\s+dự\\s+án|dự\\s+án\\s+của\\s+tôi\\s+là)\\s+([^.,;\\n]+)"),
          Pattern.compile("(?i)(?:tôi\\s+là|vai\\s+trò\\s+của\\s+tôi\\s+là)\\s+([^.,;\\n]+)"));

  public MemorySynthesisService(MemoryEntryRepository memoryEntryRepository) {
    this.memoryEntryRepository = memoryEntryRepository;
  }

  public List<String> extractAndStoreFacts(
      WorkspaceId workspaceId, UserId userId, String conversationText) {
    if (conversationText == null || conversationText.isBlank()) {
      return List.of();
    }

    List<String> extractedFacts = new ArrayList<>();
    for (Pattern pattern : FACT_PATTERNS) {
      Matcher matcher = pattern.matcher(conversationText);
      while (matcher.find()) {
        String fact = matcher.group(0).trim();
        if (fact.length() >= 8 && !extractedFacts.contains(fact)) {
          extractedFacts.add(fact);
        }
      }
    }

    for (String fact : extractedFacts) {
      try {
        MemoryEntry entry =
            new MemoryEntry(
                new MemoryId(UUID.randomUUID()),
                workspaceId,
                userId,
                fact,
                0.85f);
        memoryEntryRepository.save(entry);
      } catch (Exception ignored) {
      }
    }

    return extractedFacts;
  }
}
