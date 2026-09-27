package com.assistant.memory.application.service;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryStatus;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Background Service managing Ebbinghaus retention decay, superseding expiration, and automatic
 * archiving of stale/decayed memories.
 */
@Service
public class MemoryLifecycleDecayService {

  public record DecayRunResult(int totalEvaluated, int archivedCount, int activeRetained) {}

  private static final double RETENTION_ARCHIVE_THRESHOLD = 0.20;
  private static final long SUPERSEDED_GRACE_PERIOD_DAYS = 30;

  private final MemoryEntryRepository memoryEntryRepository;

  public MemoryLifecycleDecayService(MemoryEntryRepository memoryEntryRepository) {
    this.memoryEntryRepository = memoryEntryRepository;
  }

  /** Executes decay and lifecycle maintenance for a workspace. */
  public DecayRunResult runDecayAndCleanup(WorkspaceId workspaceId) {
    if (workspaceId == null) {
      return new DecayRunResult(0, 0, 0);
    }

    // Retrieve all entries (or active entries)
    List<MemoryEntry> entries = memoryEntryRepository.findAllActive(workspaceId);
    int archivedCount = 0;
    int retainedCount = 0;
    Instant now = Instant.now();

    for (MemoryEntry entry : entries) {
      // 1. If superseded and older than grace period -> archive
      if (entry.getStatus() == MemoryStatus.SUPERSEDED) {
        long daysSinceSuperseded = Duration.between(entry.getUpdatedAt(), now).toDays();
        if (daysSinceSuperseded >= SUPERSEDED_GRACE_PERIOD_DAYS) {
          entry.archive();
          memoryEntryRepository.save(entry);
          archivedCount++;
          continue;
        }
      }

      // 2. If active, compute Ebbinghaus retention strength
      if (entry.getStatus() == MemoryStatus.ACTIVE) {
        // Expire if validTo has passed
        if (entry.getValidTo() != null && entry.getValidTo().isBefore(now)) {
          entry.expire();
          memoryEntryRepository.save(entry);
          archivedCount++;
          continue;
        }

        double strength = computeRetentionStrength(entry, now);
        long ageInDays = Duration.between(entry.getCreatedAt(), now).toDays();

        if (strength < RETENTION_ARCHIVE_THRESHOLD && ageInDays > 60) {
          entry.archive();
          memoryEntryRepository.save(entry);
          archivedCount++;
        } else {
          retainedCount++;
        }
      }
    }

    return new DecayRunResult(entries.size(), archivedCount, retainedCount);
  }

  /** Computes Memory Retention Strength S(t) = C * e^(-lambda * deltaT) * (1 + 0.05 * ln(1 + N)) */
  public double computeRetentionStrength(MemoryEntry entry, Instant now) {
    if (entry == null) {
      return 0.0;
    }

    double confidence = entry.getConfidenceScore();
    long daysSinceLastAccess =
        Math.max(0, Duration.between(entry.getLastAccessedAt(), now).toDays());

    // Lambda decay rate: Work rules decay slower (0.002) than temporary habits (0.01)
    double lambda = "work_schedule".equals(entry.getTopicCluster()) ? 0.002 : 0.008;

    double timeDecay = Math.exp(-lambda * daysSinceLastAccess);
    double reinforcementBonus = 1.0 + (0.05 * Math.log(1 + entry.getAccessCount()));

    return Math.min(1.0, confidence * timeDecay * reinforcementBonus);
  }
}
