package com.assistant.memory.infrastructure.embedding;

import com.assistant.memory.application.ports.out.EmbeddingPort;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * In-process embedding service that generates 384-dimensional vector embeddings within the JVM.
 * Operates zero-cost, privacy-first, without requiring third-party API keys or remote calls.
 */
@Service
public class InProcessEmbeddingService implements EmbeddingPort {

  private static final Logger log = LoggerFactory.getLogger(InProcessEmbeddingService.class);
  public static final int DIMENSION = 384;

  public InProcessEmbeddingService() {
    log.info("Initialized InProcessEmbeddingService with fixed dimension {}", DIMENSION);
  }

  @Override
  public float[] embed(String text) {
    if (text == null || text.isBlank()) {
      return new float[DIMENSION];
    }
    return computeEmbedding(text.trim());
  }

  @Override
  public List<float[]> embedBatch(List<String> texts) {
    if (texts == null || texts.isEmpty()) {
      return List.of();
    }
    List<float[]> results = new ArrayList<>(texts.size());
    for (String text : texts) {
      results.add(embed(text));
    }
    return results;
  }

  @Override
  public int getDimension() {
    return DIMENSION;
  }

  private static final java.util.regex.Pattern WHITESPACE_PATTERN =
      java.util.regex.Pattern.compile("\\s+");

  /**
   * Generates a normalized semantic dense vector representation for the text. Employs subword-level
   * feature hash projection with cosine unit-length normalization.
   */
  private float[] computeEmbedding(String text) {
    float[] vector = new float[DIMENSION];
    String normalized = text.toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ");
    String[] tokens = WHITESPACE_PATTERN.split(normalized);

    for (int t = 0; t < tokens.length; t++) {
      String token = tokens[t];
      projectToken(token, vector, 1.0f);

      // Subword character n-grams (tri-grams) for robust morphological capturing
      if (token.length() >= 3) {
        for (int i = 0; i <= token.length() - 3; i++) {
          String ngram = token.substring(i, i + 3);
          projectToken(ngram, vector, 0.4f);
        }
      }
    }

    normalizeToUnitLength(vector);
    return vector;
  }

  private void projectToken(String token, float[] vector, float weight) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(token.getBytes(StandardCharsets.UTF_8));

      for (int i = 0; i < digest.length - 1; i += 2) {
        int index = ((digest[i] & 0xFF) << 8 | (digest[i + 1] & 0xFF)) % DIMENSION;
        float val = ((digest[i] % 2 == 0) ? 1.0f : -1.0f) * weight;
        vector[index] += val;
      }
    } catch (NoSuchAlgorithmException e) {
      int hash = (token.hashCode() & 0x7fffffff) % DIMENSION;
      vector[hash] += weight;
    }
  }

  private void normalizeToUnitLength(float[] vector) {
    double sumSq = 0.0;
    for (float v : vector) {
      sumSq += v * v;
    }
    if (sumSq <= 0.0) {
      return;
    }
    float norm = (float) Math.sqrt(sumSq);
    for (int i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }
}
