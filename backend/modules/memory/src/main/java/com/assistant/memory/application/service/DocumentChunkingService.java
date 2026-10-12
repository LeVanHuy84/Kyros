package com.assistant.memory.application.service;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Service responsible for recursive text chunking with token/character boundary overlaps for vector
 * indexing and semantic retrieval.
 */
@Service
public class DocumentChunkingService {

  private static final int DEFAULT_CHUNK_SIZE = 500;
  private static final int DEFAULT_CHUNK_OVERLAP = 80;

  public record Chunk(int index, String content) {}

  public List<Chunk> chunkText(String text) {
    return chunkText(text, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP);
  }

  public List<Chunk> chunkText(String text, int chunkSize, int overlap) {
    if (text == null || text.isBlank()) {
      return List.of();
    }

    String trimmed = text.trim();
    if (trimmed.length() <= chunkSize) {
      return List.of(new Chunk(0, trimmed));
    }

    List<Chunk> chunks = new ArrayList<>();
    int start = 0;
    int chunkIndex = 0;

    while (start < trimmed.length()) {
      int end = Math.min(start + chunkSize, trimmed.length());

      // Try to break at a natural boundary (newline, period, space)
      if (end < trimmed.length()) {
        int naturalBreak = findNaturalBreak(trimmed, start, end);
        if (naturalBreak > start) {
          end = naturalBreak;
        }
      }

      String chunkContent = trimmed.substring(start, end).trim();
      if (!chunkContent.isEmpty()) {
        chunks.add(new Chunk(chunkIndex++, chunkContent));
      }

      if (end >= trimmed.length()) {
        break;
      }

      start = Math.max(start + 1, end - overlap);
    }

    return chunks;
  }

  private int findNaturalBreak(String text, int start, int end) {
    // Look backwards from end for paragraph break, sentence end, or space
    for (int i = end; i > start + (end - start) / 2; i--) {
      char c = text.charAt(i - 1);
      if (c == '\n') {
        return i;
      }
    }
    for (int i = end; i > start + (end - start) / 2; i--) {
      char c = text.charAt(i - 1);
      if (c == '.' || c == '?' || c == '!') {
        return i;
      }
    }
    for (int i = end; i > start + (end - start) / 2; i--) {
      char c = text.charAt(i - 1);
      if (Character.isWhitespace(c)) {
        return i;
      }
    }
    return end;
  }
}
