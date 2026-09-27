package com.assistant.bootstrap.memory;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.service.FactExtractionService;
import com.assistant.memory.application.service.MemoryConsolidationService;
import com.assistant.memory.domain.model.ExtractedFact;
import com.assistant.memory.domain.service.SensitiveDataScreeningResult;
import com.assistant.memory.domain.service.SensitiveFactScreeningService;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Orchestrator service for autonomous long-term memory synthesis: Fact Extraction -> Sensitive
 * Privacy Screening -> PgVector/Semantic Memory Consolidation.
 */
@Service
public class MemorySynthesisService {

  private static final Logger log = LoggerFactory.getLogger(MemorySynthesisService.class);

  private final FactExtractionService factExtractionService;
  private final SensitiveFactScreeningService sensitiveFactScreeningService;
  private final MemoryConsolidationService memoryConsolidationService;

  public MemorySynthesisService(
      FactExtractionService factExtractionService,
      SensitiveFactScreeningService sensitiveFactScreeningService,
      MemoryConsolidationService memoryConsolidationService) {
    this.factExtractionService = factExtractionService;
    this.sensitiveFactScreeningService = sensitiveFactScreeningService;
    this.memoryConsolidationService = memoryConsolidationService;
  }

  public List<String> extractAndStoreFacts(
      WorkspaceId workspaceId, UserId userId, String conversationText) {
    if (conversationText == null || conversationText.isBlank()) {
      return List.of();
    }

    // 1. Fact Extraction
    List<ExtractedFact> extractedFacts = factExtractionService.extractFacts(conversationText);
    if (extractedFacts.isEmpty()) {
      return List.of();
    }

    List<String> processedFactContents = new ArrayList<>();
    for (ExtractedFact fact : extractedFacts) {
      // 2. Sensitive Fact Screening (Privacy Guard)
      SensitiveDataScreeningResult screening = sensitiveFactScreeningService.screen(fact.content());
      if (!screening.isAllowed()) {
        log.warn("Memory fact candidate rejected by privacy screening: {}", screening.reason());
        continue;
      }

      // 3. Memory Consolidation (Deduplicate / Reinforce / Revise)
      try {
        var consolidation = memoryConsolidationService.consolidate(workspaceId, userId, fact);
        if (consolidation.type() != MemoryConsolidationService.ConsolidationResultType.IGNORED) {
          log.info(
              "Autonomous memory consolidated: {} -> {}", consolidation.type(), fact.content());
          processedFactContents.add(fact.content());
        }
      } catch (Exception e) {
        log.error("Failed to consolidate memory fact: {}", e.getMessage());
      }
    }

    return processedFactContents;
  }
}
