package com.assistant.memory.infrastructure.embedding;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class InProcessEmbeddingServiceTest {

  private InProcessEmbeddingService embeddingService;

  @BeforeEach
  void setUp() {
    embeddingService = new InProcessEmbeddingService();
  }

  @Test
  void shouldProduceCorrectDimension() {
    float[] vector = embeddingService.embed("Project architectural blueprint");
    assertNotNull(vector);
    assertEquals(384, vector.length);
    assertEquals(384, embeddingService.getDimension());
  }

  @Test
  void shouldNormalizeToUnitLength() {
    float[] vector = embeddingService.embed("Testing normalization vector mathematics");
    double sumSq = 0.0;
    for (float v : vector) {
      sumSq += v * v;
    }
    assertTrue(Math.abs(1.0 - sumSq) < 0.01, "Vector norm should be approximately 1.0");
  }

  @Test
  void shouldProducePositiveSimilarityForRelatedTexts() {
    float[] textA = embeddingService.embed("Sprint planning and backlog review");
    float[] textB = embeddingService.embed("Sprint planning meeting schedule");
    float[] unrelated = embeddingService.embed("Cooking recipes for delicious chocolate cookies");

    double simRelated = cosineSimilarity(textA, textB);
    double simUnrelated = cosineSimilarity(textA, unrelated);

    assertTrue(
        simRelated > simUnrelated,
        "Related texts should have strictly higher similarity than unrelated text");
  }

  @Test
  void shouldHandleEmptyOrBlankTextsGracefully() {
    float[] emptyVector = embeddingService.embed("");
    assertEquals(384, emptyVector.length);
    assertEquals(0.0f, emptyVector[0]);

    List<float[]> batch = embeddingService.embedBatch(List.of());
    assertTrue(batch.isEmpty());
  }

  private double cosineSimilarity(float[] a, float[] b) {
    double dot = 0.0;
    for (int i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }
    return dot;
  }
}
