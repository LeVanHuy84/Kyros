package com.assistant.memory.application.service;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.MemoryEvents;
import com.assistant.memory.application.ports.in.CoreProfilePort;
import com.assistant.memory.domain.model.CoreUserProfile;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryStatus;
import com.assistant.memory.domain.repository.CoreUserProfileRepository;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

/** Service responsible for synthesizing Tier 1 Core User Profile from active Tier 2 facts. */
@Service
public class CoreProfileSynthesisService implements CoreProfilePort {

  private static final Duration CACHE_TTL = Duration.ofHours(24);

  private final MemoryEntryRepository memoryEntryRepository;
  private final CoreUserProfileRepository coreUserProfileRepository;
  private final ApplicationEventPublisher eventPublisher;

  @Autowired
  public CoreProfileSynthesisService(
      MemoryEntryRepository memoryEntryRepository,
      CoreUserProfileRepository coreUserProfileRepository,
      @Autowired(required = false) ApplicationEventPublisher eventPublisher) {
    this.memoryEntryRepository = memoryEntryRepository;
    this.coreUserProfileRepository = coreUserProfileRepository;
    this.eventPublisher = eventPublisher;
  }

  public CoreProfileSynthesisService(
      MemoryEntryRepository memoryEntryRepository,
      CoreUserProfileRepository coreUserProfileRepository) {
    this(memoryEntryRepository, coreUserProfileRepository, null);
  }

  @Override
  public String getSynthesizedCoreProfile(WorkspaceId workspaceId, UserId userId) {
    if (workspaceId == null) {
      return "";
    }

    Optional<CoreUserProfile> cached = coreUserProfileRepository.findByUser(workspaceId, userId);
    if (cached.isPresent()) {
      CoreUserProfile profile = cached.get();
      boolean isFresh =
          Duration.between(profile.getLastSynthesizedAt(), Instant.now()).compareTo(CACHE_TTL) < 0;
      if (isFresh && !profile.getMarkdownContent().isBlank()) {
        return profile.getMarkdownContent();
      }
    }

    return refreshCoreProfile(workspaceId, userId);
  }

  @Override
  public String refreshCoreProfile(WorkspaceId workspaceId, UserId userId) {
    if (workspaceId == null) {
      return "";
    }

    List<MemoryEntry> activeFacts = memoryEntryRepository.findActiveByUser(workspaceId, userId);
    List<MemoryEntry> validFacts =
        activeFacts.stream()
            .filter(f -> f.getStatus() == MemoryStatus.ACTIVE)
            .filter(f -> f.getValidTo() == null || f.getValidTo().isAfter(Instant.now()))
            .sorted((a, b) -> Float.compare(b.getConfidenceScore(), a.getConfidenceScore()))
            .toList();

    if (validFacts.isEmpty()) {
      return "";
    }

    // Group by topic cluster
    Map<String, List<String>> clusters = new LinkedHashMap<>();
    for (MemoryEntry entry : validFacts) {
      String cluster =
          entry.getTopicCluster() != null ? entry.getTopicCluster() : "general_preference";
      clusters.computeIfAbsent(cluster, k -> new ArrayList<>()).add(entry.getContent());
    }

    StringBuilder sb = new StringBuilder();
    sb.append("CORE USER PROFILE & ACTIVE WORK RULES:\n");

    for (Map.Entry<String, List<String>> e : clusters.entrySet()) {
      String sectionTitle = formatSectionTitle(e.getKey());
      sb.append(sectionTitle).append(":\n");
      for (String item : e.getValue()) {
        sb.append("- ").append(cleanContent(item)).append("\n");
      }
    }

    String markdown = sb.toString().trim();

    // Persist Tier 1 Core Profile
    CoreUserProfile profile = new CoreUserProfile(workspaceId, userId, markdown, validFacts.size());
    coreUserProfileRepository.save(profile);

    if (eventPublisher != null && userId != null) {
      eventPublisher.publishEvent(
          new MemoryEvents.CoreProfileSynthesized(workspaceId.value(), userId.value()));
    }

    return markdown;
  }

  private String formatSectionTitle(String cluster) {
    return switch (cluster) {
      case "work_schedule" -> "⏰ Work Schedule & Availability";
      case "meeting_preference" -> "🤝 Meeting & Call Preferences";
      case "communication_style" -> "📬 Communication & Notification Style";
      case "task_rule" -> "🎯 Task & Priority Constraints";
      case "general_preference" -> "💡 General Habits & Preferences";
      default -> "📌 " + cluster.toUpperCase(java.util.Locale.ROOT);
    };
  }

  private String cleanContent(String text) {
    if (text == null) {
      return "";
    }
    // Remove category prefixes like [work_rule], [preference]
    return text.replaceAll("^\\[[a-zA-Z0-9_]+\\]\\s*", "");
  }
}
