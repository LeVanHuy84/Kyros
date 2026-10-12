package com.assistant.memory.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DocumentChunkingServiceTest {

  private DocumentChunkingService chunkingService;

  @BeforeEach
  void setUp() {
    chunkingService = new DocumentChunkingService();
  }

  @Test
  void shouldReturnSingleChunkForShortText() {
    String text = "Quick meeting note regarding release timeline.";
    List<DocumentChunkingService.Chunk> chunks = chunkingService.chunkText(text);

    assertEquals(1, chunks.size());
    assertEquals(0, chunks.get(0).index());
    assertEquals(text, chunks.get(0).content());
  }

  @Test
  void shouldSplitLongDocumentIntoMultipleChunksWithOverlap() {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < 20; i++) {
      sb.append("This is paragraph ").append(i).append(" discussing architecture and design.\n\n");
    }
    String longText = sb.toString();

    List<DocumentChunkingService.Chunk> chunks = chunkingService.chunkText(longText, 200, 40);

    assertTrue(chunks.size() > 1, "Long document should be split into multiple chunks");
    for (int i = 0; i < chunks.size(); i++) {
      assertEquals(i, chunks.get(i).index());
      assertFalse(chunks.get(i).content().isEmpty());
    }
  }

  @Test
  void shouldHandleNullOrBlankTextGracefully() {
    assertTrue(chunkingService.chunkText(null).isEmpty());
    assertTrue(chunkingService.chunkText("   ").isEmpty());
  }
}
