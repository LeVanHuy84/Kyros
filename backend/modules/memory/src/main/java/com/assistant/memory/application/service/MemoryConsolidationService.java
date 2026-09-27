package com.assistant.memory.application.service;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.MemoryEvents;
import com.assistant.memory.domain.model.ExtractedFact;
import com.assistant.memory.domain.model.FactCategory;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryId;
import com.assistant.memory.domain.model.MemoryStatus;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

/**
 * Service responsible for consolidating newly extracted facts with existing long-term memory: 1.
 * Semantic Deduplication 2. Reinforcement of existing habits/preferences 3.
 * Invalidation/Superseding of contradicted habits (e.g. Schedule T2-T6 vs T2-sáng T7) 4. Topic
 * Clustering for Profile Synthesis
 */
@Service
public class MemoryConsolidationService {

  public enum ConsolidationResultType {
    CREATED,
    REINFORCED,
    REVISED,
    SUPERSEDED,
    IGNORED
  }

  public record ConsolidationResult(
      ConsolidationResultType type, MemoryEntry memoryEntry, String details) {}

  private static final double SIMILARITY_REINFORCE_THRESHOLD = 0.75;
  private static final double SIMILARITY_CONTRADICTION_THRESHOLD = 0.50;

  private final MemoryEntryRepository memoryEntryRepository;
  private final ApplicationEventPublisher eventPublisher;

  @Autowired
  public MemoryConsolidationService(
      MemoryEntryRepository memoryEntryRepository,
      @Autowired(required = false) ApplicationEventPublisher eventPublisher) {
    this.memoryEntryRepository = memoryEntryRepository;
    this.eventPublisher = eventPublisher;
  }

  public MemoryConsolidationService(MemoryEntryRepository memoryEntryRepository) {
    this(memoryEntryRepository, null);
  }

  /** Consolidates an extracted fact into the user's workspace memory. */
  public ConsolidationResult consolidate(
      WorkspaceId workspaceId, UserId userId, ExtractedFact fact) {
    if (fact == null || fact.confidenceScore() < 0.70f) {
      return new ConsolidationResult(
          ConsolidationResultType.IGNORED, null, "Confidence score too low (< 0.70)");
    }

    String topicCluster = deriveTopicCluster(fact);

    // Retrieve active existing memories for the workspace & user
    List<MemoryEntry> activeMemories = memoryEntryRepository.findActiveByUser(workspaceId, userId);

    MemoryEntry bestMatch = null;
    double maxSimilarity = 0.0;

    for (MemoryEntry existing : activeMemories) {
      double sim = computeTextSimilarity(fact.content(), existing.getContent());
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        bestMatch = existing;
      }
    }

    // 1. REINFORCE Scenario: Fact is virtually identical / strongly similar
    if (bestMatch != null && maxSimilarity >= SIMILARITY_REINFORCE_THRESHOLD) {
      float newScore = Math.min(0.99f, bestMatch.getConfidenceScore() + 0.08f);
      bestMatch.revise(bestMatch.getContent(), newScore);
      memoryEntryRepository.save(bestMatch);
      return new ConsolidationResult(
          ConsolidationResultType.REINFORCED,
          bestMatch,
          "Reinforced existing memory confidence to "
              + String.format(Locale.ROOT, "%.2f", newScore));
    }

    // 2. SUPERSEDE / CONTRADICTION Scenario: Same key topic/category with conflicting detail
    MemoryEntry contradictionCandidate = findContradictingEntry(activeMemories, fact, topicCluster);
    if (contradictionCandidate != null) {
      MemoryId newMemoryId = new MemoryId(UUID.randomUUID());
      float newScore =
          Math.max(contradictionCandidate.getConfidenceScore(), fact.confidenceScore());

      // Supersede old entry
      contradictionCandidate.supersede(newMemoryId);
      memoryEntryRepository.save(contradictionCandidate);

      // Create new active entry
      MemoryEntry newEntry =
          new MemoryEntry(newMemoryId, workspaceId, userId, topicCluster, fact.content(), newScore);
      memoryEntryRepository.save(newEntry);

      if (eventPublisher != null) {
        eventPublisher.publishEvent(
            new MemoryEvents.MemoryEntrySuperseded(
                workspaceId.value(),
                userId.value(),
                contradictionCandidate.getId().value(),
                newMemoryId.value(),
                topicCluster));
      }

      return new ConsolidationResult(
          ConsolidationResultType.SUPERSEDED,
          newEntry,
          "Superseded previous fact ["
              + contradictionCandidate.getContent()
              + "] with updated rule");
    }

    // 3. NEW FACT Scenario: Save new memory entry
    MemoryEntry newEntry =
        new MemoryEntry(
            new MemoryId(UUID.randomUUID()),
            workspaceId,
            userId,
            topicCluster,
            fact.content(),
            fact.confidenceScore());
    memoryEntryRepository.save(newEntry);

    if (eventPublisher != null) {
      eventPublisher.publishEvent(
          new MemoryEvents.MemoryEntryCreated(
              newEntry.getId().value(), workspaceId, userId, fact.confidenceScore()));
    }

    return new ConsolidationResult(
        ConsolidationResultType.CREATED, newEntry, "Created new memory fact in vault");
  }

  public String deriveTopicCluster(ExtractedFact fact) {
    if (fact == null || fact.content() == null) {
      return "general_fact";
    }
    String content = fact.content().toLowerCase(Locale.ROOT);
    if (content.contains("làm việc")
        || content.contains("giờ làm")
        || content.contains("working hour")
        || content.contains("thứ 2")
        || content.contains("thứ 6")
        || content.contains("thứ 7")
        || content.contains("thứ hai")
        || content.contains("thứ sáu")
        || content.contains("thứ bảy")
        || content.contains("monday")
        || content.contains("friday")
        || content.contains("saturday")
        || content.contains("schedule")
        || content.contains("lịch làm")) {
      return "work_schedule";
    }
    if (content.contains("zoom")
        || content.contains("meet")
        || content.contains("teams")
        || content.contains("họp")
        || content.contains("meeting")
        || content.contains("call")) {
      return "meeting_preference";
    }
    if (content.contains("thông báo")
        || content.contains("email")
        || content.contains("slack")
        || content.contains("zalo")
        || content.contains("notification")
        || content.contains("tin nhắn")) {
      return "communication_style";
    }
    if (content.contains("ưu tiên")
        || content.contains("priority")
        || content.contains("deadline")
        || content.contains("task")
        || content.contains("nhiệm vụ")) {
      return "task_rule";
    }
    return fact.category() != null
        ? fact.category().name().toLowerCase(Locale.ROOT)
        : "general_preference";
  }

  private MemoryEntry findContradictingEntry(
      List<MemoryEntry> activeMemories, ExtractedFact fact, String newTopicCluster) {
    String newContent = fact.content().toLowerCase(Locale.ROOT);
    String categoryTag = "[" + fact.category().name().toLowerCase(Locale.ROOT) + "]";

    for (MemoryEntry existing : activeMemories) {
      if (existing.getStatus() != MemoryStatus.ACTIVE) {
        continue;
      }

      String existingContent = existing.getContent().toLowerCase(Locale.ROOT);
      boolean sameTopic =
          newTopicCluster != null && newTopicCluster.equals(existing.getTopicCluster());
      boolean sameCategory =
          existingContent.startsWith(categoryTag) || fact.category() == FactCategory.WORK_RULE;

      if ((sameTopic || sameCategory) && !existingContent.equals(newContent)) {
        if (isTopicConflict(existingContent, newContent)) {
          return existing;
        }
      }
    }
    return null;
  }

  private boolean isTopicConflict(String textA, String textB) {
    // 1. Tool/Platform Conflicts
    boolean hasToolConflict =
        (textA.contains("zoom") && (textB.contains("meet") || textB.contains("teams")))
            || (textA.contains("meet") && (textB.contains("zoom") || textB.contains("teams")))
            || (textA.contains("teams") && (textB.contains("zoom") || textB.contains("meet")));

    // 2. Time-of-day Conflicts
    boolean hasTimeConflict =
        (textA.contains("sáng") && textB.contains("chiều"))
            || (textA.contains("morning") && textB.contains("afternoon"))
            || (textA.contains("tối") && textB.contains("sáng"));

    // 3. Day / Schedule Conflicts (e.g. T2 đến T6 vs T2 đến sáng T7)
    boolean hasScheduleConflict =
        (textA.contains("thứ")
                || textA.contains("t2")
                || textA.contains("t6")
                || textA.contains("t7")
                || textA.contains("làm việc")
                || textA.contains("working"))
            && (textB.contains("thứ")
                || textB.contains("t2")
                || textB.contains("t6")
                || textB.contains("t7")
                || textB.contains("làm việc")
                || textB.contains("working"));

    double sim = computeTextSimilarity(textA, textB);
    return (hasToolConflict || hasTimeConflict || hasScheduleConflict)
        && (sim >= SIMILARITY_CONTRADICTION_THRESHOLD || sim > 0.35);
  }

  /** Computes Jaccard + Character N-Gram similarity between two text strings. */
  public static double computeTextSimilarity(String s1, String s2) {
    if (s1 == null || s2 == null) {
      return 0.0;
    }
    String clean1 =
        s1.toLowerCase(Locale.ROOT)
            .replaceAll(
                "[^a-zA-Z0-9\\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]",
                " ")
            .trim();
    String clean2 =
        s2.toLowerCase(Locale.ROOT)
            .replaceAll(
                "[^a-zA-Z0-9\\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]",
                " ")
            .trim();

    if (clean1.equals(clean2)) {
      return 1.0;
    }

    Set<String> words1 = new HashSet<>(Arrays.asList(clean1.split("\\s+")));
    Set<String> words2 = new HashSet<>(Arrays.asList(clean2.split("\\s+")));

    Set<String> intersection = new HashSet<>(words1);
    intersection.retainAll(words2);

    Set<String> union = new HashSet<>(words1);
    union.addAll(words2);

    if (union.isEmpty()) {
      return 0.0;
    }

    return (double) intersection.size() / union.size();
  }
}
